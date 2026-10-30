# Ribbon

Ribbon uses an original procedural galaxy wallpaper, eight skewed app cards,
raised focus, compact native icons (`iconScale: 0.65`) and bottom-left shortcuts. The title is **Ribbon**; no webOS logo
or LG screenshot is included. Native app artwork comes from the trusted renderer
inventory; the preview depicts those icons, without packaging separate replacement icon files.

This example requires the [paired PR runtime](../../docs/runtime.md#ribbon-pr-candidate)
with `ribbon-layout-v1`. It uses ordinary `scenic-grid` plus optional
[`layout.ribbon`](../../docs/authoring.md#optional-scenic-ribbon-geometry-pr-candidate),
not a theme-specific renderer. Both editions use the same trusted geometry.

```sh
npm run theme -- preview candidate-examples/ribbon --runtime /absolute/path/ribbon-pr-runtime
```

Use Left from the first app to enter shortcuts and Right to return. The fixed
columns belong to the theme; switching back to Classic restores the user's
saved column preference. Settings and recovery keep their trusted appearance.
Browser preview uses simulated TV services and is not physical-device acceptance.

The wallpaper and styling are MIT; see [credits](CREDITS.txt) and [license](LICENSE.txt).
The thumbnail is a 960×540 downsample of the actual No-root runtime capture.
Full 1920×1080 [No-root](previews/no-root-home.png) and [Root](previews/root-home.png)
captures use the real source theme and reference app inventory.
[Provenance](previews/provenance.json) records the exact runtime manifest digest
and records the clean main PR candidate source (`dirty: false`). It does not
change the reviewed runtime pin or claim release/hardware acceptance.

This unreleased source is outside the stable example catalogue. Use a full
repository checkout and the explicit feature runtime; the stable candidate
bundle does not include Ribbon until its runtime pin is reviewed and upgraded.

Ribbon is also being bundled by the paired Home PR. TV users will select the built-in copy after updating Home; this independent candidate source is an authoring reference, not a required download for the built-in theme.
