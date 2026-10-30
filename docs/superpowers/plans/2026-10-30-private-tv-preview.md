# Private TV icon preview

**Goal:** Use actual app-owned icon bytes from a private read-only TV capture in the existing theme preview.
**Approach:** Optional --inventory for preview/showcase/screenshots; validate minimal JSON with embedded raster images, replace apps.js in both renderers, retain the immutable runtime and theme package boundaries. Bind only to loopback, protect inventory responses from cross-origin scripts, and label snapshot vs demo mode.

- [x] Discover the saved TV and verify read-only access; capture original icons without TV changes.
- [x] Add failing tests for malformed/remote icon data and original-byte preservation.
- [x] Implement the bounded private loader and same-origin renderer route.
- [x] Document the option and keep snapshots under ignored .runtime with private permissions.
- [x] Run the complete suite and verify the real local snapshot in the browser.
