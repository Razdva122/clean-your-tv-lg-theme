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
positioning, geometry transforms, hidden focus controls and unsupported features
fail validation. Settings, confirmations and recovery remain standard.

Layout belongs in `theme.json`, not arbitrary CSS: one of `dock-grid` (low shelf), `icon-grid` (compact square icons),
`side-grid` (fixed sidebar and app grid) or `channel-list` (numbered rows),
columns 1–8,
spacingScale 0.8–1.2, textScale 0.9–1.25 and focusScale 1.05–1.15. Dim is 0–0.85.
Templates own geometry and remote hit areas. The TV user can override columns
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

Runtime image limits are 1920×1080 / 2 MiB each, preview 960×540 / 300 KiB,
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
the runtime retains a 2px focused-card border in the selected accent.
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
