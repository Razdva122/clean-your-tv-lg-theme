'use strict';

// Trusted browser adapter only: author input remains manifest/rules/static bytes.
module.exports = function themePreviewClient() {
  var revision = -1,
    inFlight = false, appliedThemeId = null;
  function report(error) {
    parent.postMessage({
      themePreview: true,
      error: error || null,
      themeId: appliedThemeId
    }, location.origin);
  }
  function apply(input) {
    var handles = Object.create(null);
    try {
      input.assets.forEach(function (asset) {
        var raw = atob(asset.base64),
          bytes = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        handles[asset.id] = URL.createObjectURL(new Blob([bytes], {
          type: asset.mediaType
        }));
      });
      // The actual trusted runtime validates/serializes and owns accepted handles.
      ThemeRuntime.apply({
        manifest: input.manifest,
        rules: input.rules,
        assetHandles: handles
      });
    } catch (error) {
      // Rejected candidates were never transferred to runtime ownership.
      Object.keys(handles).forEach(function (id) {
        URL.revokeObjectURL(handles[id]);
      });
      throw error;
    }
  }
  function poll() {
    if (inFlight) return;
    inFlight = true;
    fetch('/theme-state?revision=' + revision).then(function (response) {
      return response.json();
    }).then(function (state) {
      var error = state.error;
      if (state.revision !== revision && window.ThemeRuntime && window.HomeLayoutState) {
        try {
          if (state.classic) {
            ThemeRuntime.reset();
            appliedThemeId = 'builtin:classic';
          } else {
            apply(state.input);
            appliedThemeId = state.input.manifest.id;
          }
          revision = state.revision;
        } catch (failure) {
          error = failure.message;
        }
      }
      report(error);
    }).catch(function (error) {
      report(error.message);
    }).then(function () {
      inFlight = false;
    });
  }
  addEventListener('pagehide', function () {
    if (window.ThemeRuntime) ThemeRuntime.reset();
    revision = -1;
  });
  poll();
  setInterval(poll, 500);
};
