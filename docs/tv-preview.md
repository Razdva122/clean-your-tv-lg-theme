# Preview with original TV application icons

The default showcase uses synthetic app IDs and public SVG brand artwork. These
are useful examples, not the actual resources shipped by a webOS application.
Use a private local inventory snapshot when assessing native resolution, opaque
backgrounds, transparency and CSS-only effects such as Sharingan's white logos.

```sh
npm run theme -- showcase examples --runtime .runtime/candidate \
  --inventory .runtime/private-tv/inventory.json --port 8877
```

The author header says **TV snapshot**; omitting `--inventory` says **Demo apps**.
The original icon bytes are retained across theme switches. Missing icons use the
renderer fallback; demo logos are never silently substituted. Preview actions
and launches remain simulated and do not control the TV. A snapshot is static;
read a new one when the installed apps or their resources change.

The option also works with `preview` and `screenshots`. It affects browser data
only; `build` and `send` cannot embed your private inventory in a theme. Snapshot
screenshots are personal data and should not replace the public synthetic gallery
or enter a repository/PR without the owner's explicit consent.

## Snapshot format

Use the existing trusted installation/inventory capture to obtain actual icons.
For a Root device the read-only `dev/listApps` query and the app-inventory adapter
read app-owned PNG/JPEG/WebP resources. This is separate from installation: no TV
package, Home state or routing change is required. Retain the original bytes,
without redraw, resizing, removal of backgrounds or vector replacement.

Store the resulting minimal JSON outside Git, preferably under ignored `.runtime/`
with directory permissions 700 and file permissions 600:

```json
{
  "apps": [
    {"id": "com.example.app", "title": "Example", "icon": "", "iconColor": "#000000"}
  ],
  "inputs": []
}
```

An icon is either empty (a genuinely missing resource) or
`data:image/png;base64,...`, `data:image/jpeg;base64,...` or
`data:image/webp;base64,...` containing the original file. Do not pass an entire
recovery backup: only apps and optional input labels are needed, never pairing
keys, credentials, network settings or raw logs. Unknown fields are discarded.

The loader bounds JSON to 16 MiB, 200 apps, 100 inputs and each icon to 256 KiB;
it rejects duplicate IDs, URLs, filesystem icon paths, SVG and mismatched binary
signatures. The loopback server marks private inventory scripts as same-origin
resources and rejects cross-site requests. Snapshots are not copied into runtime
exports, theme distributions, candidate bundles or the public gallery.
