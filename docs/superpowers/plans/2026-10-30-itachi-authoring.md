# Sharingan authoring implementation plan

**Goal:** Keep editable Sharingan sources in this author toolkit and support its ordinary validate, preview, screenshots and build workflow.
**Architecture:** Add examples/itachi under the toolkit repository identity. Pin the clean main-project runtime that provides font sizes and modern-icon-css-v1; never fork the renderer/compiler or relax validation. Preserve the old main-project source and immutable public distributions as legacy history.
**Scope:** Work in the user-selected release/next checkout. Retain the earlier popup/status and TV link UI changes. No TV installation, external publication or credentials.

## Task 1: Paired source and runtime

- [x] Add tests/itachi.cjs: build the real theme from a temporary committed source, validate required capability and every output hash, and render both editions with unchanged native icon URLs.
- [x] Run with the previous runtime and observe a missing-source/unsupported-CSS failure.
- [x] Import the theme, wallpaper, preview and notices from the main project into examples/itachi. Use github:razdva122/clean-your-tv-lg-theme:itachi and preserve historical attribution.
- [x] Pin runtime.lock.json to the exact clean main-project release/next commit 9e5059fdf8831920eaf7e0e44fc60cb4f966ed5f and export it into a new ignored runtime directory.
- [x] Run the real build/preview tests and inspect Root/No-root captures.

## Task 2: Complete author workflow

- [x] Document editing, validation, previews, committed-source builds, license restrictions and the new identity in examples/itachi/README.md and examples/README.md.
- [x] Update README.md and docs/CANDIDATE.md to describe Sharingan and the new paired runtime. Include it in the static gallery with real generated Home/Inputs/Settings captures and provenance.
- [x] Run npm test with the paired runtime and browser; fix actual regressions without reducing boundary validation.
- [x] Commit the theme sources, verify a normal CLI build from the real checkout, and restart the local showcase with Sharingan visible.

Verification: 47/47 tests passed with the exact clean runtime and local Google Chrome 156.0.8078.74; no skips. Independent review identified missing standalone license notices, which were embedded into the packaged documents before final build verification. No TV acceptance or public release performed.
