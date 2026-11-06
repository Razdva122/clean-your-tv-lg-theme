# Toolkit 0.2.0 release plan

Goal: publish a tested toolkit paired with application v1.9.0 / Home 1.10.0.
Scope: existing PR #7, existing wrappers and candidate workflow; no new TV behavior.

- [x] Merge release/next into PR #7; resolve runtime and historical documentation conflicts.
- [x] Pin clean application commit 94c81dc7c102b8e9476e22cdc4ad6ce3ab36cf92, update current guides and examples, preserve historical distributions and provenance.
- [x] Run npm ci --ignore-scripts; export clean runtime; run all paired tests with Chromium, without skips. Correct any proven integration regressions.
- [ ] Pass Linux/macOS/Windows checks and the paired candidate job. Merge #7 into release/next and a release PR into main under repository protections.
- [ ] Build/test the final main commit; download Actions bundle, verify hashes/provenance and validate a fresh extraction.
- [ ] Publish toolkit-v0.2.0 with the exact verified assets; download public assets again and verify hashes. Remove temporary working copies after saving work remotely.
