// LIFTOVA Supabase public browser configuration.
// The publishable key is safe for client-side use. Never place a secret/service-role key here.
window.PRISM_SUPABASE_CONFIG = Object.freeze({
  url: "https://kirlpjflaoriiusfamsk.supabase.co",
  publishableKey: "sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90"
});

// Redesign branch loaders. Keep the proven account/data system intact while the UI is rebuilt.
(() => {
  for (const src of ['liftova-onboarding.js','liftova-home.js','liftova-workouts.js','liftova-active-workout.js','liftova-library.js','liftova-progress.js','liftova-profile.js','liftova-pro.js','liftova-polish.js']) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }
})();
