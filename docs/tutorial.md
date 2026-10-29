# Your first theme: edit, preview, publish

This guide is for a contributor using a computer. Node.js 22+ runs the author tools; no TV connection is needed. Theme sources are CSS, JSON and licensed images. The toolkit runs the actual Home renderer with simulated services.

## 1. Prepare the tools once

Download the [matched candidate bundle](CANDIDATE.md), or clone `release/next`, open a terminal in its root and run `npm ci --ignore-scripts`. A source checkout also needs a maintainer-exported candidate in `.runtime/candidate`; follow [runtime preparation](runtime.md). No stable author runtime is published. Do not download a random theme repository as executable tooling.

For a visual comparison before editing:

```sh
npm run theme -- showcase examples --runtime .runtime/candidate --port 8877
```

Open **http://127.0.0.1:8877/** and click the Classic, Alpine or Channel preview card. Click inside Home before using arrows/Enter; Esc goes back. Hold Enter to rearrange an app. TV actions are simulated. Keep the terminal running and stop it with Ctrl+C. To compare saved images without Node, open `examples/index.html` as a file.

Classic is the built-in renderer, not a theme source to copy. Alpine uses a panorama and a looping horizontal ribbon. Channel uses a numbered list. Both include Inputs and standard Settings screenshots; Alpine also has a [library capture](previews/alpine-library.png).

## 2. Create an independent identity

Replace YOUR-NAME and YOUR-THEMES with your actual public GitHub owner and repository:

```sh
npm run theme -- init themes/ocean --name Ocean --repository https://github.com/YOUR-NAME/YOUR-THEMES --author "Your Name"
npm run theme -- preview themes/ocean --runtime .runtime/candidate --port 8766
```

Open **http://127.0.0.1:8766/**. The generated `theme.json` declares the title, stable lowercase ID, author, version, layout, assets and licensing. `theme.css` is the editable appearance. LICENSE.txt and CREDITS.txt must describe your actual work and every third-party image. The generated preview is a tiny placeholder; replace it before publication.

You can instead copy an example into your own theme folder. Change its ID, author/profile, title and source repository before publishing. Keep wallpaper/brand notices and original licenses unless you replace the corresponding assets. Alpine's `glasshouse` directory and ID are historical stable identifiers; Alpine is its display name.

## 3. Edit and see changes

Save `themes/ocean/theme.css`; valid changes appear automatically. Invalid CSS keeps the last working theme and shows a compiler error above Home. Start with:

```css
.ctv-home { color: #eeeae1; background-color: #182025; }
.ctv-clock { color: #eeeae1; }
.ctv-card { border-radius: 12px; }
.ctv-card.is-focused { border-color: #c5dfaa; }
```

Use the [CSS reference](authoring.md), not internal DOM IDs or guessed selectors. The renderer owns sizing, positions, hit areas and remote navigation. Settings and recovery stay standard. Author JavaScript, HTML, network CSS/fonts and arbitrary positioning are rejected.

## 4. Choose composition and columns

Edit `layout.preset` in theme.json: `dock-grid`, `icon-grid`, `side-grid`, `channel-list` or `scenic-grid`. The last is one infinitely looping row, not a two-row grid. Set columns 1–8; use spacingScale=1, textScale=1 and focusScale=1.1 in this candidate.

By default the user's explicit Columns setting wins over your default. Set `allowColumnOverride: false` when the composition requires its own fixed count, as Alpine does. The saved user choice returns when switching to an adjustable theme. This flag does not permit arbitrary card placement.

## 5. Add wallpaper and button artwork

Copy your licensed PNG/JPEG/WebP into the theme's assets folder. Declare an ID, relative path, media type and exact dimensions in `theme.json`. Set `defaults.wallpaperAssetId` to its ID, then adjust `defaults.dim` for readable text. Images cannot reference outside the theme or load from remote hosts.

