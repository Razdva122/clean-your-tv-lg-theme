# Clean Your TV theme tools

Create CSS themes for Clean Your TV Home, browse them with the actual launcher,
and build an independently versioned distribution. You can keep several themes
in `themes/<slug>/` in one public GitHub repository.

**Development candidate:** `release/next` includes a reviewed exact main-project
runtime pin. Use the [tested candidate bundle](docs/CANDIDATE.md) or an explicit
maintainer export; no stable author runtime is published. The toolkit
does not download floating `main` or execute theme scripts. TV transfers require an explicit Send theme action.

## Ready-made examples

For a live Home screen with theme-switching buttons, run:

```sh
npm run theme -- showcase examples --runtime .runtime/candidate --port 8877
```

Open **http://127.0.0.1:8877/**. Select a theme above the screen, then use the
mouse or arrows/Enter inside Home. Switching uses the same renderer without
reloading it; app order and the saved column preference are retained.
Themes may fix their own layout and temporarily suspend the column override. Apps and TV
services are simulated. Keep the terminal open; Ctrl+C stops the local server.
This is a local candidate showcase, not a published community catalog.


Use built-in **Classic** or the complete [Channel and Alpine examples and screenshots](examples/README.md). The [local visual gallery](examples/index.html)
compares Home, Inputs and the standard Settings screen without a runtime.
For an interactive example, run `npm run theme -- preview examples/terminal --runtime .runtime/candidate`.

## Start a theme and open the preview

Install Node.js 22 or newer. Open a terminal in this toolkit checkout:

```sh
npm ci --ignore-scripts
npm run theme -- init themes/ocean --name Ocean --repository https://github.com/YOUR-NAME/YOUR-THEMES --author "Your Name"
npm run theme -- preview themes/ocean --runtime .runtime/candidate --edition no-root
```

The [candidate bundle](docs/CANDIDATE.md) includes `.runtime/candidate`. For a source
checkout, use [runtime preparation](docs/runtime.md). Without a runtime,
preview/validate/build stop with a clear error. `runtime.lock.json` deliberately
contains no invented download URL or digest.

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
npm run theme -- validate themes/ocean --runtime .runtime/candidate
npm test
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
**Settings → Appearance → Receive from computer**, then enter the TV address and
six-digit PIN in the computer dialog. Choose **Send theme**. Both devices must
be on the same home network; no incoming computer firewall change is needed.
**Sent** means bytes received: finish installation on TV and choose **Apply theme**.
The PIN is never saved. See the [TV transfer guide](docs/tutorial.md#try-an-unpublished-theme-on-your-tv)
for retries and CLI sending. The only transfer direction is PC → TV.

## Matched release candidate

`release/next` collects the tools for the main project’s 1.5.0 candidate. Download
the tested toolkit/runtime bundle from Actions using the [candidate guide](docs/CANDIDATE.md).
Its runtime is pinned to the exact source in `runtime.lock.json`; this does not
publish a stable application release.

## Documentation map

| Task | Guide |
| --- | --- |
| Create a first theme, open it, fix errors | [Author walkthrough](docs/tutorial.md) |
| CSS parts, images, layouts, button icons | [Authoring reference](docs/authoring.md) |
| Prepare a runtime locally | [Runtime preparation](docs/runtime.md) |
| Build, publish several themes and submit a PR | [Publishing](docs/publish.md) |
| Candidate limits and TV availability | [Compatibility](docs/compatibility.md) |
| Compare complete examples | [Classic, Alpine and Channel](examples/README.md) |

The public catalog belongs to [the main project](https://github.com/Razdva122/clean-your-tv-lg-webos/tree/codex/theme-css-foundation/showcase). Its initial Alpine/Channel records reference independently committed distributions in this repository; the catalog and TV installer follow the main project release cycle. A listing does not automatically bundle a theme. The main candidate bundles Classic and Alpine, while Channel stays an external showcase install; see the main user guide for the implemented candidate TV flow.

The repository-root `cytv-themes.json` discovers **Channel only** for the candidate TV installer. Alpine is a bundled main-project theme; its older distribution remains historical. A repository-root URL resolves the default branch, so the new index becomes discoverable there after this toolkit PR merges. The showcase's existing commit-pinned Channel descriptor already works independently of that merge.
