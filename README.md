# Clean Your TV theme tools

Create CSS themes for Clean Your TV Home, browse them with the actual launcher,
and build an independently versioned distribution. You can keep several themes
in `themes/<slug>/` in one public GitHub repository.

**This branch prepares weather-aware author tools.** Use the exact candidate
source in `runtime.lock.json` and the complete [runtime export](docs/runtime.md).
The [weather guide](docs/weather.md) explains the four formats and local preview
controls. This is an authoring candidate, not a published Home application update.
The prior stable toolkit is documented in [its release guide](docs/RELEASE.md).
The toolkit does not download floating branches or execute theme scripts.
TV transfers require an explicit Send theme action.

## Ready-made examples

Install Node.js 22+, run `npm ci --ignore-scripts`, and prepare the
[matched runtime candidate](docs/runtime.md) in `.runtime/candidate` before preview commands can run.
For a live Home screen with theme-switching buttons, run from the toolkit root:

```sh
npm run theme -- showcase examples --runtime .runtime/candidate --port 8877
```

Open **http://127.0.0.1:8877/**. Select a theme above the screen, then use the
mouse or arrows/Enter inside Home. Switching uses the same renderer without
reloading it; app order and the saved column preference are retained.
Themes may fix their own layout and temporarily suspend the column override. Apps and TV
services are simulated. Keep the terminal open; Ctrl+C stops the local server.
This is a local author showcase, not a published community catalog.


Use built-in **Classic** or the complete [Channel, Alpine and Sharingan examples and screenshots](examples/README.md). The [local visual gallery](examples/index.html)
compares Home, Inputs and the standard Settings screen without a runtime.
Sharingan sources and build instructions live in [examples/itachi](examples/itachi/README.md).
The paired runtime supports clock/date sizes and optional CSS-only icon effects.
For an interactive example, run `npm run theme -- preview examples/terminal --runtime .runtime/candidate`.

## Start a theme and open the preview

Keep the trusted toolkit separate from your own public theme repository. After
preparing the tools/runtime above, create an empty public GitHub repository and
clone it. In a macOS/Linux shell or Git Bash, replace the paths and placeholders:

```sh
THEME_TOOLS=/absolute/path/clean-your-tv-lg-theme
cd /absolute/path/your-projects
git clone https://github.com/YOUR-NAME/YOUR-THEMES.git
cd YOUR-THEMES
node "$THEME_TOOLS/bin/theme.cjs" init themes/ocean --name Ocean --repository https://github.com/YOUR-NAME/YOUR-THEMES --author "Your Name"
node "$THEME_TOOLS/bin/theme.cjs" preview themes/ocean --runtime "$THEME_TOOLS/.runtime/candidate" --edition no-root
```

`init` creates theme files, not a GitHub repository. Run subsequent author
commands from your own repository root. The toolkit and complete runtime stay
at `THEME_TOOLS`; source checkouts follow [runtime preparation](docs/runtime.md).
No stable runtime download is published. Choose the slug/ID once, replace the
starter's tiny preview, and review licenses/credits before publishing.

Open the printed **http://127.0.0.1:8766/** URL in your browser. Keep the terminal
running. Edit `themes/ocean/theme.css` in your preferred editor and save. Valid
CSS changes appear automatically; invalid CSS keeps the last valid preview and
shows the error above the Home surface. Press **Ctrl+C** to stop the server.
Use `--port 8767` if the port is occupied, or `--port 0` to print a free port.
For Root, replace `--edition no-root` with `--edition root`.

Use arrows/Enter/Back and pointer controls in the real launcher. Settings use the
standard trusted UI. A browser preview does not verify remote behavior, storage,
standby, cold boot, OTA, rollback or compatibility with any physical TV.

```sh
node "$THEME_TOOLS/bin/theme.cjs" validate themes/ocean --runtime "$THEME_TOOLS/.runtime/candidate"
```

Start with [the complete author walkthrough](docs/tutorial.md).
See [CSS and layout](docs/authoring.md), [publishing and collections](docs/publish.md),
[Russian quick start](docs/quick-start.ru.md) and [limitations](docs/compatibility.md).
The authoring workflow needs no embedded editor or desktop authoring application.

The live showcase starts with **Classic**, the renderer's built-in appearance.
Classic calls the trusted reset path rather than loading a CSS imitation.
It restores the original layout and default of 5 columns, while an explicit
user column choice still takes precedence. Other themes remain selectable.

## Send a theme to your TV

