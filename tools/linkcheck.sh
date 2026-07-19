#!/usr/bin/env bash
# Static link + guardrail check for the Everlight marketing site.
# Usage: bash tools/linkcheck.sh
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

pages=$(find index.html apps journal -name '*.html' 2>/dev/null)

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

# SEO plumbing must be regenerated whenever pages are added or renamed.
node tools/seo-inject.mjs --check   || echo "SEO head stale (run: node tools/seo-inject.mjs)"   | tee -a /tmp/el_linkcheck_fail
node tools/gen-sitemap.mjs --check  || echo "sitemap stale (run: node tools/gen-sitemap.mjs)"   | tee -a /tmp/el_linkcheck_fail

[ -s /tmp/el_linkcheck_fail ] && { echo "linkcheck: FAIL"; exit 1; }
echo "linkcheck: OK"
