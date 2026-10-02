/* Separate guest and account photo databases without altering existing guest photos. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.PRISMPhotoScope = api;
})(globalThis, function () {
  'use strict';
  const LEGACY = new Set(['workoutTrackerPhotosV1', 'prismProgressPhotosDB']);
  function databaseName(legacyName, userId) {
    if (!LEGACY.has(legacyName)) throw Error('Unknown photo database');
    if (userId === null) return legacyName;
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId))
      throw Error('Verified account ID required for photos');
    return 'prismAccountPhotosV1:' + userId + ':' + legacyName;
  }
  return Object.freeze({ databaseName });
});

/* Presentation-only shell loader. Browser guarded so photo-scope Node/regression tests are unchanged. */
if (typeof document !== 'undefined') {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'app-feel.css?v=1';
  document.head.appendChild(css);
  const entryCss = document.createElement('link');
  entryCss.rel = 'stylesheet';
  entryCss.href = 'myliftcoach-entry-flow.css?v=1';
  document.head.appendChild(entryCss);
  const homeCss = document.createElement('link');
  homeCss.rel = 'stylesheet';
  homeCss.href = 'myliftcoach-home-refine-v2.css?v=1';
  document.head.appendChild(homeCss);
  const finalCss = document.createElement('link');
  finalCss.rel = 'stylesheet';
  finalCss.href = 'myliftcoach-remaining-screens-final.css?v=1';
  document.head.appendChild(finalCss);
  const menuCss = document.createElement('link');
  menuCss.rel = 'stylesheet';
  menuCss.href = 'myliftcoach-menu-destinations.css?v=1';
  document.head.appendChild(menuCss);
  const script = document.createElement('script');
  script.src = 'app-feel.js?v=1';
  script.defer = true;
  document.head.appendChild(script);
}
