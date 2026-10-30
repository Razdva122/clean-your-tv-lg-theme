# Source CSS, images and layout

Each theme folder contains `theme.json`, `theme.css`, `LICENSE.txt`, `CREDITS.txt` and
static assets. Keep `id` stable; update `themeVersion` for each release. The ID
format is `github:owner/repository:slug`, lowercase. A display title may change
without changing identity. Different folders have independent identities/versions.

Write ordinary CSS using public `.ctv-*` parts, for example:

```css
:root { --ink: #f2f5fa; }
.ctv-clock { color: var(--ink); }
.ctv-card { background-color: #182330; border-color: #41546c; border-radius: 20px; }
.ctv-card.is-focused { border-color: #dceaff; }
```

The pinned runtime's `theme-api/contract.json` is the authoritative machine-readable
selector/property/state table. The shared compiler resolves source variables and
runs the same browser compatibility transform and typed policy used by TV Home.
Unknown parts/properties, raw executable content, imports, network URLs, arbitrary
positioning, unbounded geometry transforms, hidden focus controls and unsupported features
fail validation. Settings, confirmations and recovery remain standard.

Layout belongs in `theme.json`, not arbitrary CSS: one of `dock-grid` (low shelf), `icon-grid` (compact square icons),
`side-grid` (fixed sidebar and app grid) `channel-list` (numbered rows) or `scenic-grid` (a looping scenic ribbon),
columns 1–8,
spacingScale 0.8–1.2, textScale 0.9–1.25 and focusScale 1.05–1.15. Dim is 0–0.85.
Templates own geometry and remote hit areas. Unless `allowColumnOverride` is false, the TV user can override columns
within every template; narrow channel-list cells use a compact icon and label.
In side-grid, Left from the first grid column enters the sidebar, Up/Down
selects a shortcut, and Right returns to the grid.
This candidate implements Classic spacing/text/focus scales only:
use spacingScale=1, textScale=1 and focusScale=1.1. Other scale combinations fail
explicitly until shared geometry support lands. The broader API bounds do not
prove every combination readable on a real TV.

List static PNG/JPEG/WebP files in `assets` with unique IDs, relative paths,
mediaType and dimensions. Reference listed assets from CSS with `url(assets/name.png)`.
The preview resolves verified images locally; installed styles receive trusted
asset handles. No remote imports/fonts/videos/scripts/plugins/install hooks.
A preview asset is required; the scaffold includes an original 1×1 placeholder.
Replace it with a useful browser preview before submitting to showcase.

With the UHD wallpaper candidate runtime, the asset selected by `defaults.wallpaperAssetId` may be up to 3840×2160 / 2 MiB. Other images remain 1920×1080 / 2 MiB each, preview 960×540 / 300 KiB,
16 assets and 6 MiB total. Resize large originals yourself; automatic image
normalization is not provided. Every asset needs redistribution permission and
an entry in CREDITS.txt. LICENSE and credits are bounded hashed documents, not images.

The final emitted stylesheet has a global 256 KiB budget. This is separate from
the 2 MiB encoded-image limit: preview converts validated image bytes to browser
Blob URLs before the actual ThemeRuntime.apply call. The runtime releases accepted
handles on replacement/reset; the adapter releases handles for rejected candidates.
Unchanged preview polls do not resend image bytes. No raw-CSS bypass is used.

The `.ctv-focus` visual part styles the shared focus frame. `.ctv-label.is-focused`
styles selected app names. Themes cannot change focus positioning or hide it:
the runtime normally retains a 2px focused-card border in the selected accent.
An explicit card border none/0 can suppress that border while the trusted
110% focus scale and readable selected label remain.
The old glass specular layer is disabled while an author theme is active.
An explicit `.ctv-ambient` background-image can replace the built-in app-colored
glow; a fully transparent gradient produces a flat background.

App library surfaces expose `.ctv-library-panel` and `.ctv-library-close`
(including `.is-focused`). These use the same bounded appearance properties,
so a theme can match its app library without styling trusted Settings.
Channel uses the current candidate's selected-app preview, larger list rows,
and full-width multi-column cells. Older candidates lack these polish fixes.

