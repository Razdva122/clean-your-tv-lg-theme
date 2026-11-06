# Ribbon (bundled theme source)

Black Hole video by **Xecutioner**, native 3840×2160 with subtle original motion, compact app logos and a skewed bottom ribbon. Non-commercial use with author attribution is permitted as confirmed by the maintainer; see [license](LICENSE.txt), [credits](CREDITS.txt) and [artwork provenance](ARTWORK.md). The video is not MIT artwork.

![Ribbon with Black Hole](previews/no-root-home.png)

[Try Ribbon in the browser demo](https://razdva122.github.io/clean-your-tv-lg-webos/demo/). Choose Ribbon in the theme selector. Demo functions use simulated services and reference app icons; these images are browser renders, not TV screenshots. Public demo deployment follows publication from main.

The source embeds native UHD/FHD silent video and an UHD JPEG fallback. The trusted runtime uses a continuous bounded stream for the pinned Black Hole UHD media, avoiding a seek at every repeat; unsupported engines keep ordinary video/image fallbacks. Black Hole can also be selected in Wallpapers over another theme. Accepting a different theme restores its own background; Black Hole and personal uploads remain available for reselection.

This editable toolkit example mirrors application v1.9.0 / Ribbon 1.3.0 with a
separate author identity. Use the toolkit 0.2.0 bundled runtime:

```sh
npm run theme -- validate examples/ribbon --runtime .runtime/candidate
npm run theme -- preview examples/ribbon --runtime .runtime/candidate
```

The trusted runtime recognizes the exact Black Hole UHD hash and can use its
verified continuous stream. Other external media uses the ordinary MP4 path. Author preview does not prove external installation, native
playback, standby, cold boot or update behavior. Preserve the artwork's
non-commercial terms and attribution when adapting or redistributing it.
