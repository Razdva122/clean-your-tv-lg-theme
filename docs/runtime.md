# Runtime preparation and trust

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
