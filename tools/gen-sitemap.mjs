#!/usr/bin/env node
/* Everlight Digital — sitemap generator.
 *
 * Walks the repo's HTML pages and writes sitemap.xml. lastmod comes from the
 * file's last git commit date, so it stays honest without hand-maintenance.
 *
 *   node tools/gen-sitemap.mjs          # write
 *   node tools/gen-sitemap.mjs --check  # fail if sitemap.xml is stale
 */

import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const ORIGIN = 'https://everlight-digital.com';
const CHECK = process.argv.includes('--check');
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'sitemap.xml');

const NOT_A_PAGE = new Set(['brand/partials/footer.html']);

/** Crawl weighting: marketing surfaces lead, legal boilerplate trails. */
function rank(file) {
  if (file === 'index.html') return { priority: '1.0', changefreq: 'weekly' };
  if (file === 'journal/index.html') return { priority: '0.9', changefreq: 'weekly' };
  if (file.startsWith('apps/')) return { priority: '0.9', changefreq: 'monthly' };
  if (file.startsWith('journal/')) return { priority: '0.8', changefreq: 'monthly' };
  if (['privacy.html', 'terms.html', 'support.html'].includes(file))
    return { priority: '0.3', changefreq: 'yearly' };
  return { priority: '0.2', changefreq: 'yearly' }; // per-app legal/support pages
}

function urlFor(file) {
  if (file === 'index.html') return `${ORIGIN}/`;
  if (file.endsWith('/index.html')) return `${ORIGIN}/${file.slice(0, -'index.html'.length)}`;
  return `${ORIGIN}/${file}`;
}

function lastmod(file) {
  try {
    const out = execSync(`git log -1 --format=%cs -- ${JSON.stringify(file)}`, {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    return out || '2026-07-12';
  } catch {
    return '2026-07-12';
  }
}

const files = globSync('**/*.html', { cwd: ROOT })
  .filter((f) => !f.startsWith('.git/') && !f.startsWith('tools/'))
  .filter((f) => !NOT_A_PAGE.has(f))
  .sort();

const entries = files.map((f) => {
  const { priority, changefreq } = rank(f);
  return [
    '  <url>',
    `    <loc>${urlFor(f)}</loc>`,
    `    <lastmod>${lastmod(f)}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
});

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries.join('\n') +
  '\n</urlset>\n';

if (CHECK) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    console.error('sitemap.xml missing — run: node tools/gen-sitemap.mjs');
    process.exit(1);
  }
  if (current !== xml) {
    console.error('sitemap.xml is stale — run: node tools/gen-sitemap.mjs');
    process.exit(1);
  }
  console.log(`sitemap.xml up to date (${files.length} URLs).`);
} else {
  writeFileSync(OUT, xml);
  console.log(`Wrote sitemap.xml with ${files.length} URLs.`);
}
