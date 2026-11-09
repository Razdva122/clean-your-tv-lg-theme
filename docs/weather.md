# Weather in a theme

Use the matching weather-capable main-project candidate runtime. This work is
prepared for the Home weather integration, not proof of a published TV release.
Existing published packages stay immutable; build a new theme version.

Add `weather` inside `layout` in theme.json:

```json
"weather": {
  "formats": ["text", "current", "details", "forecast"],
  "scale": 1,
  "padding": 24,
  "icons": "fill"
}
```

Formats: `text` (Compact), `current` (Now), `details` (Now plus available wind,
precipitation probability and humidity), `forecast` (Now plus four daily ranges).
Use `["text"]` for a compact-only design; `[]` disables weather. All Ribbon
compositions suppress it. Scale is 0.85–1.25, padding is an integer 0–32, icons are
bundled `fill` or theme-colored `monochrome`. No user styling controls are created.

The shared compiler adds the paired `weather-v1` capability. Old Home safely
rejects the new package; changing a theme cannot upgrade its renderer. Legacy
non-Ribbon themes remain valid with all formats and inherited appearance.

```css
.ctv-weather { color: #eeeeef; background-color: #182330; border-radius: 12px; }
.ctv-weather-secondary { color: #b9c6d4; }
.ctv-weather-bar { background-color: #88bbff; }
```

Other approved parts: `.ctv-weather-temp`, `.ctv-weather-condition`,
`.ctv-weather-track`, `.ctv-weather-day`, `.ctv-weather-icon`. Existing typed
property limits apply. Accepted Home/clock colors and typography are inherited;
explicit weather rules win. Compact keeps a transparent surface. Home owns
placement, safe spacing around apps/Inputs, early hiding during scrolling,
localization, units, provider requests and opt-in location. Theme CSS cannot
change endpoints, insert content, position weather or execute author JavaScript.

In `theme preview` / `theme showcase`, use **Example weather** and **Units** above
the screen. These controls use synthetic Berlin data through the trusted local
adapter, with no real weather/IP lookup. They use the actual Home renderer and
settings; unsupported formats follow the theme. Test Compact, Now, In detail and
4 days, settings previews, app navigation, Inputs and scrolling. Check long
translated labels and contrast on the actual wallpaper. Browser coverage does
not establish physical TV readability, TLS/CORS, wake or remote acceptance.

For a temporary maintainer fork, retain original author and license/asset credits,
use your fork's own package identity, and publish separate source changes that
upstream can merge with its original identity. The reviewed catalog may record
`upstreamRepository`; source/package URLs and hashes must still identify the fork.

## Reviewed candidate evidence

Exact runtime source: `afc8586955802270167daed6cd3a445fc31ff364` in the main
project, exported from a clean checkout. Runtime format remains candidate, with
a complete SHA-256 inventory; no separate stable download is invented.
The Home integration and Sources dialog are reviewed in
[main PR #463](https://github.com/Razdva122/clean-your-tv-lg-webos/pull/463).
Browser tests include both editions, synthetic four-day weather, unit conversion,
Off hiding and zero outgoing weather/geolocation provider requests. Existing
examples, send/publication boundaries, reload, viewport and packaging checks run
with this matched export. No physical-TV acceptance is claimed.
