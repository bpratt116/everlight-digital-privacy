# Everlight Digital Marketing Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn everlight-digital.com from a privacy/legal hub into a studio marketing site — homepage + 5 per-app story pages + a journal — that showcases the portfolio and funnels into the paid SaaS products.

**Architecture:** Hand-authored static HTML on the existing `everlight-digital-privacy` repo. One shared stylesheet (`/brand/site.css`, extended not replaced). No build step, no framework. Commit → push → auto-publishes. Verification is link-checking + content-grep + browser visual QA (no unit-test framework — it's static HTML).

**Tech Stack:** HTML5, CSS (Manrope, existing brand tokens), `python3 -m http.server` for local preview, a small bash link-check script.

## Global Constraints

- Brand locked: gradient `#F5B042`→`#EE5A6F`→`#7C3AED` (135deg), never recolor; font Manrope; beacon mark + "everlight DIGITAL" lockup; tagline "Calm, honest software."
- Neutrals from existing tokens only (`--el-ink #0E0B14` … `--el-paper #FFFFFF`).
- Positioning sub-headline verbatim: "A one-person studio building calm, honest software for faith, family, and the everyday."
- Featured apps = exactly these 5: Pilgrim, Shepherd, EventFlow, Pasture, Regen. **Clarity must NOT appear anywhere.**
- No external asset hosts — all icons/screenshots self-hosted in repo. Missing screenshot → gradient placeholder, never a broken `<img>`.
- Every page loads `/brand/site.css`. No per-page `<style>` blocks except tiny page-scoped tweaks.
- Legal pages (privacy/terms/support + per-app) stay reachable from every footer.
- Do not push. Commit locally; Brendan batches the push.

## File Structure

```
index.html                       REPLACE — studio homepage
apps/pilgrim.html                CREATE
apps/shepherd.html               CREATE
apps/eventflow.html              CREATE
apps/pasture.html                CREATE
apps/regen.html                  CREATE
journal/index.html               CREATE — article index
journal/why-calm-software.html   CREATE
journal/building-shepherd.html   CREATE
journal/six-apps-in-a-year.html  CREATE
journal/pilgrim-no-guilt.html    CREATE
brand/site.css                   MODIFY — append marketing components + dark mode
brand/partials/footer.html       CREATE — canonical footer source (copy/paste reference)
assets/apps/<slug>/*             CREATE — icons + screenshots (gathered)
tools/linkcheck.sh               CREATE — local link + Clarity-absence check
```

Old `index.html` (legal hub) content is superseded; its links (privacy/terms/support/per-app) move into the new footer.

---

### Task 1: Link-check + guardrail script

**Files:**
- Create: `tools/linkcheck.sh`

**Interfaces:**
- Produces: `tools/linkcheck.sh` — run from repo root; exits non-zero if any local `href`/`src` target is missing, or if the string "clarity"/"Clarity" appears in any marketing page (`index.html`, `apps/`, `journal/`).

- [ ] **Step 1: Write the script**

```bash
#!/usr/bin/env bash
# Static link + guardrail check for the Everlight marketing site.
# Usage: bash tools/linkcheck.sh
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
fail=0

pages=$(find index.html apps journal -name '*.html' 2>/dev/null)

# 1) Every local href/src must resolve to a file that exists.
for p in $pages; do
  # extract href="..." and src="..." values
  grep -oE '(href|src)="[^"]+"' "$p" | sed -E 's/^(href|src)="//; s/"$//' | while read -r target; do
    case "$target" in
      http*|mailto:*|\#*|tel:*) continue ;;         # external / anchors — skip
    esac
    # strip query/hash, resolve leading slash to repo root
    clean="${target%%\#*}"; clean="${clean%%\?*}"
    [ -z "$clean" ] && continue
    if [ "${clean:0:1}" = "/" ]; then fspath=".${clean}"; else fspath="$(dirname "$p")/${clean}"; fi
    # directory link → expect index.html
    if [ -d "$fspath" ]; then fspath="${fspath%/}/index.html"; fi
    if [ ! -e "$fspath" ]; then echo "BROKEN LINK  $p  ->  $target"; fail=1; fi
  done
done

# 2) Clarity must never appear in marketing pages.
if grep -rniE 'clarity' $pages >/dev/null 2>&1; then
  echo "GUARDRAIL: 'clarity' found in marketing pages:"; grep -rniE 'clarity' $pages; fail=1
fi

if [ "$fail" -eq 0 ]; then echo "linkcheck: OK"; fi
exit "$fail"
```

- [ ] **Step 2: Make executable + run against current repo**

Run: `chmod +x tools/linkcheck.sh && bash tools/linkcheck.sh`
Expected: prints `linkcheck: OK` (no marketing pages exist yet, so nothing to break). If the subshell `fail` var doesn't propagate on your bash, rewrite the loop to use a temp file — but on macOS default bash 3.2 the `while` runs in a subshell, so change the two `fail=1` lines to `echo BROKEN >> /tmp/lc_fail` and check the file at the end.

- [ ] **Step 3: Fix the subshell propagation now (macOS bash 3.2)**

Replace the link-loop and final check so failures survive the pipe subshell:

```bash
: > /tmp/el_linkcheck_fail
for p in $pages; do
  grep -oE '(href|src)="[^"]+"' "$p" | sed -E 's/^(href|src)="//; s/"$//' | while read -r target; do
    case "$target" in http*|mailto:*|\#*|tel:*) continue ;; esac
    clean="${target%%\#*}"; clean="${clean%%\?*}"; [ -z "$clean" ] && continue
    if [ "${clean:0:1}" = "/" ]; then fspath=".${clean}"; else fspath="$(dirname "$p")/${clean}"; fi
    [ -d "$fspath" ] && fspath="${fspath%/}/index.html"
    [ ! -e "$fspath" ] && echo "BROKEN LINK  $p  ->  $target" | tee -a /tmp/el_linkcheck_fail
  done
done
grep -rniE 'clarity' $pages | tee -a /tmp/el_linkcheck_fail
[ -s /tmp/el_linkcheck_fail ] && { echo "linkcheck: FAIL"; exit 1; }
echo "linkcheck: OK"
```

- [ ] **Step 4: Run again, confirm OK**

Run: `bash tools/linkcheck.sh`
Expected: `linkcheck: OK`

- [ ] **Step 5: Commit**

```bash
git add tools/linkcheck.sh
git commit -m "chore: add static link-check + Clarity guardrail script"
```

---

### Task 2: CSS foundation — marketing components + dark mode

**Files:**
- Modify: `brand/site.css` (append a new section; do not edit existing rules)

**Interfaces:**
- Produces CSS classes consumed by every later task: `.site-header`, `.el-hero`, `.el-hero__cta`, `.btn`, `.btn--primary`, `.btn--ghost`, `.section`, `.section--tint`, `.eyebrow`, `.pillars`, `.pillar`, `.app-grid`, `.app-card`, `.app-card__icon`, `.saas-band`, `.saas-card`, `.journal-list`, `.journal-item`, `.story-hero`, `.feature`, `.feature__shot`, `.placeholder-shot`, `.made-by`, `.article`, `.site-footer` (extend existing).
- Also produces dark-mode overrides via `@media (prefers-color-scheme: dark)`.

- [ ] **Step 1: Append the marketing CSS block**

Append to the end of `brand/site.css`:

```css
/* ============================================================
   MARKETING SITE COMPONENTS  (added 2026-07-12)
   Built on the existing tokens above. Brand unchanged.
   ============================================================ */

.wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

/* Buttons */
.btn { display: inline-block; font-weight: 700; font-size: 15px;
  padding: 12px 22px; border-radius: var(--el-radius-md); text-decoration: none;
  transition: transform .12s ease, opacity .12s ease; }
.btn:hover { text-decoration: none; transform: translateY(-1px); }
.btn--primary { background: var(--el-ink); color: var(--el-paper); }
.btn--ghost { background: transparent; color: var(--el-paper);
  border: 1.5px solid rgba(255,255,255,0.6); }
.btn--onlight { background: var(--el-ink); color: var(--el-paper); }

/* Site header (marketing nav, distinct from doc .topbar) */
.site-header { position: sticky; top: 0; z-index: 20; background: rgba(255,255,255,0.86);
  backdrop-filter: saturate(1.2) blur(8px); border-bottom: 1px solid rgba(14,11,20,0.06); }
.site-header .wrap { display: flex; align-items: center; justify-content: space-between; height: 60px; }
.site-header a.brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 800;
  color: var(--el-ink); }
.site-header a.brand img { height: 26px; width: auto; }
.site-header nav a { color: var(--el-graphite); font-weight: 600; font-size: 15px; margin-left: 24px; }

/* Hero */
.el-hero { background: var(--el-gradient); color: var(--el-paper); text-align: center;
  padding: 96px 24px 104px; }
.el-hero .lockup { width: 380px; max-width: 84%; height: auto; margin: 0 auto 22px; display: block; }
.el-hero h1 { color: var(--el-paper); font-size: 40px; margin: 0 0 12px; }
.el-hero p.tagline { font-size: 20px; font-weight: 600; margin: 0 0 6px; color: #fff; }
.el-hero p.sub { max-width: 620px; margin: 0 auto 28px; font-size: 18px;
  color: rgba(255,255,255,0.92); }
.el-hero__cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

/* Sections */
.section { padding: 72px 0; }
.section--tint { background: var(--el-cream); }
.eyebrow { font-size: 13px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  background: var(--el-gradient-text); -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; margin: 0 0 10px; }
.section h2 { border: 0; font-size: 30px; margin: 0 0 28px; }

/* Pillars */
.pillars { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
.pillar h3 { margin: 0 0 6px; font-size: 18px; }
.pillar p { margin: 0; color: var(--el-stone); }

/* App grid */
.app-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 20px; }
.app-card { display: block; padding: 24px; border-radius: var(--el-radius-lg);
  border: 1px solid rgba(14,11,20,0.08); background: var(--el-paper); color: var(--el-ink);
  transition: transform .14s ease, box-shadow .14s ease; }
.app-card:hover { text-decoration: none; transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(14,11,20,0.10); }
.app-card__icon { width: 56px; height: 56px; border-radius: 13px; display: block; margin-bottom: 14px; }
.app-card .name { font-weight: 800; font-size: 18px; }
.app-card .tag { color: var(--el-stone); font-size: 15px; margin-top: 4px; }
.app-card .badge { display: inline-block; margin-top: 12px; font-size: 12px; font-weight: 700;
  letter-spacing: 0.04em; color: var(--el-violet); }

/* SaaS funnel band */
.saas-band { background: var(--el-ink); color: var(--el-paper); }
.saas-band .eyebrow { color: transparent; }
.saas-band h2 { color: var(--el-paper); }
.saas-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.saas-card { padding: 24px; border-radius: var(--el-radius-lg);
  border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); }
.saas-card h3 { color: var(--el-paper); margin: 0 0 6px; }
.saas-card p { color: rgba(255,255,255,0.72); margin: 0 0 16px; }

/* Journal */
.journal-list { list-style: none; padding: 0; margin: 0; }
.journal-item { padding: 22px 0; border-bottom: 1px solid rgba(14,11,20,0.08); }
.journal-item a { color: var(--el-ink); font-weight: 800; font-size: 20px; }
.journal-item .date { color: var(--el-stone); font-size: 13px; font-weight: 600; }
.journal-item .dek { color: var(--el-stone); margin: 6px 0 0; }

/* Story page */
.story-hero { background: var(--el-gradient); color: var(--el-paper); padding: 72px 24px; }
.story-hero .wrap { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.story-hero img.icon { width: 88px; height: 88px; border-radius: 20px; }
.story-hero h1 { color: var(--el-paper); margin: 0 0 6px; }
.story-hero .tag { font-size: 18px; color: rgba(255,255,255,0.92); }
.story-hero .platform { font-size: 12px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: rgba(255,255,255,0.8); margin: 8px 0 16px; }
.feature { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: center;
  margin: 40px 0; }
.feature:nth-child(even) .feature__shot { order: 2; }
.feature h3 { font-size: 20px; margin: 0 0 8px; }
.feature p { color: var(--el-stone); margin: 0; }
.feature__shot img { width: 100%; border-radius: var(--el-radius-lg); display: block; }
.placeholder-shot { width: 100%; aspect-ratio: 4/3; border-radius: var(--el-radius-lg);
  background: var(--el-gradient); opacity: 0.9; }
.made-by { background: var(--el-cream); border-radius: var(--el-radius-lg); padding: 28px;
  text-align: center; margin: 48px 0; }

/* Long-form article */
.article { max-width: 720px; margin: 0 auto; padding: 56px 24px; }
.article h1 { font-size: 34px; }
.article .date { color: var(--el-stone); font-weight: 600; font-size: 14px; margin-bottom: 24px; }
.article p, .article li { font-size: 18px; line-height: 1.7; }
.article h2 { border: 0; margin-top: 36px; }

/* Footer (extend existing .site-footer) */
.site-footer .foot-grid { display: flex; flex-wrap: wrap; gap: 32px; justify-content: space-between;
  max-width: 1080px; margin: 0 auto; padding: 40px 24px; }
.site-footer .foot-grid a { display: block; color: var(--el-stone); font-weight: 500; margin: 4px 0; }

/* Responsive */
@media (max-width: 820px) {
  .pillars, .saas-grid { grid-template-columns: 1fr; }
  .feature { grid-template-columns: 1fr; }
  .feature:nth-child(even) .feature__shot { order: 0; }
  .el-hero h1 { font-size: 32px; }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  body { background: var(--el-ink); color: var(--el-cream); }
  h1, h2, h3 { color: var(--el-cream); }
  .site-header { background: rgba(14,11,20,0.86); border-bottom-color: rgba(255,255,255,0.08); }
  .site-header a.brand { color: var(--el-cream); }
  .site-header nav a { color: var(--el-mist); }
  .section--tint, .made-by { background: var(--el-graphite); }
  .app-card { background: var(--el-graphite); border-color: rgba(255,255,255,0.08); color: var(--el-cream); }
  .app-card .tag, .pillar p, .journal-item .dek, .journal-item .date, .article .date { color: var(--el-mist); }
  .journal-item a { color: var(--el-cream); }
  .btn--primary, .btn--onlight { background: var(--el-cream); color: var(--el-ink); }
}
```

- [ ] **Step 2: Sanity-check CSS parses (no unclosed braces)**

Run: `node -e "const c=require('fs').readFileSync('brand/site.css','utf8');const o=(c.match(/{/g)||[]).length,x=(c.match(/}/g)||[]).length;if(o!==x){console.error('brace mismatch',o,x);process.exit(1)}console.log('braces balanced',o)"`
Expected: `braces balanced <n>`

- [ ] **Step 3: Commit**

```bash
git add brand/site.css
git commit -m "feat(css): marketing components + dark mode"
```

---

### Task 3: Canonical footer partial

**Files:**
- Create: `brand/partials/footer.html`

**Interfaces:**
- Produces: the exact footer HTML block that Tasks 4–9 paste verbatim into every page (keeps legal links reachable everywhere). Consumers copy this block; it is not server-included.

- [ ] **Step 1: Write the footer block**

```html
<footer class="site-footer">
  <div class="foot-grid">
    <div>
      <a href="/" style="font-weight:800;color:inherit">Everlight Digital</a>
      <a href="mailto:brendan@everlight-digital.com">brendan@everlight-digital.com</a>
    </div>
    <div>
      <strong style="font-size:13px;letter-spacing:.06em;text-transform:uppercase">Apps</strong>
      <a href="/apps/pilgrim">Pilgrim</a>
      <a href="/apps/shepherd">Shepherd</a>
      <a href="/apps/eventflow">EventFlow</a>
      <a href="/apps/pasture">Pasture</a>
      <a href="/apps/regen">Regen</a>
    </div>
    <div>
      <strong style="font-size:13px;letter-spacing:.06em;text-transform:uppercase">More</strong>
      <a href="/journal/">Journal</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/support">Support</a>
    </div>
  </div>
  <p class="legal" style="text-align:center;color:var(--el-stone);padding:0 24px 32px;margin:0">
    &copy; 2026 Everlight Digital. All rights reserved.</p>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add brand/partials/footer.html
git commit -m "feat: canonical marketing footer partial"
```

---

### Task 4: Gather app icons + screenshots

**Files:**
- Create: `assets/apps/pilgrim/`, `.../shepherd/`, `.../eventflow/`, `.../pasture/`, `.../regen/`

**Interfaces:**
- Produces: `assets/apps/<slug>/icon.png` for each of the 5 apps, plus 0–4 `shot-N.png` screenshots each. Story pages reference these; missing shots fall back to `.placeholder-shot` (Task 6), so icons are the only hard requirement.

- [ ] **Step 1: Locate existing icons/screenshots in project dirs**

Run:
```bash
for d in "Pilgrim" "Shepherd" "EventFlow" "PastureWeb" "Fitness App"; do
  echo "=== $d ==="; find "$HOME/Documents/$d" -maxdepth 4 \( -iname '*icon*.png' -o -iname '*appstore*' -o -iname '*screenshot*' \) 2>/dev/null | head -8
done
```
Expected: a list of candidate PNGs. Note which apps have usable art.

- [ ] **Step 2: Copy an icon per app into assets (repeat per app that has one)**

For each found icon: `mkdir -p assets/apps/<slug> && cp "<source.png>" assets/apps/<slug>/icon.png`
For any app with NO icon found: create a temporary gradient PNG placeholder is unnecessary — the story-hero/app-card `<img>` will 404. Instead, for a missing icon, set that app card/hero to use the beacon mark: `assets/apps/<slug>/icon.png` → copy `brand/beacon-gradient.svg` to `assets/apps/<slug>/icon.svg` and reference the `.svg`. Record per-app which extension you used.

- [ ] **Step 3: Copy 0–4 screenshots per app where they exist**

`cp "<shot>.png" assets/apps/<slug>/shot-1.png` (…shot-2, shot-3). Skip apps with none — Task 6 renders placeholders.

- [ ] **Step 4: Record the asset inventory**

Create `assets/apps/INVENTORY.md` listing, per app: icon path (png or svg) + number of screenshots (0–4). Tasks 6 uses this to decide real `<img>` vs `.placeholder-shot`.

- [ ] **Step 5: Commit**

```bash
git add assets/apps
git commit -m "assets: app icons + screenshots for story pages"
```

---

### Task 5: Studio homepage

**Files:**
- Modify: `index.html` (full replace of the legal-hub body)

**Interfaces:**
- Consumes: Task 2 CSS classes, Task 3 footer block, Task 4 icons (`assets/apps/<slug>/icon.*`).
- Produces: `/index.html` linking to `/apps/*.html` (Task 6) and `/journal/` (Task 7). Those targets may not exist yet — linkcheck is run at the END of Task 9, not here.

- [ ] **Step 1: Replace `index.html`**

Full file (swap each `icon.*` extension to match Task 4's inventory):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Everlight Digital — Calm, honest software</title>
<meta name="description" content="A one-person studio building calm, honest software for faith, family, and the everyday. Makers of Pilgrim, Shepherd, EventFlow, Pasture, and Regen.">
<meta property="og:title" content="Everlight Digital — Calm, honest software">
<meta property="og:description" content="A one-person studio building calm, honest software for faith, family, and the everyday.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://everlight-digital.com/">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0E0B14">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/brand/site.css">
</head>
<body>

<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/"><img src="/brand/beacon-gradient.svg" alt="">Everlight Digital</a>
    <nav>
      <a href="#apps">Apps</a>
      <a href="#saas">Software</a>
      <a href="/journal/">Journal</a>
    </nav>
  </div>
</header>

<section class="el-hero">
  <img class="lockup" src="/brand/lockup-gradient.svg" alt="Everlight Digital">
  <p class="tagline">Calm, honest software.</p>
  <p class="sub">A one-person studio building calm, honest software for faith, family, and the everyday.</p>
  <div class="el-hero__cta">
    <a class="btn btn--onlight" href="#apps">See what we build</a>
    <a class="btn btn--ghost" href="mailto:brendan@everlight-digital.com">Work with us</a>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <p class="eyebrow">What we build</p>
    <div class="pillars">
      <div class="pillar"><h3>Faith &amp; habit apps</h3><p>Tools for prayer, scripture, and healthier daily rhythms — without guilt mechanics. Pilgrim, Regen.</p></div>
      <div class="pillar"><h3>Church &amp; org software</h3><p>Web software that helps churches and organizations care for and coordinate their people. Shepherd, EventFlow, Pasture.</p></div>
      <div class="pillar"><h3>Everyday tools</h3><p>Small, focused apps for the everyday — added to the portfolio as they ship.</p></div>
    </div>
  </div>
</section>

<section class="section section--tint" id="apps">
  <div class="wrap">
    <p class="eyebrow">Featured</p>
    <h2>Apps we make</h2>
    <div class="app-grid">
      <a class="app-card" href="/apps/pilgrim">
        <img class="app-card__icon" src="/assets/apps/pilgrim/icon.png" alt="Pilgrim icon">
        <div class="name">Pilgrim</div><div class="tag">Bible &amp; prayer, without the guilt mechanics</div>
        <span class="badge">iOS →</span></a>
      <a class="app-card" href="/apps/shepherd">
        <img class="app-card__icon" src="/assets/apps/shepherd/icon.png" alt="Shepherd icon">
        <div class="name">Shepherd</div><div class="tag">Pastoral care software churches actually use</div>
        <span class="badge">Web →</span></a>
      <a class="app-card" href="/apps/eventflow">
        <img class="app-card__icon" src="/assets/apps/eventflow/icon.png" alt="EventFlow icon">
        <div class="name">EventFlow</div><div class="tag">Volunteer &amp; event coordination, simplified</div>
        <span class="badge">Web →</span></a>
      <a class="app-card" href="/apps/pasture">
        <img class="app-card__icon" src="/assets/apps/pasture/icon.png" alt="Pasture icon">
        <div class="name">Pasture</div><div class="tag">Cattle &amp; herd tracking on any device</div>
        <span class="badge">Web →</span></a>
      <a class="app-card" href="/apps/regen">
        <img class="app-card__icon" src="/assets/apps/regen/icon.png" alt="Regen icon">
        <div class="name">Regen</div><div class="tag">Recovery &amp; readiness, at a glance</div>
        <span class="badge">iOS →</span></a>
    </div>
  </div>
</section>

<section class="section saas-band" id="saas">
  <div class="wrap">
    <p class="eyebrow">For organizations</p>
    <h2>Software you can start today</h2>
    <div class="saas-grid">
      <div class="saas-card"><h3>Shepherd</h3><p>Pastoral care for churches — know your people, never lose track of who needs care.</p><a class="btn btn--onlight" href="https://www.pastorshepherd.com">Start free</a></div>
      <div class="saas-card"><h3>EventFlow</h3><p>Coordinate volunteers and events without the spreadsheet chaos.</p><a class="btn btn--onlight" href="https://app.everlight-digital.com">Start free</a></div>
      <div class="saas-card"><h3>Pasture</h3><p>Track cattle and herds from any device, in the barn or the field.</p><a class="btn btn--onlight" href="https://pasture.everlight-digital.com">Start free</a></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <p class="eyebrow">From the journal</p>
    <h2>Writing</h2>
    <ul class="journal-list">
      <li class="journal-item"><a href="/journal/why-calm-software">Why we build calm, honest software</a><p class="dek">The philosophy behind everything Everlight makes.</p></li>
      <li class="journal-item"><a href="/journal/building-shepherd">Building Shepherd: pastoral care software churches actually use</a><p class="dek">What it takes to make software pastors trust.</p></li>
      <li class="journal-item"><a href="/journal/six-apps-in-a-year">What we learned shipping six apps in a year</a><p class="dek">Notes from a one-person studio.</p></li>
    </ul>
    <p style="margin-top:20px"><a href="/journal/">Read the journal →</a></p>
  </div>
</section>

<section class="section section--tint">
  <div class="wrap" style="max-width:680px;text-align:center">
    <p class="eyebrow">Our philosophy</p>
    <h2>Software that respects you</h2>
    <p style="font-size:19px;color:var(--el-stone)">No dark patterns. No manipulation. No selling your data. We build calm, honest tools that do their job and get out of your way — and we charge a fair price instead of mining your attention.</p>
  </div>
</section>

<!-- BEGIN footer (from brand/partials/footer.html) -->
<!-- paste the exact block from brand/partials/footer.html here -->
<!-- END footer -->

</body>
</html>
```

- [ ] **Step 2: Paste the footer**

Replace the footer comment block with the exact contents of `brand/partials/footer.html`.

- [ ] **Step 3: Preview locally**

Run: `python3 -m http.server 8765 >/dev/null 2>&1 & sleep 1; echo "open http://localhost:8765/"; ` — open it, confirm hero, 5 app cards, SaaS band, journal teaser, footer all render. Kill server after: `kill %1` (or `pkill -f "http.server 8765"`).

- [ ] **Step 4: Grep-verify required content + Clarity absence**

Run: `grep -c 'app-card' index.html; grep -i clarity index.html || echo "no clarity: good"`
Expected: `5` app cards; `no clarity: good`.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: studio marketing homepage"
```

---

### Task 6: Per-app story pages (5 pages)

**Files:**
- Create: `apps/pilgrim.html`, `apps/shepherd.html`, `apps/eventflow.html`, `apps/pasture.html`, `apps/regen.html`

**Interfaces:**
- Consumes: Task 2 CSS, Task 3 footer, Task 4 assets + `INVENTORY.md`.
- Produces: 5 pages linked from homepage + footer. Each app's per-app privacy page already exists (`/pilgrim/`, `/regen/privacy.html`, `/pasture/privacy`, etc.) — link to it.

**Story template** — build each page from this skeleton. Fill `SLUG/NAME/TAGLINE/PLATFORM/CTA_URL/CTA_LABEL/PRIVACY_URL`, write a 1-paragraph problem statement, 3 feature blocks (heading + one sentence each), and a who-it's-for line. For each feature block use a real screenshot if `INVENTORY.md` lists one, else the `.placeholder-shot` div.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NAME — Everlight Digital</title>
<meta name="description" content="NAME — TAGLINE. Made by Everlight Digital.">
<meta property="og:title" content="NAME — Everlight Digital">
<meta property="og:description" content="TAGLINE">
<meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#0E0B14">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/brand/site.css">
</head>
<body>
<header class="site-header"><div class="wrap">
  <a class="brand" href="/"><img src="/brand/beacon-gradient.svg" alt="">Everlight Digital</a>
  <nav><a href="/#apps">Apps</a><a href="/journal/">Journal</a></nav>
</div></header>

<section class="story-hero"><div class="wrap">
  <img class="icon" src="/assets/apps/SLUG/icon.png" alt="NAME icon">
  <div>
    <h1>NAME</h1>
    <div class="tag">TAGLINE</div>
    <div class="platform">PLATFORM</div>
    <a class="btn btn--onlight" href="CTA_URL">CTA_LABEL</a>
  </div>
</div></section>

<section class="section"><div class="wrap" style="max-width:760px">
  <p class="eyebrow">The problem</p>
  <p style="font-size:19px;color:var(--el-stone)">PROBLEM_PARAGRAPH</p>
</div></section>

<section class="section section--tint"><div class="wrap">
  <p class="eyebrow">What it does</p>
  <div class="feature">
    <div><h3>FEATURE_1_TITLE</h3><p>FEATURE_1_TEXT</p></div>
    <div class="feature__shot"><!-- real: --><img src="/assets/apps/SLUG/shot-1.png" alt=""><!-- or placeholder: <div class="placeholder-shot"></div> --></div>
  </div>
  <div class="feature">
    <div><h3>FEATURE_2_TITLE</h3><p>FEATURE_2_TEXT</p></div>
    <div class="feature__shot"><div class="placeholder-shot"></div></div>
  </div>
  <div class="feature">
    <div><h3>FEATURE_3_TITLE</h3><p>FEATURE_3_TEXT</p></div>
    <div class="feature__shot"><div class="placeholder-shot"></div></div>
  </div>
</div></section>

<section class="section"><div class="wrap" style="max-width:680px;text-align:center">
  <p class="eyebrow">Who it's for</p>
  <p style="font-size:19px;color:var(--el-stone)">WHO_ITS_FOR</p>
  <div class="made-by">
    <p style="margin:0 0 12px">Made by <a href="/">Everlight Digital</a> — calm, honest software.</p>
    <a class="btn btn--primary" href="CTA_URL">CTA_LABEL</a>
  </div>
  <p><a href="PRIVACY_URL">NAME privacy policy</a></p>
</div></section>

<!-- paste brand/partials/footer.html -->
</body>
</html>
```

Per-app fill values:

| SLUG | NAME | TAGLINE | PLATFORM | CTA_URL | CTA_LABEL | PRIVACY_URL |
|---|---|---|---|---|---|---|
| pilgrim | Pilgrim | Bible & prayer, without the guilt mechanics | iOS | https://apps.apple.com/app/pilgrim | Get it on the App Store | /pilgrim/privacy.html |
| shepherd | Shepherd | Pastoral care software churches actually use | Web app | https://www.pastorshepherd.com | Start free | /privacy.html |
| eventflow | EventFlow | Volunteer & event coordination, simplified | Web app | https://app.everlight-digital.com | Start free | /privacy.html |
| pasture | Pasture | Cattle & herd tracking on any device | Web app | https://pasture.everlight-digital.com | Start free | /pasture/privacy |
| regen | Regen | Recovery & readiness, at a glance | iOS | https://apps.apple.com/app/regen | Get it on the App Store | /regen/privacy.html |

> Note: verify the exact App Store URLs for Pilgrim + Regen during build (`pulse` or App Store Connect). If unknown at build time, point the CTA at `/pilgrim/` and `/regen/privacy.html` respectively so there is no broken/incorrect external link, and leave a `<!-- TODO: real App Store URL -->` comment. Shepherd's PRIVACY_URL uses the master `/privacy.html` (Shepherd is covered there per the legal spec).

- [ ] **Step 1: Create `apps/pilgrim.html`** from the template + Pilgrim row. Write a real problem paragraph, 3 features, who-it's-for. Use real screenshots where INVENTORY lists them.
- [ ] **Step 2: Create `apps/shepherd.html`** likewise.
- [ ] **Step 3: Create `apps/eventflow.html`** likewise.
- [ ] **Step 4: Create `apps/pasture.html`** likewise.
- [ ] **Step 5: Create `apps/regen.html`** likewise.
- [ ] **Step 6: Paste the footer into all 5.**
- [ ] **Step 7: Verify each has no Clarity + a valid icon ref**

Run: `grep -riL 'placeholder\|shot-1' apps/ ; grep -ri clarity apps/ || echo "no clarity: good"`
Expected: `no clarity: good`.

- [ ] **Step 8: Commit**

```bash
git add apps/
git commit -m "feat: 5 per-app story pages"
```

---

### Task 7: Journal index + article template

**Files:**
- Create: `journal/index.html`

**Interfaces:**
- Consumes: Task 2 CSS, Task 3 footer.
- Produces: `/journal/` listing the 4 launch articles (Task 8). Directory link `/journal/` resolves to this `index.html`.

- [ ] **Step 1: Create `journal/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Journal — Everlight Digital</title>
<meta name="description" content="Notes on building calm, honest software — from the one-person studio behind Pilgrim, Shepherd, and more.">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#0E0B14">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/brand/site.css">
</head>
<body>
<header class="site-header"><div class="wrap">
  <a class="brand" href="/"><img src="/brand/beacon-gradient.svg" alt="">Everlight Digital</a>
  <nav><a href="/#apps">Apps</a><a href="/journal/">Journal</a></nav>
</div></header>

<section class="el-hero" style="padding:64px 24px 72px">
  <h1>Journal</h1>
  <p class="sub">Notes on building calm, honest software.</p>
</section>

<section class="section"><div class="wrap" style="max-width:760px">
  <ul class="journal-list">
    <li class="journal-item"><span class="date">July 2026</span><br><a href="/journal/why-calm-software">Why we build calm, honest software</a><p class="dek">The philosophy behind everything Everlight makes.</p></li>
    <li class="journal-item"><span class="date">July 2026</span><br><a href="/journal/building-shepherd">Building Shepherd: pastoral care software churches actually use</a><p class="dek">What it takes to make software pastors trust.</p></li>
    <li class="journal-item"><span class="date">July 2026</span><br><a href="/journal/six-apps-in-a-year">What we learned shipping six apps in a year</a><p class="dek">Notes from a one-person studio.</p></li>
    <li class="journal-item"><span class="date">July 2026</span><br><a href="/journal/pilgrim-no-guilt">Pilgrim: a Bible app without the guilt mechanics</a><p class="dek">Why streaks and shame have no place in a prayer app.</p></li>
  </ul>
</div></section>

<!-- paste brand/partials/footer.html -->
</body>
</html>
```

- [ ] **Step 2: Paste footer, commit**

```bash
git add journal/index.html
git commit -m "feat: journal index"
```

---

### Task 8: Four launch articles

**Files:**
- Create: `journal/why-calm-software.html`, `journal/building-shepherd.html`, `journal/six-apps-in-a-year.html`, `journal/pilgrim-no-guilt.html`

**Interfaces:**
- Consumes: Task 2 CSS, Task 3 footer.
- Produces: 4 article pages linked from journal index + homepage teaser.

**Article template** — fill `TITLE/SLUG/DATE/DEK/RELATED_APP_URL/RELATED_APP_LABEL` and write 500–900 words of real body prose in the `.article` main:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TITLE — Everlight Digital</title>
<meta name="description" content="DEK">
<meta property="og:title" content="TITLE">
<meta property="og:description" content="DEK">
<meta property="og:type" content="article">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#0E0B14">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/brand/site.css">
</head>
<body>
<header class="site-header"><div class="wrap">
  <a class="brand" href="/"><img src="/brand/beacon-gradient.svg" alt="">Everlight Digital</a>
  <nav><a href="/#apps">Apps</a><a href="/journal/">Journal</a></nav>
</div></header>

<article class="article">
  <p class="eyebrow">Journal</p>
  <h1>TITLE</h1>
  <div class="date">DATE</div>
  <!-- BODY: 500-900 words of real prose, <p>/<h2>/<ul> -->
  <div class="made-by" style="text-align:left;margin-top:48px">
    <p style="margin:0 0 12px">RELATED_CTA_SENTENCE</p>
    <a class="btn btn--primary" href="RELATED_APP_URL">RELATED_APP_LABEL</a>
  </div>
</article>

<!-- paste brand/partials/footer.html -->
</body>
</html>
```

Per-article spec:

| SLUG | TITLE | DATE | RELATED_APP_URL | RELATED_APP_LABEL | Body focus |
|---|---|---|---|---|---|
| why-calm-software | Why we build calm, honest software | July 2026 | /#apps | See what we build | Manifesto: dark patterns are the norm; Everlight's opposite bet — no manipulation, fair pricing, respect for attention. Tie to the 5 apps. |
| building-shepherd | Building Shepherd: pastoral care software churches actually use | July 2026 | https://www.pastorshepherd.com | Try Shepherd free | The problem (pastors lose track of who needs care), why existing ChMS fail small churches, how Shepherd is different. SEO: "pastoral care software", "church care". |
| six-apps-in-a-year | What we learned shipping six apps in a year | July 2026 | /#apps | Browse the portfolio | Build-in-public: lessons on scope, shipping, one-person studio workflow across faith/church/everyday apps. |
| pilgrim-no-guilt | Pilgrim: a Bible app without the guilt mechanics | July 2026 | https://apps.apple.com/app/pilgrim | Get Pilgrim | Why streaks/shame harm spiritual habits; Pilgrim's gentle design. If App Store URL unverified, use /apps/pilgrim.html + TODO comment. |

- [ ] **Step 1: Write `why-calm-software.html`** (full template + 500–900 words).
- [ ] **Step 2: Write `building-shepherd.html`.**
- [ ] **Step 3: Write `six-apps-in-a-year.html`.**
- [ ] **Step 4: Write `pilgrim-no-guilt.html`.**
- [ ] **Step 5: Paste footer into all 4; verify no Clarity**

Run: `grep -ri clarity journal/ || echo "no clarity: good"`
Expected: `no clarity: good`.

- [ ] **Step 6: Commit**

```bash
git add journal/
git commit -m "feat: 4 launch journal articles"
```

---

### Task 9: Final QA — linkcheck, dark mode, Lighthouse, legal reachability

**Files:**
- Modify: any page with a broken link or missing footer found in QA.

**Interfaces:**
- Consumes: everything. This is the ship gate.

- [ ] **Step 1: Run the link-check**

Run: `bash tools/linkcheck.sh`
Expected: `linkcheck: OK`. Fix any `BROKEN LINK` lines by correcting the href or creating the target. Fix any Clarity hit.

- [ ] **Step 2: Confirm the footer (and legal links) is on every marketing page**

Run: `for f in index.html apps/*.html journal/*.html; do grep -q 'site-footer' "$f" || echo "MISSING FOOTER: $f"; done; echo done`
Expected: only `done` (no MISSING lines).

- [ ] **Step 3: Confirm legal pages resolve**

Run: `for p in privacy.html terms.html support.html; do [ -f "$p" ] && echo "ok $p" || echo "MISSING $p"; done`
Expected: `ok` for all three.

- [ ] **Step 4: Visual QA in browser — light + dark, mobile + desktop**

Run: `python3 -m http.server 8765 >/dev/null 2>&1 &` then open `http://localhost:8765/`. Check: homepage, one app page, one article. Toggle OS dark mode — confirm readable (no dark text on dark bg). Resize to ~380px — confirm no horizontal scroll, features stack. Kill: `pkill -f "http.server 8765"`.

- [ ] **Step 5: Lighthouse pass (optional if Chrome available)**

Run (if installed): `npx -y lighthouse http://localhost:8765/ --only-categories=performance,seo,accessibility --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/el_lh.json && node -e "const r=require('/tmp/el_lh.json');for(const k of ['performance','seo','accessibility'])console.log(k, Math.round(r.categories[k].score*100))"`
Expected: seo + accessibility ≥ 90. If below, fix missing alt text / meta / heading order flagged in the report.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: marketing site QA fixes (linkcheck, footer, dark mode)"
```

- [ ] **Step 7: Report to Brendan**

Do NOT push (batch-sync rule). Report: pages built, screenshot gaps (which apps use placeholders), any App Store URLs left as TODO, and that it's ready for his review + `/sync-all`.

---

## Self-Review

**Spec coverage:** Homepage 7 sections → Task 5 ✓. Per-app template + 5 apps → Task 6 ✓. Journal index + 4 articles → Tasks 7–8 ✓. CSS + dark mode → Task 2 ✓. Screenshot degradation → Tasks 4/6 (`.placeholder-shot`) ✓. Footer/legal demotion → Tasks 3/9 ✓. Link-check/QA/Lighthouse → Task 9 ✓. Clarity exclusion → guardrail in Task 1 + grep in Tasks 5/6/8/9 ✓. No-build/static → whole plan ✓.

**Placeholder scan:** Prose bodies (articles) + per-app problem/feature copy are authored during execution — flagged explicitly as content, with focus/length specified per item, not left as bare "TODO". App Store URLs have an explicit fallback rule. `.placeholder-shot` is an intentional design element, not an unfinished step.

**Type/name consistency:** CSS class names in Task 2 match usages in Tasks 5–8 (`.app-card`, `.saas-card`, `.story-hero`, `.feature__shot`, `.placeholder-shot`, `.journal-item`, `.article`, `.made-by`, `.el-hero`, `.btn--onlight`). Footer class `.site-footer` extends the existing rule (compatible). Asset paths `/assets/apps/<slug>/icon.*` consistent between Tasks 4/5/6.
