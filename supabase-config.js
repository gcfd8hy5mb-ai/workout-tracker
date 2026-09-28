// LIFTOVA Supabase public browser configuration.
// The publishable key is safe for client-side use. Never place a secret/service-role key here.
window.PRISM_SUPABASE_CONFIG = Object.freeze({
  url: "https://kirlpjflaoriiusfamsk.supabase.co",
  publishableKey: "sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90"
});

// LIFTOVA presentation modules. Keep the proven account/data system intact.
(() => {
  for (const src of [
    'liftova-onboarding.js?v=7',
    'liftova-home.js?v=7',
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
    'liftova-quick-log.js?v=1'
  ]) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }
})();
