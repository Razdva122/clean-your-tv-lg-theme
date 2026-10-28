# Glasshouse-inspired theme candidate

Independent visual interpretation of [Glasshouse Home](https://github.com/rorygallagher2024/glasshouse/blob/main/server/assets/home.html):
large light Outfit clock, warm white text, small square app icons, quiet outlined
selection and a scenic background. No upstream logo or executable code is bundled.

The theme uses the renderer-owned `scenic-grid` preset, with eight columns by
default. The author fixes this layout at eight columns with
`allowColumnOverride: false`; the Columns setting is hidden. Saved user choices
resume for Classic and Channel. Left/Right scrolls one horizontal ribbon and wraps at either end. Up opens
shortcuts; Down returns to the same app. The selected index appears above the icons. The clock stays
fixed. Rearranging lifts icons above the trusted controls. Settings retain their
standard appearance. Classic and Channel remain available through the same picker.

Browser checks covered all five trusted presets at 1/3/6/8 columns in both
editions, navigation, reorder visibility, reset and override retention. The toolkit
suite passed 21 checks including compilation and missing-icon/Add-app contrast.
Home, Inputs and Settings captures use synthetic data; see
`examples/glasshouse/previews/provenance.json`. The Home PNG is palette-compressed
to meet the 300 KiB descriptor budget; composition and dimensions are unchanged.
Runtime source: `1cd23e13b66eb26af76f9898821bc3eac93f069e`, candidate export.

The panorama is Hannes Röst's Fronalpstock, CC BY-SA 3.0; see the theme credits
and license. Wallpaper remains under its own license; theme code is MIT.
No physical TV, remote, firmware or webOS build was tested. Real launches,
installation, sound, standby, cold boot, OTA and rollback remain untested.

Column-policy follow-up: the on-TV entry is hidden in both editions for fixed
themes, direct opening is blocked, an already-open picker closes safely, and
Classic restores the saved user value. Main TV and preview groups passed; the
21 toolkit checks passed with fixed Glasshouse and adjustable Channel.


Ribbon follow-up (Glasshouse 1.2.0): the existing scenic preset now places all
apps on a single Y coordinate. Left/Right wraps forever, and the visible window
shifts horizontally. No cloned nodes, vertical paging or duplicate app actions.
Browser regressions in both editions cover two complete laps in each direction
at 1/3/8 visible slots, real motion with a parked pointer, menu return,
rearrangement/cancel and one-app/empty libraries. Related layout, Columns and
Channel navigation checks, the theme/compiler suite, TV compatibility and preview
group passed. The toolkit's 21 checks passed with this runtime. These are browser
and service simulations; physical-TV acceptance remains outstanding.
