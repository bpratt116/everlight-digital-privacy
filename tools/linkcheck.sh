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
[ -s /tmp/el_linkcheck_fail ] && { echo "linkcheck: FAIL"; exit 1; }
echo "linkcheck: OK"
