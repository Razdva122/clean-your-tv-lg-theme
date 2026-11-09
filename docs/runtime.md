# Runtime preparation and trust

The weather integration uses the exact candidate main-project source in
`runtime.lock.json`. The export remains a candidate until the normal Home release
and device acceptance workflow completes. Keep the whole matching export together.

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
python3 -m venv /absolute/path/runtime-build-venv
/absolute/path/runtime-build-venv/bin/python -m pip install -r scripts/build-requirements.txt
/absolute/path/runtime-build-venv/bin/python scripts/export-theme-runtime.py --out build/theme-author-runtime
```

Keep the Python environment outside the source checkout so it stays clean. On
Windows use the environment's `Scripts/python.exe` instead of `bin/python`. The
export downloads pinned font sources and needs network access on the first run.
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

The former explicit PR export is superseded by the matched toolkit 0.2.0 bundle.
Its pinned runtime includes `ribbon-layout-v1` and `video-wallpaper-v1` from
published Home 1.10.0. Use `examples/ribbon` with `.runtime/candidate` for
validate, preview, build and outgoing transfer. Older verified runtimes without
the required contract are refused with `update-runtime`; a theme cannot upgrade Home.
The runtime manifest retains candidate status as explained above. Desktop tests
do not establish physical-TV playback or receiver acceptance.
