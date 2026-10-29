# Author toolkit candidate

The `release/next` branch collects the author tools for the main project's 1.5.0
candidate. Toolkit version `0.1.0-candidate.1` is independent of the TV application's
version. This is an unpublished test bundle, not a stable TV release.

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

Short IDs still require network access to is.gd. Physical C3 testing of the paired
Home candidate observed a TLS handshake timeout to is.gd while direct GitHub and
PC-to-TV delivery worked. This path is not accepted on that device/network; use
Send to TV or the full pinned GitHub link. No certificate checks are disabled.