In the `channel-list` preset, focus is painted directly on
`.ctv-card.is-focused` (with the engine's mandatory accent border). The enlarged
travelling `.ctv-focus` frame belongs to other layouts and stays hidden in the
list. Channel row changes and scrolling are immediate, without a second zooming
outline. Remote input keeps focus until actual pointer movement or a click.

## Let the author keep a fixed composition

Set `layout.allowColumnOverride: false` in `theme.json` for a preset whose
column count is part of the intended design. The TV hides Columns and uses
`layout.columns`. Classic and themes omitting the flag keep that setting.
The user's saved value returns when switching to an adjustable theme; it is
never overwritten by a fixed theme. The current Alpine example demonstrates
this flag. Use a runtime with column-policy support; older candidates reject it.

The flag does not unlock arbitrary CSS positioning. Templates still own card
coordinates, focus, pointer hit areas and remote navigation. New placement
patterns need a trusted renderer preset rather than theme JavaScript.

## Replace header button icons

Use `.ctv-input-icon`, `.ctv-network-icon` and `.ctv-settings-icon`. Each hook is a decorative SVG inside its original button. Its dimensions, interaction and text label stay owned by the renderer. Register a transparent PNG/WebP in `theme.json` with its real dimensions and redistribution credits, then add:

```css
.ctv-input-icon {
  color: transparent;
  background-image: url(assets/button-inputs.png);
}
```

`color: transparent` makes the built-in SVG fill transparent while the listed image occupies the same bounds. Omitting both declarations restores the default glyph. Do not use remote images, SVG uploads, data URLs, IDs or arbitrary selectors. Choose a focused button background that keeps the raster image readable, or provide a separate registered focus asset with `.ctv-shortcut.is-focused .ctv-input-icon`.

Run the live showcase command in [examples](../examples/README.md), select Alpine or Channel and click Inputs/Settings or navigate Up with the remote keys. Compare their outline/pixel glyphs and focused states; switching to Classic restores the built-in artwork. A candidate runtime containing these three new hooks is required. This styles only the Home shortcut; the Settings screen remains standard.

The Channel example demonstrates separate registered dark-blue focus icons on a white shortcut. Use `.ctv-shortcut.is-focused .ctv-network-icon` (and the input/settings hooks) to replace the artwork as well as the text color. Verify every shortcut with mouse and remote focus. The Alpine example crops and downsamples the original photograph to 3840×2160; do not enlarge a small thumbnail and call it 4K. Older runtimes reject UHD images.

## CSS-only native icon effects

The [Sharingan example](../examples/itachi/README.md) demonstrates optional
`modern-icon-css-v1`. Use `.ctv-clock` and `.ctv-date` with bounded `font-size`;
48px and 22px respectively are accepted examples. Other parts cannot use that
property. `theme-api/contract.json` remains the exact scope/range authority.

```css
.ctv-clock { font-size: 48px; }
.ctv-date { font-size: 22px; }
.ctv-icon.is-light {
  filter: grayscale(1) invert(1) brightness(1.3);
  mix-blend-mode: screen;
}
.ctv-card { isolation: isolate; overflow: visible; }
.ctv-card .ctv-icon { transform: scale(1.6); }
```

Only allowed icon filter functions, screen blending and bounded icon paint
scales are accepted. Arbitrary transforms, URLs inside filters, moving card hit
areas and executable CSS remain forbidden. The compiler records the required
capability automatically; compatible Home/browser support is required on TV.
These effects preserve original app-image URLs and bytes. They approximate white
logos, not image background removal, and cannot increase native image detail.

The `.ctv-position` part controls the decorative scenic-ribbon counter and arrows.
Use a transparent color to hide this indicator; app labels use `.ctv-label`.

## Optional scenic ribbon geometry (PR candidate)

A trusted runtime advertising `ribbon-layout-v1` supports optional `layout.ribbon`
inside the existing `scenic-grid` preset. It requires `allowColumnOverride: false`;
keep `columns` between 1 and 8. Omit `ribbon` to retain existing scenic behavior.
The main compiler validates this object and automatically adds the capability to
`requires.capabilities`; authors do not add a capability by hand.

| Field | Allowed values | Default |
| --- | --- | --- |
| `left` | 64–640 | 112 |
| `right` | 32–320 | 112 |
| `bottom` | 0–200 | 162 |
| `cardHeight` | 96–240 | 128 |
| `gap` | 0–64 | 24 |
| `skewDeg` | −18–18 | 0 |
| `focusLift` | 0–64 | 0 |
| `iconScale` | 0.4–1 | 1 |
| `shortcuts` | `header`, `bottom-left` | `header` |
| `edgeNavigation` | `wrap`, `shortcuts` | `wrap` |
| `labels` | `below`, `focused-above` | `below` |
| `showClock` | boolean | `true` |

Distances are in the renderer's 1920×1080 design coordinates; skew is degrees.
Each field is optional. Numeric distances must be integers; `skewDeg` may be
fractional; `iconScale` may also be fractional and adjusts native artwork within
its trusted card bounds. Bottom-left shortcuts require `left >= 340`; combinations must leave
at least 64 design pixels per card after skew and spacing. Labels placed `below`
require `bottom >= 64` so captions remain on screen. The compiler checks
these combined bounds as well as individual ranges. `shortcuts` edge navigation moves from the first app
into trusted shortcuts; wrapping keeps the scenic app loop. Focused-above labels
show the selected app caption above its card. Card placement, navigation, pointer
hit areas and focus still belong to the trusted renderer. CSS remains appearance
only. Unknown keys, invalid values and incompatible layouts fail validation.

[The Ribbon example](../examples/ribbon/README.md) demonstrates eight skewed
cards, raised focus, bottom-left shortcuts and a hidden clock with original
wallpaper. It contains no author JavaScript, layout stylesheet or renderer fork.
See [runtime preparation](runtime.md#ribbon-pr-candidate) before using it.
