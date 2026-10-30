# Author toolkit 0.1.0

The author toolkit version is independent of the TV application and of theme
versions. Its stable tag is **toolkit-v0.1.0**. The existing **v1.0.2** tag is
Itachi · Sharingan's theme prerelease; its files and installation ID are unchanged.

This toolkit pairs with Clean Your TV application **1.5.0**, whose Home component
is **1.6.0**. `runtime.lock.json` pins exact main-project source
`1fc8235ac564bd2d06ec53a41b07b26f48ba17e1`. The clean runtime export records this
commit, `dirty: false`, and every file's size/SHA-256. It retains `status: candidate`
because this author-runtime format is independent of signed TV packages. The
preview header therefore still says Candidate. No separate stable runtime URL
is pinned, and `runtime:fetch` remains disabled. Use the complete bundled export.

## Download and verify

Open [toolkit-v0.1.0](https://github.com/Razdva122/clean-your-tv-lg-theme/releases/tag/toolkit-v0.1.0)
after publication. Download `clean-your-tv-lg-theme-candidate.tar.gz` and
`candidate-provenance.json`. Their original candidate-workflow filenames are
retained so the tested Actions artifact and published assets can be compared
byte for byte. The provenance supplies the archive's SHA-256, toolkit commit,
exact runtime source and Actions run/attempt. Its
`publishedApplicationRelease: false` field describes the authoring artifact;
this workflow does not publish the TV application.

Compare the archive SHA-256 with provenance, using
`shasum -a 256 clean-your-tv-lg-theme-candidate.tar.gz` on macOS/Linux, or
`Get-FileHash -Algorithm SHA256 clean-your-tv-lg-theme-candidate.tar.gz` on Windows.
Extract into a fresh directory; install Node.js 22 or later, then:

```sh
cd clean-your-tv-lg-theme
npm ci --ignore-scripts
npm run theme -- validate examples/itachi --runtime .runtime/candidate
npm run theme -- showcase examples --runtime .runtime/candidate
```

Keep `.runtime/candidate` with the tools. The toolkit checks its complete file
inventory before loading compiler modules. Source archive downloads from GitHub
do not include an exported runtime; use the attached tested bundle or follow
[manual runtime preparation](runtime.md).

See [the author walkthrough](tutorial.md) for a separate author repository,
live CSS editing, outgoing Send to TV, immutable distributions and published IDs.
Browser preview and CI do not establish physical-TV behavior, native remotes,
standby, cold boot, OTA or rollback. Application release acceptance and known
limitations belong to the associated application release record.

## Maintainer publication gates

1. Confirm application 1.5.0 is published and its packages/feed are verified.
2. Require the toolkit unit matrix and the full paired candidate job to pass
   for the exact release candidate, with no paired-test skips. Download that
   run's `theme-toolkit-candidate` artifact and verify its provenance, runtime
   manifest and archive hash; extract, install and validate in a fresh directory.
3. Review/integrate toolkit PR #2 into main through normal repository protections.
   Tag the tested toolkit commit `toolkit-v0.1.0` only after it is reachable from
   main; if a merge changes its tree, rebuild and verify the new source first.
4. Publish a stable GitHub release with the two original verified artifact files.
   Do not overwrite theme tags/distributions or create theme IDs for this toolkit
   tag. The Theme installation links workflow intentionally skips toolkit tags.
5. Download both public assets again and compare byte hashes with the verified
   Actions artifact. Record the source commit, Actions run/attempt, hashes and
   actual checks in release notes; never infer device acceptance from them.
