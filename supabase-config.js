// LIFTOVA Supabase public browser configuration.
// The publishable key is safe for client-side use. Never place a secret/service-role key here.
window.PRISM_SUPABASE_CONFIG = Object.freeze({
  url: "https://kirlpjflaoriiusfamsk.supabase.co",
  publishableKey: "sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90"
});

// iOS should use the dedicated PNG touch icon rather than the SVG artwork.
// Keep this separate from account/auth state; it is presentation metadata only.
(() => {
  const touchIcon = document.querySelector('link[rel="apple-touch-icon"]') || document.createElement('link');
  touchIcon.rel = 'apple-touch-icon';
  touchIcon.sizes = '180x180';
  touchIcon.href = 'images/apple-touch-icon-180.png?v=6';
  if (!touchIcon.parentNode) document.head.appendChild(touchIcon);
})();

// LIFTOVA presentation modules. Keep the proven account/data system intact.
// Load these sequentially: dynamically inserted `defer` scripts can otherwise race.
// The approved photo-free Home renderer intentionally runs after the legacy reference
// layer so the old photo hero/card cannot replace the approved Home dashboard.
(() => {
  const sources = [
    'liftova-onboarding.js?v=7',
    'liftova-workouts.js?v=7',
    'liftova-active-workout.js?v=7',
    'liftova-library.js?v=7',
    'liftova-progress.js?v=7',
    'liftova-profile.js?v=7',
    'liftova-pro.js?v=7',
    'liftova-polish.js?v=7',
    'liftova-native-navigation.js?v=1',
    'liftova-native-forms.js?v=1',
    'liftova-native-states.js?v=1',
    'liftova-native-device.js?v=1',
    'liftova-native-interactions.js?v=1',
    'liftova-reference-v3.js?v=1',
    'liftova-workout-tab-v3.js?v=1',
    'liftova-quick-log.js?v=1',
    'liftova-home.js?v=10'
  ];
  const load = index => {
    if (index >= sources.length) return;
    const script = document.createElement('script');
    script.src = sources[index];
    script.async = false;
    script.onload = script.onerror = () => load(index + 1);
    document.head.appendChild(script);
  };
  load(0);
})();
