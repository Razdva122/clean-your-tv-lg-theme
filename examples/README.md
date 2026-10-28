# Example themes

Four complete starting points using the same public theme API. Each includes
editable CSS, a manifest, license, credits and a real browser-rendered preview.
[Open the visual gallery](index.html) locally, or compare the Home images below.

| Theme | Direction | Default columns | Wallpaper |
| --- | --- | --- | --- |
| [Minimal](minimal/theme.css) | Graphite, quiet neutral controls | 5 | None |
| [Aurora](aurora/theme.css) | Navy, mint focus, soft violet ribbons | 5 | Original generated artwork |
| [Gallery](gallery/theme.css) | Light paper, green hills, serif clock | 4 | Original generated artwork |
| [Terminal](terminal/theme.css) | Amber, monospace, squared panels | 6 | None |

The author sets the default column count in `theme.json`. The TV user's explicit
setting takes precedence. App logos retain their own branding. Settings use the
standard trusted appearance with the theme suspended.

## Minimal

![Minimal Home](minimal/assets/preview.png)

[Inputs](minimal/previews/inputs.png) · [Settings](minimal/previews/settings.png) · [Manifest](minimal/theme.json)

## Aurora

![Aurora Home](aurora/assets/preview.png)

[Inputs](aurora/previews/inputs.png) · [Settings](aurora/previews/settings.png) · [Manifest](aurora/theme.json)

## Gallery

![Gallery Home](gallery/assets/preview.png)

[Inputs](gallery/previews/inputs.png) · [Settings](gallery/previews/settings.png) · [Manifest](gallery/theme.json)

## Terminal

![Terminal Home](terminal/assets/preview.png)

[Inputs](terminal/previews/inputs.png) · [Settings](terminal/previews/settings.png) · [Manifest](terminal/theme.json)

## Open an interactive example on your PC

From the toolkit root, install Node.js 22+ and dependencies, then obtain the
explicit candidate runtime as described in [runtime preparation](../docs/runtime.md).
No official runtime download is published yet.

```sh
npm ci --ignore-scripts
npm run theme -- preview examples/aurora --runtime .runtime/candidate --edition no-root
```

Open the printed loopback URL, usually **http://127.0.0.1:8766/**. Keep the terminal
open. The full 1920×1080 TV canvas scales to your browser window. Use arrows,
Enter, Back or the mouse; edit `examples/aurora/theme.css` and save to see changes.
Replace `aurora` with `minimal`, `gallery` or `terminal`. Stop with **Ctrl+C**.
For a theme you plan to publish, copy a directory into your own collection and
change its repository identity, title, author and version before publishing.

The static `index.html` can also be opened directly, without Node or runtime;
it compares saved screenshots, with Home / Inputs / Settings switches.

## Evidence and artwork

These are No-root browser captures from the actual candidate Home renderer,
with synthetic demo data and a fixed clock. Each `previews/provenance.json`
records the runtime snapshot and browser. Browser screenshots do not establish
physical-TV acceptance. Candidate APIs and visuals may still change.

Regenerate the two original wallpapers with `node scripts/generate-example-art.cjs`.
Capture each theme using the same candidate runtime:

```sh
npm run theme -- screenshots examples/aurora --runtime .runtime/candidate --out .runtime/aurora-captures
```

Use an empty output directory. A locally installed Chrome can be selected with
`--browser-executable /absolute/path/to/chrome`. Replace the committed previews
and their provenance together after reviewing the results. Demo icon sources and
licenses are in [DEMO-ICON-CREDITS.txt](DEMO-ICON-CREDITS.txt),
[DEMO-ICON-LICENSE.txt](DEMO-ICON-LICENSE.txt), and every theme's `CREDITS.txt`.

Visual research: [CleanYourTV's theme gallery](https://lasharor.github.io/cleanyourtv-WebOS/themes/)
and [Luma](https://github.com/ecklf/lg-luma). The CSS and wallpapers here are
original; no theme code or wallpaper was copied from those projects.
