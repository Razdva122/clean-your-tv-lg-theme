# Build and publish

Use a separate public GitHub repository for your theme sources and distributions.
Keep the trusted toolkit and its complete runtime in their original directory;
see [the walkthrough](tutorial.md#2-create-an-independent-identity) for setup.
Run these macOS/Linux shell commands (or Git Bash on Windows) from **your author
repository root**, with the absolute toolkit path:

```sh
THEME_TOOLS=/absolute/path/clean-your-tv-lg-theme
```

## Publish one version

1. Finish CSS, identity, licenses, credits and the real preview image. Validate
   and review the browser scenarios. Set `themeVersion` in `themes/ocean/theme.json`
   to `1.0.0` for this example. Keep the stable ID for later versions; increment
   `themeVersion` when publishing changed bytes.
2. For automatic installation IDs, [generate the release workflow](short-links.md#generate-ids-automatically-on-release)
   from a reviewed, already public toolkit commit before publishing your release.
3. Inspect `git status --short` and `git diff`, then stage only the intended theme
   files and workflow. Commit the sources. Record **source commit A** with
   `git rev-parse HEAD`. Keep private TV snapshots, credentials and unrelated
   local changes out of the commit.
4. Build from A into a new version directory outside the theme source folder:

   ```sh
   node "$THEME_TOOLS/bin/theme.cjs" validate themes/ocean --runtime "$THEME_TOOLS/.runtime/candidate"
   node "$THEME_TOOLS/bin/theme.cjs" build themes/ocean --runtime "$THEME_TOOLS/.runtime/candidate" --source-repository https://github.com/YOUR-NAME/YOUR-THEMES --source-commit "$(git rev-parse HEAD)" --out distributions/ocean/1.0.0
   ```

   Replace the repository placeholder with your actual public repository. Build
   checks that the supplied full commit is HEAD, all theme files are tracked and
   the theme folder is clean. Output must be new/empty. Never overwrite a
   historical published version.
5. Generate discovery at its final location, the author repository root:

   ```sh
   node "$THEME_TOOLS/bin/theme.cjs" collection distributions/ocean/1.0.0 --out . --runtime "$THEME_TOOLS/.runtime/candidate"
   ```

   Root `cytv-themes.json` contains a root-relative descriptor path and SHA-256
   digest. For several themes, list one current distribution directory per theme
   before `--out .`. Supply the full desired list: this replaces the index rather
   than appending. Do not move an index generated elsewhere; its relative paths
   would change meaning.
6. Inspect the generated files and `git diff`. Commit the intended
   `distributions/ocean/1.0.0/`, root index and workflow as **distribution commit B**.
   Record B with `git rev-parse HEAD`, then push it to your public repository.
   The descriptor's `source.commit` stays A; its immutable URL uses B:

   ```text
   https://raw.githubusercontent.com/YOUR-NAME/YOUR-THEMES/DISTRIBUTION_COMMIT/distributions/ocean/1.0.0/cytv-theme.json
   ```

   Replace DISTRIBUTION_COMMIT with the full B hash. Bare repository URLs use the
   default branch: merge/push the root index there before expecting discovery.
   The exact B descriptor URL works independently of default-branch discovery.
7. For automatic IDs, publish a GitHub release in **your theme repository** tagged
   `v1.0.0` at B. The tag without `v` must exactly match `themeVersion`. Mark a
   candidate theme release as a prerelease when appropriate. This publishes a
   theme package; it does not release Home or upgrade the TV application. Wait
   for **Theme installation links** to succeed, then verify the `tv-links.json`
   release asset and installation table in release notes. In preview use
   **TV link → Retry lookup** and check the published version before copying.
   See [ID workflow instructions](short-links.md#generate-ids-automatically-on-release).

Output contains `cytv-theme.json`, hashed typed rules, static assets, notices and
`validation-report.json`. No author script runs. Identical committed input and
runtime produce identical files. The report records candidate provenance and
makes no device acceptance claim. A and B are separate because a descriptor
cannot contain the hash of its own enclosing commit.

An immutable descriptor URL works without an ID or Showcase submission. On the
matching TV candidate use **Settings → Appearance → More options → Add by URL →
Load**. Root collections offer theme selection. Installed themes apply without a
timer; the separate Showcase's **Try theme** has a 20-second Keep/Revert trial.
Older published Home packages may lack these candidate controls. A moving branch
is resolved once, never followed live; a tag alone does not prove immutability.

Personal installation does not require a Showcase submission. Showcase belongs
to the **main** `Razdva122/clean-your-tv-lg-webos` repository. Submit one reviewed
record per theme in a PR targeting `release/next`. Listing does not automatically
bundle a theme. Never publish personal screenshots or raw diagnostics.

## Capture browser review images

Install the pinned browser explicitly, independently from npm dependency setup:

```sh
cd "$THEME_TOOLS"
npm exec playwright install chromium
cd /absolute/path/YOUR-THEMES
node "$THEME_TOOLS/bin/theme.cjs" screenshots themes/ocean --runtime "$THEME_TOOLS/.runtime/candidate" --out screenshots/ocean --edition no-root
```

The command captures Home, Inputs and trusted Settings at 960×540, English locale
and a fixed clock. It checks the theme stylesheet is disabled for Settings and
writes provenance.json with browser version, runtime revision and candidate state.
It does not claim TV acceptance. A missing pinned browser produces an installation
instruction. For a maintainer diagnostic only, `--browser-executable PATH` selects
an explicit local browser and the report marks that departure from the pin.
Copy `screenshots/ocean/home.png` to `themes/ocean/assets/preview.png`, replacing
the starter placeholder. Keep it at most 960×540 and 300 KiB; compress externally
if needed. Update the asset dimensions and preview credits in the source, validate,
then commit the changed sources before building. Automatic scrolled-grid and full locale/
empty-apps/long-name scenario matrices are not provided in this candidate.

## Create a showcase draft

After publishing the distribution in commit B, keep manifest source commit A:
these are deliberately independent; putting a self-referential commit hash inside
its own descriptor is impossible. Use the exact raw descriptor URL at B:

```sh
node "$THEME_TOOLS/bin/theme.cjs" submission distributions/ocean/1.0.0 --runtime "$THEME_TOOLS/.runtime/candidate" --source https://raw.githubusercontent.com/YOUR-NAME/YOUR-THEMES/DISTRIBUTION_COMMIT/distributions/ocean/1.0.0/cytv-theme.json --out submission/ocean --date YYYY-MM-DD --evidence "Actual browser scenarios and observed results" --tags dark,minimal
```

Replace every placeholder with real values. Supply the actual review date/evidence;
never imply unperformed device tests. The output is a **draft** containing a registry
record and copied hashed files in the main showcase's expected directory structure.
The exact main-runtime submission validator checks both record and copied bytes.
Copy registry/ and assets/ into the main project's showcase/ and open a PR targeting
release/next. The command does not post anything. Maintainers must review evidence,
credits, ownership and review dates before approving. Use one draft per theme.

## Bundled versus external examples

Classic and Alpine are bundled by the main candidate. Channel is its ordinary external showcase theme. The old external Alpine distribution remains immutable for historical reproducibility; its catalog listing is archived, and the bundled descriptor uses `builtin:alpine`. Copying the editable Alpine example into your own repository still requires an independent ID, author and redistribution notices. Do not edit historical distribution directories in place.
