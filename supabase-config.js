// LIFTOVA Supabase public browser configuration.
// The publishable key is safe for client-side use. Never place a secret/service-role key here.
window.PRISM_SUPABASE_CONFIG = Object.freeze({
  url: "https://kirlpjflaoriiusfamsk.supabase.co",
  publishableKey: "sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90"
});

// Redesign branch loader. Keeps the proven account/data system intact while the UI is rebuilt.
(() => {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'liftova-home.css';
  document.head.appendChild(css);

  for (const src of ['liftova-onboarding.js','liftova-home.js']) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }
})();
