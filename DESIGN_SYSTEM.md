# TAVON Design System (Phase 05)

**Principle:** Apple × SpaceX. Flat surfaces, 1px lines, no gradients, no glass, no drop shadows. Colour is used sparingly; the accent is the only loud thing on screen.

## Files
| File | Purpose |
|---|---|
| `src/styles/tokens.css` | All colours, type, spacing, radius, motion, density. Change a look here only. |
| `src/styles/base.css` | Reset, type classes, layout helpers, focus ring |
| `src/styles/components.css` | Button, card, list row, form, switch, segmented, chip, badge, tab bar, sheet, alert, toast, skeleton, empty state, progress, chart, calendar, table, tooltip |
| `src/ui/icons.js` | 28-icon SVG sprite (24px grid) |
| `src/ui/ui.js` | sheet, confirm, toast+Undo, segmented, switch, animateNumber |
| `src/ui/appearance.js` | Saves settings in its own key `tavon-appearance` (never touches your data) |
| `styleguide.html` | Live preview of everything; open it and change theme/accent/size/density |

## Customisation hooks (on `<html>`)
`data-theme` light/dark (Auto follows the iPhone) · `data-accent` terracotta/forest/ocean/mono · `data-font-size` small/default/large/xlarge · `data-density` compact/comfortable/spacious · `data-motion="off"` (also honours the device's Reduce Motion).

## Accessibility
- Every text/background/accent/status pair is checked by `tests/tokens.test.js` against WCAG 2.2 AA (4.5:1 text, 3:1 borders/charts) in both themes and all four accents.
- Touch targets >= 44px (`--tap`); visible focus ring; Thai body line-height 1.5; status never by colour alone (icon/shape/text); calendar marks use dot shapes.
- Dialogs use native `<dialog>` (focus trap, Esc); toasts announced via `aria-live`.

## Fonts
Inter (Latin, subset) bundled as woff. Thai uses the iPhone's own Thai fonts (Sukhumvit Set/Thonburi). Inter is SIL OFL 1.1, (c) Rasmus Andersson; licence text to ship with the app in Phase 15.

## Tuned during this phase
Terracotta light `#9F4019`, danger `#A8321C`, warning `#7F5200`, tints 10%: all adjusted because the contrast tests failed on the first values.
