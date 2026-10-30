# Runtime preparation and trust

Toolkit 0.1.0 pairs with application 1.5.0 / Home 1.6 at exact main source
`1fc8235ac564bd2d06ec53a41b07b26f48ba17e1`. Its author-runtime export still uses
`status: candidate`; this describes the independent export format, not the TV
application release status. See [release verification](RELEASE.md).

The toolkit imports the main project's compiler, policy and actual renderer bytes.
It never maintains a launcher fork. The checked-in lock currently has
`status: unpublished`; `runtime:fetch` therefore refuses to invent a release.
A future official runtime must be selected by a reviewed lock update containing
a fixed release URL, exact digest and verified provenance. A candidate snapshot
is not a signed published release. SHA-256 checks detect changes; they do not
establish who made an explicitly supplied local runtime.

For the matched candidate, `candidateSource` in the lock identifies the reviewed
exact main-project commit. The [candidate workflow](CANDIDATE.md) exports from that
clean commit and includes the complete runtime in its tested Actions artifact.
This candidate pin does not invent a stable download or enable `runtime:fetch`.

For a manual source export, a maintainer checks out that exact commit in the main
project, then runs:

```sh
npm ci --ignore-scripts
python3 scripts/export-theme-runtime.py --out build/theme-author-runtime
```

The candidate requires a clean checkout. For local experiments only, explicitly
add `--allow-dirty`; those exports cannot stand in for the pinned candidate.
Existing output is never replaced.
The output includes `runtime.json`, full SHA-256/size inventory, exact source
revision, dirty flag, dependency versions, compiled Root/No-root preview,
mock bridge, contract, policy and compiler. Move/copy the **entire** directory to
this toolkit's `.runtime/candidate`, without changing its contents. Run the
commands from README with `--runtime .runtime/candidate`.

The toolkit requires every runtime file to be listed and match its digest, rejects
symlinks, traversal, duplicate entries and extra files, and checks API 1 before
loading executable compiler modules. Dependencies are installed separately by
`npm ci --ignore-scripts` from the toolkit's reviewed exact lock; no dependency
lifecycle hook or author script runs implicitly. Do not put node_modules inside
the runtime directory. No service credentials, device address or root access is
needed. Only use runtime candidates supplied through a trusted maintainer channel.

## Use the runtime from your own author repository

Keep the runtime inside the trusted toolkit directory, separately from your
public theme repository. After preparing the complete export, use its absolute
path when invoking the toolkit from elsewhere (macOS/Linux shell or Git Bash):

```sh
THEME_TOOLS=/absolute/path/clean-your-tv-lg-theme
node "$THEME_TOOLS/bin/theme.cjs" preview themes/ocean --runtime "$THEME_TOOLS/.runtime/candidate"
```

Run that command from your author repository root. Do not copy the runtime or
`node_modules` into your theme folder or publish them with a distribution. A
candidate archive provides tools/runtime, not your author repository's Git history.

## Ribbon PR candidate

`layout.ribbon` requires the paired main-project PR candidate export advertising
`ribbon-layout-v1`. The tested clean feature export comes from main-project
commit `b7c12db62b65eb0fc6b6e2a3728ba54d80395eb9`, an unpublished PR candidate
with `dirty: false`; it does not establish public release or TV acceptance.
The reviewed stable provenance in `runtime.lock.json` remains
unchanged; that pin predates this option. A lock upgrade belongs after reviewed
integration, with exact provenance, rather than pointing at an unreviewed commit.

A maintainer may export the checked-out main PR candidate explicitly:

```sh
python3 scripts/export-theme-runtime.py --out build/ribbon-pr-runtime
```

Run this in the main project after installing its locked dependencies. The
export requires a clean checkout; a development-only dirty export needs explicit
`--allow-dirty` and is not reviewed release evidence. Keep the complete export
outside theme source, then pass its absolute path from the toolkit:

```sh
npm run theme -- preview examples/ribbon --runtime /absolute/path/main/build/ribbon-pr-runtime
CYTV_THEME_RUNTIME=/absolute/path/main/build/ribbon-pr-runtime npm test
```

For the browser checks also set `CYTV_THEME_BROWSER` to the installed Chromium
executable. The wrapper checks the verified runtime contract before compilation
and refuses an older explicit runtime with `update-runtime` rather than silently
rendering the old scenic layout. It also checks that compilation preserved the
ribbon and emitted its capability. The main runtime owns validation and rendering.
