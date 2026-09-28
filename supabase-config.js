// LIFTOVA Supabase public browser configuration.
// The publishable key is safe for client-side use. Never place a secret/service-role key here.
window.PRISM_SUPABASE_CONFIG = Object.freeze({
  url: "https://kirlpjflaoriiusfamsk.supabase.co",
  publishableKey: "sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90"
});

// LIFTOVA presentation modules. Keep the proven account/data system intact.
(() => {
  for (const src of [
    'liftova-onboarding.js?v=6',
    'liftova-home.js?v=6',
    'liftova-workouts.js?v=6',
    'liftova-active-workout.js?v=6',
    'liftova-library.js?v=6',
    'liftova-progress.js?v=6',
    'liftova-profile.js?v=6',
    'liftova-pro.js?v=6',
    'liftova-polish.js?v=6'
  ]) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }
})();
