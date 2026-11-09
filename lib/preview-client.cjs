'use strict';

// Trusted browser adapter only: author input remains manifest/rules/static bytes.
module.exports = function themePreviewClient() {
  // Keep all weather in the loopback preview, including manual/Auto settings flows.
  var originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    var kind = /^https:\/\/get\.geojs\.io\/v1\/ip\/geo\.json(?:\?|$)/.test(url) ? 'auto'
      : /^https:\/\/geocoding-api\.open-meteo\.com\/v1\/search(?:\?|$)/.test(url) ? 'search'
      : /^https:\/\/geocoding-api\.open-meteo\.com\/v1\/get(?:\?|$)/.test(url) ? 'get'
      : /^https:\/\/api\.open-meteo\.com\/v1\/forecast(?:\?|$)/.test(url) ? 'forecast' : null;
    var args = Array.prototype.slice.call(arguments);
    if(kind)args[1]='/theme-weather-fixture?kind='+kind;
    return originalOpen.apply(this,args);
  };
  try { localStorage.removeItem('tvhome.weather.v1'); } catch (_) {}
  addEventListener('message', function(event) {
    if(event.origin!==location.origin || event.source!==parent || !event.data || event.data.themeWeather!==true || !window.HomeWeather)return;
    var message=event.data, formats=['off','text','current','details','forecast'];
    if(formats.indexOf(message.format)<0 || ['metric','imperial'].indexOf(message.units)<0)return;
    var store=HomeWeather.store;
    store.setPreferences({enabled:message.format!=='off',units:message.units,preferred:message.format==='off'?'text':message.format});
    if(message.format!=='off' && !store.state().location)store.search('Berlin').then(function(){store.select(2950159);});
  });
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
    var handles = Object.create(null), videos = Object.create(null);
    try {
      input.assets.forEach(function (asset) {
        var raw = atob(asset.base64),
          bytes = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        handles[asset.id] = URL.createObjectURL(new Blob([bytes], {
          type: asset.mediaType
        }));
      });
      (input.videos || []).forEach(function (video) {
        var raw=atob(video.base64), bytes=new Uint8Array(raw.length);
        for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
        videos[video.quality]=URL.createObjectURL(new Blob([bytes],{type:video.mediaType}));
      });
      // The actual trusted runtime validates/serializes and owns accepted handles.
      ThemeRuntime.apply({
        manifest: input.manifest,
        rules: input.rules,
        assetHandles: handles,
        videoHandles: videos
      });
    } catch (error) {
      // Rejected candidates were never transferred to runtime ownership.
      Object.keys(videos).forEach(function (quality) { URL.revokeObjectURL(videos[quality]); });
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
