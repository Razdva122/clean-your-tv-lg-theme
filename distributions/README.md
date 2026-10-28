# Immutable catalog distributions

These version directories contain generated data, not author code. Alpine 1.4.2 and Channel 1.3.2 were built from source commit `7af0aaf9826804f0cfa5ca5ef3dc08da751d3e4f` using main candidate runtime `68b8f51e5400a29aabaa84fda33275d772614d86` (explicit dirty snapshot). Each validation-report.json preserves the exact runtime inventory digest. No physical-TV acceptance is implied.

The main project catalog pins the later distribution commit, its descriptor digest and all manifest file hashes. Do not edit a published version directory in place; change themeVersion, commit author source and build a new version instead. The collection index is `cytv-themes.json`; each listing still links to its own specific descriptor.

Alpine preserves its stable `glasshouse` ID; Channel preserves `terminal`. Display names and directory names do not change installed identity. Their licensing and preview icon notices travel in hashed document files. External TV installation is still in development.
