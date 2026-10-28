# Classic, Channel and Glasshouse

The live showcase includes three choices:

| Theme | Composition | Default columns | Source |
| --- | --- | --- | --- |
| [Glasshouse](glasshouse/theme.css) | Scenic wallpaper, large clock and one looping bottom ribbon | 8 | Editable example in `glasshouse/` |
| Classic | Original Home shelf and grid | 5 | Built into the renderer; uses trusted reset, no theme CSS copy |
| [Channel](terminal/theme.css) | Blue teletext-style numbered list with a selected title | 1 | Editable example in `terminal/` |

Classic and Channel allow the TV user to override their column defaults.
Glasshouse fixes its author composition at eight columns and hides that setting;
the saved user choice resumes when switching back to Classic or Channel. Settings use the
standard trusted appearance. The `terminal` directory and Channel theme ID stay
stable. Glasshouse is an independent interpretation of the Glasshouse Home composition.
Its `scenic-grid` layout loops horizontally with Left/Right; Up enters shortcuts and Down
returns to the same app.
The selected app index appears above the ribbon. Wallpaper attribution and license
are in `glasshouse/CREDITS.txt` and `glasshouse/LICENSE.txt`.

## Open the live showcase

Install Node.js 22+ and obtain the explicit candidate runtime as described in
[runtime preparation](../docs/runtime.md). No official runtime download is
published yet. From the toolkit root:

```sh
npm ci --ignore-scripts
npm run theme -- showcase examples --runtime .runtime/candidate --port 8877
```

Open **http://127.0.0.1:8877/**. Classic is selected initially. Click Glasshouse, Channel or
Classic above the actual Home screen, then use the mouse or arrows/Enter inside
it. Switching does not reload Home; app order and saved column preferences are retained.
App launches and TV services are simulated. Keep the terminal open; Ctrl+C stops
the server. Save the selected theme's CSS to see validated changes live.

To preview just Channel:

```sh
npm run theme -- preview examples/terminal --runtime .runtime/candidate --edition no-root
```

Open the printed loopback URL. The complete 1920×1080 TV canvas scales to the
PC window. Edit `examples/terminal/theme.css` and save. Before publishing a copy,
change its repository identity, title, author and version. Each theme needs its
own license, credits and manifest.

## Channel behavior

Channel uses a readable numbered list and a large selected-app icon/title with
a position counter in its default single-column layout. Explicit choices of
2–4 columns use full-width rows; 5–8 use compact labelled icon cells. The app
library shares its square blue/cyan styling. Held OK, reorder, Add app and
keyboard Close keep their labels/focus readable. Missing icon previews remain
hidden; app labels and fallback initials still identify the app.

See the [browser QA record](../docs/channel-review.md) for tested scenarios.

## Channel screenshots

![Channel Home](terminal/assets/preview.png)

[Inputs](terminal/previews/inputs.png) · [Settings](terminal/previews/settings.png) · [Manifest](terminal/theme.json)

The [static gallery](index.html) opens without Node/runtime and compares saved
Channel Home, Inputs and Settings images. Classic's live view comes from the
renderer's own built-in styles rather than a saved imitation.

These No-root browser captures use synthetic data and a fixed clock. The
`terminal/previews/provenance.json` file records candidate-runtime provenance.
The runtime must support trusted layout presets. Browser screenshots do not
establish physical-TV acceptance. Candidate APIs may still change.

To regenerate the captures into a new empty output directory:

```sh
npm run theme -- screenshots examples/terminal --runtime .runtime/candidate --out .runtime/channel-captures
```

A local Chrome can be selected with `--browser-executable /absolute/path/to/chrome`.
Replace previews and provenance together after review. Demo icon sources and
licenses are in [DEMO-ICON-CREDITS.txt](DEMO-ICON-CREDITS.txt),
[DEMO-ICON-LICENSE.txt](DEMO-ICON-LICENSE.txt), and Channel's `CREDITS.txt`.

## Fixed author layouts

Set `layout.allowColumnOverride` to `false` in `theme.json` to hide the Columns
setting and keep the author's column count. Omit it, or set `true`, to let users
choose. Glasshouse demonstrates the fixed option; Channel remains adjustable.
The saved user value is preserved across theme switches. This candidate field
requires a freshly exported runtime with column-policy support.

The flag controls user reflow, not arbitrary CSS coordinates. Choose a supported
trusted preset for placement. The renderer continues to own remote navigation,
focus and hit areas; external CSS controls the exposed visual parts.
