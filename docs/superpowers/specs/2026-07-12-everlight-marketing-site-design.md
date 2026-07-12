# Everlight Digital — Marketing Site Design

**Date:** 2026-07-12
**Status:** Approved (design), pending spec review
**Repo:** `everlight-digital-privacy` (serves everlight-digital.com, static, push → auto-publish)

## Goal

Turn everlight-digital.com from a bare privacy/legal hub into a real studio marketing site that BOTH showcases the app portfolio AND funnels visitors into the paid web SaaS products (Shepherd, EventFlow, Pasture). Add per-app story pages and a journal/blog. Keep the existing brand 100% intact.

## Non-goals (YAGNI)

- No static-site-generator / build step (raw HTML + shared CSS, same as today). Revisit Astro only if the journal passes ~10 posts.
- No CMS, no comments, no newsletter signup backend (a plain mailto/contact is enough for v1).
- No rebrand. Gradient, Manrope, beacon mark, and "Calm, honest software." tagline are locked.
- No "coming soon" placeholder apps — feature only live/near-live products.

## Brand (locked — do not change)

- Identity gradient: amber `#F5B042` → coral `#EE5A6F` → violet `#7C3AED` (135deg). Never recolor.
- Font: Manrope.
- Beacon mark (chevron) + "everlight DIGITAL" lockup — `/brand/*.svg`.
- Tagline: "Calm, honest software."
- Neutrals already defined in `/brand/site.css` (`--el-ink #0E0B14` … `--el-paper #FFFFFF`).

## Positioning

Homepage sub-headline (approved, verbatim):
> A one-person studio building calm, honest software for faith, family, and the everyday.

## Architecture

Static HTML, one shared stylesheet, hand-authored pages. No framework. Deploy unchanged: commit → push → auto-publishes.

Every page loads `/brand/site.css` (extended, not replaced) so type/color/layout stay one source of truth.

### Site map

```
/                       studio homepage (REPLACES current legal-hub index.html)
/apps/<slug>.html       per-app story pages (curated live set)
/journal/index.html     article index
/journal/<slug>.html    individual articles
/privacy.html           keep, demote to footer
/terms.html             keep, demote to footer
/support.html           keep, demote to footer
/<app>/privacy...       keep unchanged (per-app legal)
/brand/site.css         EXTENDED with marketing components + dark mode
```

## Components / page specs

### 1. Homepage (`/index.html`)

Sections top→bottom:

1. **Hero** — beacon lockup, tagline "Calm, honest software.", positioning sub-headline (above), two CTAs: primary *See what we build* (→ #apps), secondary *Work with us* (→ mailto `brendan@everlight-digital.com` for v1). Gradient background band.
2. **What we build** — three pillars, each a short blurb:
   - Faith & habit apps (Pilgrim, Regen)
   - Church & organization software (Shepherd, EventFlow, Pasture)
   - Everyday tools (Clarity, and the wider portfolio)
3. **Featured apps** (`#apps`) — responsive card grid, curated live set only. Each card: app icon, name, one-line tagline, platform badge → links to its story page.
4. **SaaS funnel band** — visually distinct band featuring the three paid web products with direct "start free" CTAs to their live domains. This is the paying-customer conversion path.
5. **From the journal** — teaser of latest 3 articles → `/journal/`.
6. **Philosophy strip** — the ethos: calm, honest, no dark patterns, privacy-respecting. Short.
7. **Footer** — contact `brendan@everlight-digital.com`; legal links (Privacy, Terms, Support); per-app privacy index; copyright.

### 2. Per-app story page (`/apps/<slug>.html`)

Shared template, one file per app:

- **Hero** — app icon, name, tagline, platform badge(s), primary CTA (App Store / visit live URL).
- **The problem** — 1 short paragraph on the pain the app addresses.
- **What it does** — 3–4 feature blocks, each with a heading, sentence, and screenshot (or gradient placeholder if none available).
- **Who it's for** — short audience statement.
- **Made by Everlight** strip — cross-link back to home + 1–2 sibling apps.
- **Footer links** — download/visit, this app's privacy page.

Curated live set (v1):

| Slug | App | Tagline | Platform | CTA target |
|---|---|---|---|---|
| pilgrim | Pilgrim | Bible & prayer, without the guilt mechanics | iOS | App Store |
| shepherd | Shepherd | Pastoral care software churches actually use | Web SaaS | pastorshepherd.com |
| eventflow | EventFlow | Volunteer & event coordination, simplified | Web SaaS | app.everlight-digital.com |
| pasture | Pasture | Cattle & herd tracking on any device | Web SaaS | pasture.everlight-digital.com |
| regen | Regen | Recovery & readiness, at a glance | iOS | App Store |
| clarity | Clarity | A focused AI task manager | Web | clarity live URL |

(Tally, Halcyon, Chrona, and others added as they ship. Deliberately excluded now to avoid dead ends.)

### 3. Journal (`/journal/`)

- **Index** (`/journal/index.html`) — reverse-chronological list: title, date, gradient eyebrow, 1-line dek → article.
- **Article template** (`/journal/<slug>.html`) — title, date, body (long-form HTML), related-app CTA at the end. Optimized for SEO (semantic headings, meta description, Open Graph tags).

Launch set (v1, ~4 posts so the section isn't empty):
1. `why-calm-software` — Why we build calm, honest software (studio manifesto / brand story).
2. `building-shepherd` — Building Shepherd: pastoral care software churches actually use (SEO + Shepherd funnel).
3. `six-apps-in-a-year` — What we learned shipping six apps in a year (build-in-public).
4. `pilgrim-no-guilt` — Pilgrim: a Bible app without the guilt mechanics (SEO + Pilgrim funnel).

### 4. CSS extension (`/brand/site.css`)

Add marketing components on top of existing tokens:
- Hero band, section rhythm/spacing scale, eyebrow accents.
- App card grid + card component.
- SaaS funnel band, pillar row, philosophy strip.
- Journal list + article typography.
- **Dark mode** via `prefers-color-scheme` (ink `#0E0B14` background already the theme-color), with a manual toggle deferred to v2.
- Responsive: mobile-first, no horizontal scroll, images `max-width:100%`.

## Assets

- App icons: pull from each project dir / App Store where available.
- Screenshots: pull from App Store listings / project dirs; where missing, cards & feature blocks degrade to gradient placeholder blocks (no broken images).
- No external asset hosts — everything self-hosted in the repo (matches current static setup).

## Data flow / error handling

Static site: no runtime data flow. "Error handling" = graceful visual degradation:
- Missing screenshot → gradient placeholder block, never a broken `<img>`.
- Every card/CTA has a valid href before ship (link-check pass).
- Legal pages remain reachable from every footer.

## Testing / verification

- Visual QA in browser at mobile + desktop widths (light + dark).
- Link-check: no 404s, every CTA resolves.
- Lighthouse pass on homepage (performance + SEO + a11y).
- Validate Open Graph / meta on homepage + one article.

## Deployment

No change to the pipeline. Author locally, commit, push to `main` on `bpratt116/everlight-digital-privacy` → auto-publishes to everlight-digital.com. Batch-push per Brendan's sync rule (do not push per-file).

## Implementation phasing (for the plan)

1. CSS extension + design tokens (foundation).
2. Homepage.
3. Per-app story template + 6 curated pages.
4. Journal index + article template + 4 launch posts.
5. Footer/legal demotion + link-check + dark-mode + Lighthouse QA.
