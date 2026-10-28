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
runtime, or capture a full locale/scrolled-grid screenshot matrix. Do not infer those capabilities from future plan documents. Theme
installation, offline persistence, revert/recovery controls and hardware behavior
must be verified in the main candidate before release promises are made.
