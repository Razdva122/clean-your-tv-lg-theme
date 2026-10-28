# Clean Your TV theme tools

Create CSS themes for Clean Your TV Home, browse them with the actual launcher,
and build an independently versioned distribution. You can keep several themes
in `themes/<slug>/` in one public GitHub repository.

**Development candidate:** no official author runtime is published or pinned yet.
The commands below require an explicit maintainer-exported candidate. The toolkit
does not download floating `main`, execute theme scripts or connect to a TV.

## Ready-made examples

Browse [four complete themes and their screenshots](examples/README.md):
Minimal, Aurora, Gallery and Terminal. The [local visual gallery](examples/index.html)
compares Home, Inputs and the standard Settings screen without a runtime.
For an interactive example, run `npm run theme -- preview examples/aurora --runtime .runtime/candidate`.

## Start a theme and open the preview

Install Node.js 22 or newer. Open a terminal in this toolkit checkout:

```sh
npm ci --ignore-scripts
npm run theme -- init themes/ocean --name Ocean --repository https://github.com/YOUR-NAME/YOUR-THEMES --author "Your Name"
npm run theme -- preview themes/ocean --runtime .runtime/candidate --edition no-root
```

A maintainer must first provide `.runtime/candidate`, exported from the main
project as described in [runtime preparation](docs/runtime.md). Without it,
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

See [CSS and layout](docs/authoring.md), [publishing and collections](docs/publish.md),
[Russian quick start](docs/quick-start.ru.md) and [limitations](docs/compatibility.md).
The authoring workflow needs no embedded editor or desktop authoring application.
