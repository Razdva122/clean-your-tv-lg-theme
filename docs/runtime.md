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
