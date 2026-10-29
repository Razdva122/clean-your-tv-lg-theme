# Theme installation IDs without API keys

For a published public theme, **TV link** in the preview can retrieve its release
link or create one through is.gd. The ID is convenient for remote entry:

- `102300a209`
- `is.gd/102300a209`
- `https://is.gd/102300a209`

All three identify the same version. Matching Home candidates accept them under
**Settings → Appearance → More options → Add by URL**, show the expanded address
before loading, then check the GitHub destination and the package as usual.
Full GitHub links remain accepted. The example is a real public Channel 1.3.3 link;
using an ID does not upgrade an older Home package.

## Copy or create an ID in preview

Select your theme and choose **TV link**. The tools look for a `vX.Y.Z` release
matching the source's `themeVersion`, using the release metadata produced below.
You can also paste the exact public `cytv-theme.json` URL, pinned to its distribution
commit, then choose **Create short link**. Use **Copy ID** for remote entry or
**Copy link** for sharing. The descriptor ID, version and repository must match
the selected theme. Classic is already built in and needs no link.

The tools check the public descriptor before contacting is.gd and verify the
returned link's destination. No key or account is required. If is.gd is unavailable
or rate-limited, the full URL remains available. Requests do not hammer the
provider with automatic retries. A failed/changed input clears previous results
so an older ID cannot accidentally be copied for a newer address.

Files existing only on your PC are sent with **Send to TV** instead. Creating a
short link does not upload or expose a local folder, and does not submit anything
to the main project's Showcase.

## Generate IDs automatically on release

Use a trusted toolkit candidate bundle or a checkout of its reviewed commit.
From your own theme repository, run once:

```sh
node /absolute/path/clean-your-tv-lg-theme/bin/theme.cjs release-workflow
```

This creates `.github/workflows/theme-links.yml` without overwriting an existing
file. The generated workflow pins the exact toolkit source commit, supplied by
the bundle's `toolkit-source.json` or the trusted toolkit checkout. It never checks
out floating tooling from `main` or from the theme author's repository.

Commit the workflow to your default branch. Build and commit the validated theme
distributions as documented in the tutorial, under:

```text
distributions/forest/1.0.0/cytv-theme.json
distributions/ocean/1.0.0/cytv-theme.json
```

Push the distribution commit, then publish a GitHub release tagged `v1.0.0` at
that commit. The workflow:

1. Reads tracked descriptors matching that version, without running theme scripts.
2. Checks their public bytes against the distribution checkout before shortening.
3. Creates one immutable is.gd link per theme/version, with a lowercase hexadecimal
   ID. Repeated calls reuse an existing alias only after checking its destination.
4. Attaches `tv-links.json` and adds a clickable ID table to the release notes.
5. Reads the current release notes immediately before updating its owned block,
   preserving edits made after the initial publication event.

The standard GitHub job token is provided automatically for updating your own
release; no shortening-service secret is needed. Several themes can share one
release. Each has its own stable ID, version and distribution path. If there are
no matching distributions or their public bytes differ, link generation fails
without replacing release notes. A shortening outage preserves full URLs.

## Provider and scope

is.gd is an external, rate-limited service. Its API supports keyless creation and
JSON lookup; its URLs cannot be retargeted. The package remains at its immutable
GitHub URL, and Showcase records keep that full URL and descriptor digest.

- [Creation API](https://is.gd/apishorteningreference.php)
- [Lookup API](https://is.gd/apilookupreference.php)
- [Provider limits](https://is.gd/usagelimits.php)

Browser and source tests are not physical-TV acceptance. The matching Home package
must include ID lookup support; older packages do not acquire it from a short link.
