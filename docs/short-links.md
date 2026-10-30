# Theme installation IDs without API keys

For a published public theme, **TV link** in the preview retrieves a verified published
installation link and an existing ID when available. The ID is convenient for remote entry:

- `102300a209`
- `da.gd/102300a209`
- `https://da.gd/102300a209`

All three identify the same version. Matching Home candidates accept them under
**Settings → Appearance → More options → Add by URL**, show the expanded address
before loading, then check the GitHub destination and the package as usual.
Full GitHub links remain accepted. The example is a real public Channel 1.3.3 link;
using an ID does not upgrade an older Home package.

## Copy a published ID or link in preview

Select your theme and choose **TV link**. The dialog shows the **last published
version of that theme**, which can be older than your local `themeVersion`. It
checks public GitHub release metadata for the selected theme ID and repository,
chooses the latest publication date (including published prereleases), and verifies
the commit-pinned descriptor against its recorded SHA-256 digest. Drafts are ignored.
When no matching release entry exists, it resolves the public repository's default
HEAD to an exact commit, reads root `cytv-themes.json` at that revision, and verifies
the selected theme's identity, version, relative path and descriptor SHA-256. This
fallback shows the current public collection entry even without release metadata;
it never reads your local collection. Classic is already built in and needs no link.

**Local edits, uncommitted changes and a newer local version are not included in
this link.** Use **Copy ID** for remote entry or **Copy link** for sharing. Opening
the dialog only reads published metadata. If the verified publication has no ID,
**Create installation ID** explicitly asks da.gd to shorten that public immutable
URL. The server rechecks the selected publication and its digest; it accepts no
caller-supplied URL or local files. An outage preserves the verified full link.
Neither action publishes the theme, uploads local edits or sends anything to TV.
The release workflow below can also generate installation IDs. No key or shortener account is required.

If neither release metadata nor the public root collection contains the selected
theme, the dialog explains how to build, commit, publish and generate an ID. A
missing collection (HTTP 404) is distinct from an invalid or unavailable collection.
Repositories with other publication layouts cannot be discovered here; an empty
result does not establish that the repository has no releases.
Connection errors, missing/private repositories, rate limits, malformed metadata
and descriptor mismatches show a lookup failure, never an unpublished claim.
**Retry lookup** rechecks publication. Lookup is limited to 1,000 releases; reaching
that bound fails explicitly instead of selecting a possibly stale publication.

The tools verify the short link's exact destination before offering its ID. The
collection fallback checks only the existing deterministic alias for its exact
immutable URL; opening the dialog never creates one. A published collection entry can therefore
provide a full link while its ID remains unavailable. If the
shortener is unavailable or its lookup differs, the verified full immutable URL
remains copyable and the dialog explains that the ID is unavailable. A failed
lookup clears previous results. The full URL still requires the normal TV package
validation and does not establish device compatibility.

Files existing only on your PC are sent with **Send to TV** instead. TV links do
not submit anything to the main project's Showcase.

## Generate IDs automatically on release

Use a trusted toolkit candidate bundle or a checkout of its reviewed commit.
The toolkit revision must already be public: the generated workflow later checks
out that exact commit from GitHub. Use a clean trusted checkout whose current
HEAD contains the reviewed tooling, or a tested bundle with `toolkit-source.json`.
Local uncommitted toolkit changes are not included in that pin. From your own
theme repository root, run once:

```sh
THEME_TOOLS=/absolute/path/clean-your-tv-lg-theme
node "$THEME_TOOLS/bin/theme.cjs" release-workflow
```

This creates `.github/workflows/theme-links.yml` without overwriting an existing
file. The generated workflow pins the exact toolkit source commit, supplied by
the bundle's `toolkit-source.json` or the trusted toolkit checkout. It never checks
out floating tooling from `main` or from the theme author's repository.

Inspect the generated toolkit `ref` and confirm that commit is public. Commit the
workflow to your default branch and include it in the release distribution commit.
Follow [the source A / distribution B sequence](publish.md#publish-one-version).
The workflow scans **tracked `distributions/**/cytv-theme.json` files only**;
packages under ignored `dist/` are not discovered. Use paths such as:

```text
distributions/forest/1.0.0/cytv-theme.json
distributions/ocean/1.0.0/cytv-theme.json
```

Push distribution commit B, then publish a GitHub release in your **theme
repository** tagged `v1.0.0` at B. Its workflow file must exist at B before the
release is published. Each included descriptor must have `themeVersion: "1.0.0"`:
the tag without `v` must match exactly. Contract-valid prerelease tags such as
`v1.0.0-beta.1` work when the descriptor version is `1.0.0-beta.1`. Mark candidate
releases as prereleases when appropriate. This does not release Home.
The workflow:

1. Reads tracked descriptors matching that version, without running theme scripts.
2. Checks their public bytes against the distribution checkout before shortening.
3. Creates one immutable da.gd link per theme/version, with a lowercase hexadecimal
   ID. Repeated calls reuse an existing alias only after checking its destination.
4. Attaches `tv-links.json` and adds a clickable ID table to the release notes.
5. Reads the current release notes immediately before updating its owned block,
   preserving edits made after the initial publication event.

The standard GitHub job token is provided automatically for updating your own
release; no shortening-service secret is needed. Several themes can share one
release. Each has its own stable ID, version and distribution path. If there are
no matching distributions or their public bytes differ, link generation fails
without replacing release notes. A shortening outage preserves full URLs.

Wait for **Actions → Theme installation links** to finish. Confirm `tv-links.json`
is attached to the release and the installation table appears in its notes. Then
use **TV link → Retry lookup** and verify the displayed version. If the workflow
fails, inspect its error and rerun that failed Actions run after resolving the
cause; generating a local workflow file does not run it, and editing release
notes does not trigger its `release: published` event. A successful run may still
report an unavailable ID during a shortening outage; its full immutable URLs
remain usable. Root-collection discovery independently requires the index and
packages to be on the public default branch.

## Provider and scope

da.gd is an external, rate-limited service. Its API supports keyless creation and
plain-text lookup. The public creation API does not retarget an occupied alias;
the tools reuse it only after checking the exact destination. The package remains at its immutable
GitHub URL, and Showcase records keep that full URL and descriptor digest.

- [Creation API](https://da.gd/help)
- [Lookup API](https://da.gd/help)

Browser and source tests are not physical-TV acceptance. The matching Home package
must include ID lookup support; older packages do not acquire it from a short link.