Use [the header-icon recipe](authoring.md#replace-header-button-icons) for Inputs, Wi-Fi and Settings shortcut glyphs. Alpine includes outline artwork and Channel pixel artwork. Preserve visible labels and focused contrast. To let wallpaper show behind Add app, style the full-screen `.ctv-library` with a translucent scrim and keep `.ctv-library-panel` readable; an opaque full-screen background will cover the panorama.

## 6. Verify the complete experience

```sh
npm run theme -- validate themes/ocean --runtime .runtime/candidate
```

In preview check Home, the last app, Add app/library, empty library, Inputs, focused shortcuts, rearrange/cancel, long names, missing icons and standard Settings. Try mouse and keyboard. Browser results do not verify TV remote behavior, storage, standby, cold boot or updates.

Use [the screenshots command](publish.md#capture-browser-review-images) for fixed-clock Home/Inputs/Settings images and provenance. Review library screenshots too. The preview must be at most 960×540 and 300 KiB; other assets at most 1920×1080, 2 MiB each and 6 MiB in total. Resize/compress externally, update actual dimensions and validate again.

## Try an unpublished theme on your TV

In preview/showcase select a local theme, then **Send to TV**. First open
**Settings → Appearance → Receive from computer** on your compatible TV candidate.
Enter the TV's private IPv4 address and six-digit PIN into the dialog on your
computer, then choose **Send theme**. Keep both devices on the same home network.
The computer compiles the currently selected theme and sends an outgoing request
to the temporary TV receiver. No incoming computer connection or firewall change
is needed. Classic is built in; select another theme to send.

**Sent** means the TV received the bytes. Finish validation/installation on TV and
choose **Apply theme**. Sending does not prove installation or hardware acceptance.
If sending fails, reopen the TV receiver, check its current address and PIN, and
retry. Guest Wi-Fi or client isolation can block communication. Do not forward
port 8879 to the internet. The PIN is never saved; closing the dialog clears it.
After editing, send again for a fresh compiled snapshot.

Without a browser:

```sh
npm run theme -- send themes/ocean --tv 192.168.1.20 --pin SIX_DIGITS --runtime .runtime/candidate
```

Use the actual address and PIN shown on your TV. Avoid retaining a PIN in shell
history on a shared computer; the browser dialog is the primary workflow.

Transfers use PC → TV only. If the receiver is unavailable, update the complete matching Home/service set on TV; there is no computer-hosted fallback.

## 7. Commit, build and submit

Commit all theme source files before building. Follow [publishing](publish.md): source commit A produces a descriptor and hashed assets; commit the distribution separately as B, then use the exact descriptor URL at B. Never invent either hash or replace it with a moving branch in a catalog submission.

Several themes can share one repository: use `themes/ocean` and `themes/forest`, each with a unique stable ID, version, assets and credits. Build each separately, optionally create a collection index, and submit one showcase record per theme. A new version needs a new review; votes and automatic inclusion are not implemented.

## Can I choose this on my TV now?

The theme-enabled main candidate embeds theme cards and controls directly in **Settings → Appearance**; there is no separate Themes launch screen. Classic and Alpine are bundled; Channel stays external. Use **More options → Add by URL → Load**, choose a distribution entry, then its downloaded version. Installed and built-in themes apply and save immediately without a timer. The separate showcase refreshes from the main repository without reloading Home; its **Try theme** action retains the 20-second Keep/Revert trial. Local transfers offer **Apply theme** without a timer. Confirmed files are cached for offline startup; interrupted previews relaunch in Classic. Published packages may not include this candidate yet. Follow [the user guide](https://github.com/Razdva122/clean-your-tv-lg-webos/blob/release/next/docs/THEMES.md). Do not manually replace Home files or run author code on the TV. Browser results are not physical-TV acceptance.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| localhost refuses the connection | Start the preview command and keep its terminal open; check the printed port. |
| Runtime unavailable/hash mismatch | Use a complete trusted export; do not edit its inventory or executable files. |
| CSS selector/property rejected | Use the public parts and accepted values in authoring.md. |
| Images fail validation | Check manifest paths, MIME type, actual dimensions, byte limits and credits. |
| Last version remains on screen | Fix the error above Home; the preview deliberately retains the last valid theme. |
| Build refuses dirty input | Commit the source files, pass the exact HEAD and use an empty output outside the source folder. |
| There is no TV theme setting | That package does not include the theme-enabled candidate; a catalog listing cannot add the control. |

In the computer renderer, **Receive from computer** explains the steps on the TV instead of reporting an unavailable TV service. Use **Send to TV** above the preview. Classic is built in: its send dialog explains that no transfer is needed before asking for TV details. The renderer permits data requests only to the two GitHub origins used by the trusted theme loader; the outer author page remains restricted to same-origin network requests.
