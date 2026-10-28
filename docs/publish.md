# Build and publish

Validate first. Build only from committed author sources; the toolkit refuses
dirty/untracked theme files and checks the supplied commit is HEAD. Use the full
40-character commit of your author repository and an output outside the theme:

```sh
npm run theme -- build themes/ocean --runtime .runtime/candidate --source-repository https://github.com/YOUR-NAME/YOUR-THEMES --source-commit FULL_40_CHARACTER_COMMIT --out dist/ocean
```

The output is `cytv-theme.json`, typed `rules.json`, hashed static assets,
LICENSE/credits and validation-report.json. Nothing invokes author repository
scripts. Identical committed input and runtime produce identical files; the
report records candidate/renderer provenance and makes no device acceptance claim.
Output must be empty so old assets cannot silently accompany a new distribution.

Build a second theme into `dist/forest`, then create a repository discovery index:

```sh
npm run theme -- collection dist/ocean dist/forest --out dist --runtime .runtime/candidate
```

This creates `dist/cytv-themes.json` with independent identity/version, relative
descriptor path and digest for each theme. It rejects duplicate IDs, cross-repository
entries and descriptors outside the collection root. Publish the resulting data
files together at a commit or release. Put `cytv-themes.json` at repository root
for repository-root discovery, preserving relative descriptor/asset paths.
A single-theme repository can instead put its distribution at root with
`cytv-theme.json`. An invalid collection must not silently select another theme.

Paste your public repository URL (for collection selection), or the exact public
GitHub descriptor URL into the theme installer when supported by the TV candidate.
A moving branch is resolved once; themes never follow a branch live. A convenient
tag is not proof bytes are immutable. Each update needs a new themeVersion/digest.
Theme transport/TV installation is candidate work; this toolkit does not claim a
verified released TV flow or hardware compatibility.

Personal installation does not need a showcase submission. Showcase lives in the
**main** `Razdva122/clean-your-tv-lg-webos` repository. Submit one reviewed record
per theme under `showcase/registry/` in a PR targeting `release/next`, following
that repository's current schema and review instructions. Listing does not
implicitly bundle a theme. Never publish personal screenshots or raw diagnostics.

## Capture browser review images

Install the pinned browser explicitly, independently from npm dependency setup:

```sh
npm exec playwright install chromium
npm run theme -- screenshots themes/ocean --runtime .runtime/candidate --out screenshots/ocean --edition no-root
```

The command captures Home, Inputs and trusted Settings at 960×540, English locale
and a fixed clock. It checks the theme stylesheet is disabled for Settings and
writes provenance.json with browser version, runtime revision and candidate state.
It does not claim TV acceptance. A missing pinned browser produces an installation
instruction. For a maintainer diagnostic only, `--browser-executable PATH` selects
an explicit local browser and the report marks that departure from the pin.
Use the Home image as your source preview asset, update its declared dimensions,
commit the changed sources and rebuild. Automatic scrolled-grid and full locale/
empty-apps/long-name scenario matrices are not provided in this candidate.

## Create a showcase draft

After publishing the distribution in commit B, keep manifest source commit A:
these are deliberately independent; putting a self-referential commit hash inside
its own descriptor is impossible. Use the exact raw descriptor URL at B:

```sh
npm run theme -- submission dist/ocean --runtime .runtime/candidate --source https://raw.githubusercontent.com/YOUR-NAME/YOUR-THEMES/DISTRIBUTION_COMMIT/dist/ocean/cytv-theme.json --out submission/ocean --date YYYY-MM-DD --evidence "Actual browser scenarios and observed results" --tags dark,minimal
```

Replace every placeholder with real values. Supply the actual review date/evidence;
never imply unperformed device tests. The output is a **draft** containing a registry
record and copied hashed files in the main showcase's expected directory structure.
The exact main-runtime submission validator checks both record and copied bytes.
Copy registry/ and assets/ into the main project's showcase/ and open a PR targeting
release/next. The command does not post anything. Maintainers must review evidence,
credits, ownership and review dates before approving. Use one draft per theme.
