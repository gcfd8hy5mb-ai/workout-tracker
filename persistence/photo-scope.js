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
  /* This file is parsed in <head>, before the legacy Home markup can paint. Keep
     the app behind an intentional startup surface until auth scope and the
     canonical Home/auth gate are ready. */
  document.documentElement.classList.add('myliftcoach-starting');

  const startupCss = document.createElement('link');
  startupCss.rel = 'stylesheet';
  startupCss.href = 'myliftcoach-startup-smooth.css?v=2';
  startupCss.dataset.myliftcoachStartupSmooth = 'true';
  document.head.appendChild(startupCss);

  /* Start fetching the canonical Home skin during head parsing rather than
     waiting for liftova-home.js to render after the secondary module chain. */
  const canonicalHomeCss = document.createElement('link');
  canonicalHomeCss.rel = 'stylesheet';
  canonicalHomeCss.href = 'liftova-home.css?v=12';
  canonicalHomeCss.dataset.liftovaHome = 'true';
  document.head.appendChild(canonicalHomeCss);

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'app-feel.css?v=1';
  document.head.appendChild(css);
  const entryCss = document.createElement('link');
  entryCss.rel = 'stylesheet';
  entryCss.href = 'myliftcoach-entry-flow.css?v=1';
  document.head.appendChild(entryCss);
  const onboardingCss = document.createElement('link');
  onboardingCss.rel = 'stylesheet';
  onboardingCss.href = 'myliftcoach-onboarding-polish.css?v=1';
  document.head.appendChild(onboardingCss);
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
  const activeWorkoutCss = document.createElement('link');
  activeWorkoutCss.rel = 'stylesheet';
  activeWorkoutCss.href = 'myliftcoach-active-workout-prebeta.css?v=1';
  document.head.appendChild(activeWorkoutCss);
  const onboardingScript = document.createElement('script');
  onboardingScript.src = 'myliftcoach-onboarding-polish.js?v=1';
  onboardingScript.defer = true;
  document.head.appendChild(onboardingScript);
  const homeWorkoutScript = document.createElement('script');
  homeWorkoutScript.src = 'myliftcoach-home-workout-actions.js?v=1';
  homeWorkoutScript.defer = true;
  document.head.appendChild(homeWorkoutScript);
  const destinationFixScript = document.createElement('script');
  destinationFixScript.src = 'myliftcoach-settings-destination-fixes.js?v=1';
  destinationFixScript.defer = true;
  document.head.appendChild(destinationFixScript);
  const brandSafetyScript = document.createElement('script');
  brandSafetyScript.src = 'myliftcoach-brand-safety.js?v=1';
  brandSafetyScript.defer = true;
  document.head.appendChild(brandSafetyScript);
  const script = document.createElement('script');
  script.src = 'app-feel.js?v=1';
  script.defer = true;
  document.head.appendChild(script);
}
