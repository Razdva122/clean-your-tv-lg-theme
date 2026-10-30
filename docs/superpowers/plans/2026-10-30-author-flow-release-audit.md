# Theme author flow and real release audit

> **For agentic workers:** Use executing-plans to verify this flow step by step; documentation review is delegated independently.

**Goal:** Follow a new author through preview, build, publication and installation-ID lookup, fix concrete blockers, and publish a real Itachi 1.0.2 theme prerelease.

**Architecture:** Keep the trusted toolkit/runtime separate from an author repository. Source commit A builds immutable distribution files; commit B publishes those files and the release workflow. Public release metadata binds the descriptor digest and installation ID. Home application releases and TV appearance changes are outside this publication audit.

**Tech Stack:** Node.js 22+, Python standard library, Git/GitHub CLI, Actions, Playwright and the pinned main-project renderer.

## Constraints

- Work in toolkit release/next; preserve existing immutable distributions and other tasks' files.
- Publish only reviewed source and sanitized reference fixtures; no private inventory, addresses, credentials or raw diagnostics.
- Keep runtime source fixed, clean and publicly fetchable before CI exports it.
- Mark the theme release as a prerelease requiring the unpublished Home 1.6 candidate; browser checks do not establish physical TV acceptance.
- No automatic theme installation, appearance changes or Home application release.

## Steps

- [ ] Exercise init/help/preview/edit/invalid CSS/restore/Inputs/Settings in a fresh author repository.
- [ ] Correct command discovery and documentation blockers; run relevant checks.
- [ ] Make the reviewed runtime source and toolkit commit publicly fetchable; verify candidate CI.
- [ ] Generate the release workflow and build tracked distributions/itachi/1.0.2 from committed sources.
- [ ] Commit/push publication B, publish v1.0.2 theme prerelease and observe its real workflow.
- [ ] Verify public descriptor/files/digests, tv-links.json, release note ID and editor TV link with local edits excluded.
- [ ] Record actual results, correct remaining instructions and remove temporary author repositories.
