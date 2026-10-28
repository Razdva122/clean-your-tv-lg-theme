# Glasshouse UI/UX review

Scope: the scenic ribbon, exposed theme styles and PC browser interaction. Review
used UI/UX guidance for essential-name access, visible focus and text contrast.
These checks use synthetic apps and service replies in both editions, not a TV.

## Findings and changes

- A clipped action label hid the meaning of Add app. A static selected-name detail
  now exposes the full name, including long app names; captions are 28px and wider
  than their icons. Add app can wrap to two lines. The ribbon sits higher to leave
  the caption area visible above the bottom safe area.
- Two nested frames competed for focus. The wrapper outline is removed; one
  renderer-owned 3px card border and a dark halo identify the selected icon.
- Small shortcuts were weak beside the clock. They now use 28px labels and 72px
  hit areas. Latin AM/PM uses the smaller period label, with 24-hour and other
  locale formats preserved. Date/period colors have stronger contrast.
- Horizontal selection detached/reinserted every app node. Stable-order selection
  now updates geometry without child-list mutations. Rearrangement still changes
  DOM order to match the actual app order.
- A real pointer probe on the clipped neighbor changed selection twice (expected
  index 7, observed 9). Off-window card hints no longer accept pointer input until
  revealed; the fully revealed item is interactive again.
- Wheel/touchpad input now steps in either direction, with bounded event-rate
  handling. Trusted suspension prevents scrolling behind Settings and other
  protected dialogs. Reduced-motion CSS continues to override inline motion.

## Verification

The browser suite covers both editions, all trusted layouts, Columns, isolation,
nested dialogs, reset and Channel navigation. Scenic checks cover complete loops
both ways, 1/3/8 visible slots, a parked cursor with actual animation, edge hover,
wheel reversal and modal blocking, reorder/cancel, short/empty libraries, long
names, reduced motion, and restoration of Classic time formatting/pointer areas.
Theme/compiler/runtime, preview and TV compatibility checks are recorded with the
candidate change. Toolkit tests cover all examples and selected fallback contrast.

Screenshots and runtime source are recorded together in
`../examples/glasshouse/previews/provenance.json`. The Home PNG is palette-compressed
for the descriptor budget. The bundled panorama is the reviewed wallpaper;
contrast with arbitrary replacement wallpapers is not established.

Physical model, firmware, webOS, remote, viewing-distance legibility, real app
launches, sound, standby, cold boot, OTA and rollback remain untested. Browser
geometry checks do not establish hardware acceptance or universal accessibility.

Verified candidate runtime source: `c0919d03cc29c4119aa135103e0c5494cd23af82`.
Full browser, theme/compiler/runtime, TV compatibility and preview groups passed.
All 21 toolkit checks passed. The current IAB preview was manually checked in
Russian for the full Add app title, library open/Back and focus return.
