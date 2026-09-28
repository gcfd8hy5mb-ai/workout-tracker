// LIFTOVA Supabase public browser configuration.
// The publishable key is safe for client-side use. Never place a secret/service-role key here.
window.PRISM_SUPABASE_CONFIG = Object.freeze({
  url: "https://kirlpjflaoriiusfamsk.supabase.co",
  publishableKey: "sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90"
});

// LIFTOVA presentation modules. Keep the proven account/data system intact.
// The separate liftova-home overlay is intentionally not loaded because the app's
// native Home dashboard is now the canonical LIFTOVA Home screen.
(() => {
  for (const src of [
    'liftova-onboarding.js?v=4',
    'liftova-workouts.js?v=4',
    'liftova-active-workout.js?v=4',
    'liftova-library.js?v=4',
    'liftova-progress.js?v=4',
    'liftova-profile.js?v=4',
    'liftova-pro.js?v=4',
    'liftova-polish.js?v=4'
  ]) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }
})();
