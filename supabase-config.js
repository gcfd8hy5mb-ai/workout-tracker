// LIFTOVA Supabase public browser configuration.
// The publishable key is safe for client-side use. Never place a secret/service-role key here.
window.PRISM_SUPABASE_CONFIG = Object.freeze({
  url: "https://kirlpjflaoriiusfamsk.supabase.co",
  publishableKey: "sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90"
});

// LIFTOVA presentation modules. Keep the proven account/data system intact.
(() => {
  for (const src of [
    'liftova-onboarding.js?v=5',
    'liftova-home.js?v=5',
    'liftova-workouts.js?v=5',
    'liftova-active-workout.js?v=5',
    'liftova-library.js?v=5',
    'liftova-progress.js?v=5',
    'liftova-profile.js?v=5',
    'liftova-pro.js?v=5',
    'liftova-polish.js?v=5'
  ]) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }
})();