Choose your local theme in preview/showcase and click **Send to TV**. On TV open
**Settings → Themes → Receive from computer**, then enter the TV address and
six-digit PIN in the computer dialog. Choose **Send theme**. Both devices must
be on the same home network; no incoming computer firewall change is needed.
**Sent** means bytes received: finish installation on TV and choose **Apply theme**.
The PIN is never saved. See the [TV transfer guide](docs/tutorial.md#try-an-unpublished-theme-on-your-tv)
for retries and CLI sending. The only transfer direction is PC → TV.

## Short installation IDs

**TV link** shows the last verified published version and offers **Copy ID**
(for example `102300a209`) and **Copy link**. Local edits are excluded. If that
public version has no ID yet, **Create installation ID** shortens only its verified
public address; an unpublished theme gets publishing instructions. Generate a pinned release workflow once with
`node "$THEME_TOOLS/bin/theme.cjs" release-workflow` from your author repository; it automatically attaches
IDs when you publish `vX.Y.Z` theme releases. No da.gd account or API key is needed.
Build tracked packages under `distributions/<slug>/<version>/`, publish a theme
release at distribution commit B, and wait for its link workflow. Follow the
[complete publishing sequence](docs/publish.md) and [ID instructions](docs/short-links.md). Local PC → TV transfer
remains available independently.

## Matched release

Toolkit `0.2.0` and tag `toolkit-v0.2.0` have their own version, separate from
Itachi theme `v1.0.2` and the TV application. Follow the [release guide](docs/RELEASE.md)
for archive hashes, runtime provenance and independent device-acceptance limits.
[Earlier candidate evidence](docs/CANDIDATE.md) remains historical.

## Documentation map

| Task | Guide |
| --- | --- |
| Create a first theme, open it, fix errors | [Author walkthrough](docs/tutorial.md) |
| CSS parts, images, layouts, button icons | [Authoring reference](docs/authoring.md) |
| Prepare a runtime locally | [Runtime preparation](docs/runtime.md) |
| Build, publish several themes and submit a PR | [Publishing](docs/publish.md) |
| Candidate limits and TV availability | [Compatibility](docs/compatibility.md) |
| Compare complete examples | [Classic, Alpine, Channel and Sharingan](examples/README.md) |

The public catalog belongs to [the main project](https://github.com/Razdva122/clean-your-tv-lg-webos/tree/release/next/showcase). Its initial Alpine/Channel records reference independently committed distributions in this repository; the catalog and TV installer follow the main project release cycle. A listing does not automatically bundle a theme. Home 1.10.0 bundles Classic, Liquid Glass and Ribbon, while Channel stays an external showcase install; see the main user guide for the published TV flow.

The repository-root `cytv-themes.json` lists **Channel and Itachi · Sharingan** for the TV installer. Current Alpine is an external catalogue theme; its older toolkit distribution remains historical. A repository-root URL resolves the default branch, so the index is discoverable there. The showcase's existing commit-pinned Channel descriptor works independently of a toolkit update.

## Preview real TV resources

Default icons are [ten original international webOS app resources](examples/reference-apps/README.md),
including recorded native IDs, versions, dimensions and hashes. For a personal app set, use [a private local TV snapshot](docs/tv-preview.md) with
`--inventory .runtime/private-tv/inventory.json`. The header distinguishes
**TV snapshot** from **Reference TV apps**. Snapshots never become theme package assets.

## Embedded 4K wallpapers

The Alpine and Ribbon examples include actual 3840×2160 H.264 media, a 1080p
variant and a static JPEG fallback. Ribbon mirrors the released Black Hole video by Xecutioner, recorded at native
3840×2160, with a 12-second loop. Its artwork requires non-commercial use and
attribution; preserve the example license and credits. These examples use the
matched runtime pinned in runtime.lock.json; browser checks are not TV acceptance.

Author theme.json uses `wallpaperVideo: {"variants": [{"quality":"4k",
"path":"assets/wallpaper-4k.mp4"}, {"quality":"1080p",
"path":"assets/wallpaper-1080p.mp4"}]}`. Keep the fallback image in
`defaults.wallpaperAssetId`. The compiler derives sizes, hashes and decoded H.264
dimensions and rejects mismatched quality, audio, duration or byte budgets.
Build, live preview, send and submission include both local video files. Sending
is still an outgoing private-TV/PIN request and has a bounded 33 MiB envelope.

For originals, use the main project's
[offline wallpaper preparation tool](https://github.com/Razdva122/clean-your-tv-lg-webos/blob/94c81dc7c102b8e9476e22cdc4ad6ce3ab36cf92/scripts/prepare-theme-wallpaper.py)
with pinned `imageio-ffmpeg==0.6.0`, or supply already prepared compliant MP4s.
It rejects undersized crops instead of upscaling. Retain original source URLs,
licenses, credits and all transformations in your theme's documents. The browser
preview can select 4K explicitly; it does not prove a TV's native capabilities.

## Weather

The [weather authoring guide](docs/weather.md) covers supported formats, theme styling and local synthetic preview controls. Use a matching weather-capable runtime; older published Home cannot acquire weather from a theme package alone.
