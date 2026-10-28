# Glasshouse-inspired theme candidate

Independent visual interpretation of [Glasshouse Home](https://github.com/rorygallagher2024/glasshouse/blob/main/server/assets/home.html):
large light Outfit clock, warm white text, small square app icons, quiet outlined
selection and a scenic background. No upstream logo or executable code is bundled.

The theme uses the renderer-owned `scenic-grid` preset, with eight columns by
default. An explicit user column choice still wins. Left/Right selects within a
row; Down/Up pages rows. The page range appears above the icons. The clock stays
fixed. Rearranging lifts icons above the trusted controls. Settings retain their
standard appearance. Classic and Channel remain available through the same picker.

Browser checks covered all five trusted presets at 1/3/6/8 columns in both
editions, navigation, reorder visibility, reset and override retention. The toolkit
suite passed 21 checks including compilation and missing-icon/Add-app contrast.
Home, Inputs and Settings captures use synthetic data; see
`examples/glasshouse/previews/provenance.json`. The Home PNG is palette-compressed
to meet the 300 KiB descriptor budget; composition and dimensions are unchanged.
Runtime source: `4bbc4227b01c0e388a5f6851845109345b8dd1cc`, candidate export.

The panorama is Hannes Röst's Fronalpstock, CC BY-SA 3.0; see the theme credits
and license. Wallpaper remains under its own license; theme code is MIT.
No physical TV, remote, firmware or webOS build was tested. Real launches,
installation, sound, standby, cold boot, OTA and rollback remain untested.
