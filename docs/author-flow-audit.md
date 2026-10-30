# Author-flow audit and real theme release — 2026-10-30

## Outcome

[Itachi · Sharingan 1.0.2](https://github.com/Razdva122/clean-your-tv-lg-theme/releases/tag/v1.0.2) is a real theme prerelease for the Home 1.6 development candidate. Installation ID: **9e278d443a**, [verified link](https://da.gd/9e278d443a). This did not release Home, change the physical TV appearance, or establish device compatibility.

## Confusing steps corrected

| Finding | Result |
| --- | --- |
| First-theme commands ran inside the toolkit while using another repository's identity | Show a separate author Git repository and absolute trusted `THEME_TOOLS` commands. |
| Publishing used ignored `dist/`, but release automation scans tracked `distributions/` | Use `distributions/<slug>/<version>` throughout. |
| Moving a generated collection to repository root broke relative paths | Generate once at its final root with `collection ... --out .`; list every intended current theme. |
| Source A and distribution B appeared too late in the instructions | Give the full commit/build/index/commit/push/release sequence before publication. |
| Runtime setup and starter preview were easy to miss | Prepare the paired runtime first, replace the 1×1 preview, update dimensions and credits before the source commit. |
| CLI help returned an error and omitted release commands | `help`, `--help`, subcommand `--help` and no-argument help now succeed and show the entire flow. |
| Local edits, direct transfer and published links could be confused | Explain current edits → Send to TV; verified publication → TV link; new public version → release steps. |
| A generated workflow could pin an unpublished toolkit commit | Require a clean trusted, already public toolkit revision and verify generated `ref` before publishing. |
| Creating a GitHub release could be mistaken for completed ID publication | Wait for the workflow, verify `tv-links.json` and the release note table, then retry the editor lookup. |

The English walkthrough/publishing/runtime/ID guides and Russian quick start now use the same sequence.

## Actual checks

1. Created a fresh, separate temporary author repository. Ran init; edited valid CSS and saw it apply; introduced invalid CSS and confirmed the last valid appearance remained; restored CSS; opened the two generic HDMI simulations and trusted Settings.
2. Captured a real browser preview, replaced the starter 1×1 image, updated dimensions/credits, committed author source A, built a tracked version directory, generated the root collection and committed distribution B.
3. Ran all 61 paired toolkit tests successfully, with no skips. Published the reviewed runtime support branch and toolkit changes; candidate CI and the unit matrix passed.
4. Downloaded the actual [Actions artifact](https://github.com/Razdva122/clean-your-tv-lg-theme/actions/runs/41030185462), verified archive SHA-256 `d4d11f82c01a9d0c16bd24ce6eb18c641feeafcde8198e04527ae9503b75b44c`, extracted into a fresh directory, installed dependencies and validated Itachi using its included runtime.
5. Built Itachi from source A `1a599feadd6be33dc8fbaccd568f321883e76150`; published distribution B `a361b56c81f5dd0e13fd91e5bbd9ac6c40794c79`. Public descriptor and all five referenced rules/assets/documents matched byte lengths and SHA-256. No old distribution directory was overwritten.
6. Published the real `v1.0.2` prerelease. [Release workflow 41030429736](https://github.com/Razdva122/clean-your-tv-lg-theme/actions/runs/41030429736) succeeded, attached `tv-links.json` and updated release notes with the verified ID.
7. Loaded bare ID `9e278d443a` through the actual Add by URL UI, with live public network requests and no publication mocks, in both browser editions. Verified download/install, explicit application and cached restoration after external HTTPS requests were disabled. Local renderer files remained available, matching an installed TV app's local resources.
8. Opened a separate uncommitted Itachi draft with local version `9.9.9` and changed clock styling. TV link still displayed published `1.0.2` and ID `9e278d443a`; Copy ID succeeded. The draft was never published.

## Limits and operational lessons

- Physical TV, model, firmware and remote acceptance: not tested in this audit. Standby, cold boot, OTA and rollback are not inferred from browser tests.
- Send-to-TV transport remains covered by its existing automated receiver tests; no transfer or appearance change was performed on a real TV during this audit.
- Root repository URL discovery follows the repository's default branch. The root index in release/next becomes available through a bare repository URL after integration; the published immutable descriptor and ID work independently now.
- A workflow stored in the tagged commit ran successfully even before integration into the default branch. `gh run list --workflow theme-links.yml` returned 404 because its filename was absent from the default branch; listing runs by release event and checking the release asset confirmed actual success. Do not interpret that CLI listing failure as failed publication.
- Setting the entire browser context offline also blocks a localhost-hosted test renderer. The offline restoration check instead blocked external requests while serving local app resources; both editions then passed.
- The toolkit remains a development candidate. Preserve the theme's personal fan-theme license and publisher artwork notices.
