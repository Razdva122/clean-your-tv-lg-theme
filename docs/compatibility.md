# Candidate scope and troubleshooting

Node.js 22+ author tooling targets desktop development. The actual renderer is
compiled using the main project's Chromium 38/ES5 pipeline. No physical TV,
Windows or Linux acceptance has been performed by this toolkit task.

- Runtime missing: obtain a complete trusted candidate export and pass its path.
- Integrity mismatch/unlisted file: discard the changed copy; obtain it again.
- Compiler dependency missing: run `npm ci --ignore-scripts` in the toolkit root.
- CSS failure: fix the file/rule named by the compiler; last valid preview stays.
- Port occupied: use `--port 8767`; host binding is always loopback.
- Build refuses dirty input: commit the selected theme's source and pass HEAD.
- Existing output: use a new output directory, inspect/remove your old build yourself.

Preview network policy permits only local assets and the local status poll. All
webOS calls use the runtime mock bridge. No TV connections, package installation,
real app launching, firmware updates or device changes occur.

The current toolkit does not normalize images, automatically fetch a published
runtime, or capture a full locale/scrolled-grid screenshot matrix. Do not infer those capabilities from future plan documents. The main theme-enabled candidate implements URL installation, app-origin IndexedDB/offline persistence and immediate installed selection and 20-second showcase revert/recovery. Its browser tests cover both renderer editions; TV-origin storage quota, TLS/CORS, native remote/keyboard, standby/cold boot and updater behavior still need physical-device acceptance before release promises.

The trusted author wrapper disables automatic restoration of the browser origin's accepted TV theme so it cannot overwrite the source being edited. Its existing local-only network policy also blocks external theme installation inside that author preview. Use the main candidate preview/TV Settings flow to test downloading and persistent selection; use the upper cards to edit source themes here.

`layout.ribbon` is an optional `scenic-grid` extension in the paired PR candidate,
not a new preset or evidence of support in the pinned author runtime. Use the
[explicit PR export](runtime.md#ribbon-pr-candidate). The wrapper refuses an old
runtime with an `update-runtime` message. The compiler emits `ribbon-layout-v1`
automatically. Older Home versions reject the package's unknown capability safely
and keep the previously accepted theme; they must not partially apply its CSS or
silently substitute the legacy scenic geometry. Browser preview verifies renderer
behavior only; no physical TV acceptance is claimed for Ribbon.
