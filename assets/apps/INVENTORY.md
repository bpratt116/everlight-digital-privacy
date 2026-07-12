# App asset inventory

Per-app icon + screenshot inventory for story pages (Task 6 reads this to decide real `<img>` vs `.placeholder-shot`).

| Slug | Icon | Screenshots |
|---|---|---|
| pilgrim | `assets/apps/pilgrim/icon.png` | 0 |
| shepherd | `assets/apps/shepherd/icon.png` | 4 (`shot-1.png`…`shot-4.png`) |
| eventflow | `assets/apps/eventflow/icon.png` | 0 |
| pasture | `assets/apps/pasture/icon.svg` | 0 |
| regen | `assets/apps/regen/icon.png` | 0 |

## Notes

- All 5 apps have a **real, app-specific icon** — no beacon-gradient fallback was needed.
- `pasture/icon.svg` is PastureWeb's actual branded mark (green rounded-square "P" wordmark, `web/public/icons/icon-192.svg`) — no PNG app icon exists in that repo yet (per its CLAUDE.md, "apple-touch-icon points at an SVG... none exists yet"), so the SVG is used as-is rather than falling back to the generic beacon mark.
- Shepherd is the only app with local marketing screenshots on disk (`web/public/marketing/*.png`); Pilgrim, EventFlow, PastureWeb, and Regen have no screenshot/fastlane/metadata directories in their project trees, so their story pages will use the `.placeholder-shot` fallback for all screenshot slots (Task 6).
