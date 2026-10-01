// MYLIFTCOACH Supabase public browser configuration.
// The publishable key is safe for client-side use. Never place a secret/service-role key here.
const MYLIFTCOACH_SUPABASE_CONFIG = Object.freeze({
  url: "https://kirlpjflaoriiusfamsk.supabase.co",
  publishableKey: "sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90"
});
window.MYLIFTCOACH_SUPABASE_CONFIG = MYLIFTCOACH_SUPABASE_CONFIG;
// Compatibility alias only. Remove after all persistence/auth modules use the canonical namespace.
window.PRISM_SUPABASE_CONFIG = MYLIFTCOACH_SUPABASE_CONFIG;

// Keep the iOS install icon aligned with the canonical MYLIFTCOACH source metadata.
(() => {
  const touchIcon=document.querySelector('link[rel="apple-touch-icon"]')||document.createElement('link');
  touchIcon.rel='apple-touch-icon';
  touchIcon.href='images/apple-touch-icon-180.png?v=10';
  if(!touchIcon.parentNode)document.head.appendChild(touchIcon);
})();

// Startup paint stabilization is loaded first so iOS/PWA never exposes a half-built Home frame.
(() => {
  if(!document.querySelector('link[data-myliftcoach-startup-smooth]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='myliftcoach-startup-smooth.css?v=1';
    link.setAttribute('data-myliftcoach-startup-smooth','true');
    document.head.appendChild(link);
  }
})();

// Transitional implementation modules still use historical filenames internally.
// They are loaded only for functionality; visible presentation is owned by MYLIFTCOACH.
(() => {
  const sources=['myliftcoach-startup-smooth.js?v=1','myliftcoach-anatomy-v2.js?v=1','liftova-onboarding.js?v=7','liftova-workouts.js?v=7','liftova-active-workout.js?v=7','liftova-library.js?v=7','liftova-progress.js?v=7','myliftcoach-swipe-ux.js?v=1','liftova-profile.js?v=7','liftova-pro.js?v=7','liftova-native-navigation.js?v=1','liftova-native-forms.js?v=1','liftova-native-states.js?v=1','liftova-native-device.js?v=1','liftova-native-interactions.js?v=1','liftova-workout-tab-v3.js?v=1','liftova-quick-log.js?v=1','liftova-functional-fixes.js?v=2','liftova-home.js?v=12','liftova-custom-home.js?v=1','liftova-polish.js?v=8','myliftcoach-profile-brand-lock.js?v=3','myliftcoach-visual-cleanup.js?v=1','myliftcoach-home-sequence-fix.js?v=3','myliftcoach-custom-workout-fix.js?v=1'];
  const load=index=>{
    if(index>=sources.length)return;
    const script=document.createElement('script');
    script.src=sources[index];
    script.async=false;
    script.onload=script.onerror=()=>load(index+1);
    document.head.appendChild(script);
  };
  load(0);
})();

// Core UX polish is intentionally presentation-only and loaded after the existing app layers.
(() => {
  const styles=[
    ['myliftcoach-core-ux-v1.css?v=1','myliftcoach-core-ux'],
    ['myliftcoach-core-ux-v2.css?v=1','myliftcoach-core-ux-v2'],
    ['myliftcoach-core-ux-v3.css?v=1','myliftcoach-core-ux-v3'],
    ['myliftcoach-core-ux-v4.css?v=1','myliftcoach-core-ux-v4'],
    ['myliftcoach-anatomy-polish.css?v=2','myliftcoach-anatomy-polish'],
    ['myliftcoach-home-dashboard-ux.css?v=1','myliftcoach-home-dashboard-ux']
  ];
  styles.forEach(([href,key])=>{
    if(document.querySelector(`link[data-${key}]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    link.setAttribute(`data-${key}`,'true');
    document.head.appendChild(link);
  });
})();
