# Author toolkit candidate

Historical development record. For toolkit 0.1.0, use the [release guide](RELEASE.md)
and current `runtime.lock.json`; the older commit and artifact below are retained
as evidence of their original candidate run.

The `release/next` branch collects the author tools for the main project's 1.6.0
candidate. Toolkit version `0.1.0-candidate.1` is independent of the TV application's
version. This is a development toolkit artifact, not a stable TV application release.
Published theme prereleases have their own version and installation ID.

`runtime.lock.json` records the exact reviewed main-project commit. The candidate
workflow checks out that commit from the fixed main repository, exports the runtime
from its clean checkout, and runs all toolkit tests with the exported runtime and
a browser. It never downloads tooling from theme-author repositories or a floating
`main`/`latest` reference. The normal unit workflow additionally covers Linux,
macOS and Windows.

## Download and open

1. Open this repository's **Actions → Author toolkit candidate** and select the
   successful run for the candidate commit under review.
2. Download **theme-toolkit-candidate**. Unzip the Actions download, then extract
   `clean-your-tv-lg-theme-candidate.tar.gz` into a new directory. Keep its
   `.runtime/candidate` directory together with the tools.
3. Install Node.js 22 or later. In the extracted `clean-your-tv-lg-theme` directory:

   ```sh
   npm ci --ignore-scripts
   npm run theme -- showcase examples --runtime .runtime/candidate
   ```

4. Open the local address printed by the command and select a theme. The browser
   shows the actual Home renderer; CSS changes reload in the preview.
5. On TV open **Settings → Appearance → Receive from computer**. On the computer
   choose **Send to TV**, enter the TV address and temporary PIN, then send.
6. Finish installation on TV and choose **Apply theme**. The computer sends an
   outgoing connection; no incoming computer firewall permission or sharing
   server is required. Both devices must share a trusted home network.

There is no reverse-download fallback or `share` command. If the TV receiver is
unavailable, update its complete matching Home/service and supported retained
worker setup. A toolkit update alone cannot add the TV receiver. Previously
installed themes remain usable offline.

## Provenance and limits

The Actions artifact includes `candidate-provenance.json` with toolkit commit,
runtime source, run/attempt and archive SHA-256. On macOS/Linux, compare the archive
using `shasum -a 256 clean-your-tv-lg-theme-candidate.tar.gz`; on Windows use
`Get-FileHash -Algorithm SHA256 clean-your-tv-lg-theme-candidate.tar.gz`.
The runtime's own manifest records its exported files and hashes; the toolkit
checks that manifest when it opens the runtime.

A green browser/CI run proves the declared source checks, not TV compatibility,
standby, cold boot, OTA or rollback. Match physical observations to the exact TV
candidate and this toolkit artifact. No GitHub Release, stable tag or application
signing is performed by this workflow.


The current paired runtime includes the one-row installed-theme picker: the active
version is first, with a distinct surface and border, and remote focus reveals a
whole card. Alpine source 1.4.4 also styles the expanded inputs as a translucent
scenic panel. The built-in Alpine remains part of Home; Channel remains external.

The unpublished short-ID feature now uses da.gd. The former is.gd endpoint stalled
at TLS on the maintainer C3 network path. On that same TV and original route, the
da.gd development resolver accepted the bare ID and full short URL and verified
all 12 Channel files. This module check is separate from signed-candidate UI
acceptance. Full pinned GitHub links and Send to TV remain available; certificate
checks are unchanged.

## Sharingan author runtime

The paired runtime now pins main-project commit
`0db8b9bbf4b899c9384eb8a916cf55b03e84b3d6`, a clean, publicly fetchable main-project revision with
clock/date font sizes and the optional `modern-icon-css-v1` contract. The toolkit
ships editable Sharingan in `examples/itachi`, including its own identity and
redistribution notices. The existing ordinary validate, preview, screenshots,
build and outgoing Send to TV workflows handle it without a theme-specific
compiler or relaxed policy. Browser checks are not physical-TV acceptance.

The paired local runtime also includes the original ten-app international TV
reference and clears sampled tile backgrounds on icon failure/recovery. The source is available in [runtime PR #167](https://github.com/Razdva122/clean-your-tv-lg-webos/pull/167).
The toolkit/runtime pair was rebuilt and tested by Actions; this does not publish
a stable runtime or establish physical-TV acceptance.


## Verified author-flow run — 2026-10-30

Download [candidate run 41030185462](https://github.com/Razdva122/clean-your-tv-lg-theme/actions/runs/41030185462), artifact **theme-toolkit-candidate**. This exact artifact was downloaded, hash-checked, extracted into a fresh directory, installed with `npm ci --ignore-scripts`, and used to validate Itachi.

- Toolkit/distribution commit: `a361b56c81f5dd0e13fd91e5bbd9ac6c40794c79`.
- Runtime source: `0db8b9bbf4b899c9384eb8a916cf55b03e84b3d6`, clean export.
- Archive SHA-256: `d4d11f82c01a9d0c16bd24ce6eb18c641feeafcde8198e04527ae9503b75b44c`.
- Paired suite: 61 tests, no failures or skips. Unit matrix and candidate CI passed.

The separate [Itachi 1.0.2 theme prerelease](https://github.com/Razdva122/clean-your-tv-lg-theme/releases/tag/v1.0.2) completed its real ID workflow. ID `9e278d443a` downloaded, verified, installed, applied and restored offline in both browser preview editions using this artifact. No physical TV installation was performed. See [the complete audit record](author-flow-audit.md).

Actions artifacts can expire; use a successful matching reviewed candidate if this download is no longer available. Never replace its runtime with unrelated files.
