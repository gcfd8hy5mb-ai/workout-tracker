// LIFTOVA Supabase public browser configuration.
// The publishable key is safe for client-side use. Never place a secret/service-role key here.
window.PRISM_SUPABASE_CONFIG = Object.freeze({
  url: "https://kirlpjflaoriiusfamsk.supabase.co",
  publishableKey: "sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90"
});
(() => {const touchIcon=document.querySelector('link[rel="apple-touch-icon"]')||document.createElement('link');touchIcon.rel='apple-touch-icon';touchIcon.sizes='180x180';touchIcon.href='images/apple-touch-icon-180.png?v=7';if(!touchIcon.parentNode)document.head.appendChild(touchIcon);})();
// Presentation modules load sequentially. The reference layer has a legacy 350ms Home repaint,
// so canonical Home is deliberately mounted after that repaint and remains the final Home renderer.
(() => {
  const sources=['liftova-onboarding.js?v=7','liftova-workouts.js?v=7','liftova-active-workout.js?v=7','liftova-library.js?v=7','liftova-progress.js?v=7','liftova-profile.js?v=7','liftova-pro.js?v=7','liftova-polish.js?v=7','liftova-native-navigation.js?v=1','liftova-native-forms.js?v=1','liftova-native-states.js?v=1','liftova-native-device.js?v=1','liftova-native-interactions.js?v=1','liftova-reference-v3.js?v=1','liftova-workout-tab-v3.js?v=1','liftova-quick-log.js?v=1','liftova-home.js?v=12'];
  const load=index=>{
    if(index>=sources.length)return;
    const mount=()=>{const script=document.createElement('script');script.src=sources[index];script.async=false;script.onload=script.onerror=()=>load(index+1);document.head.appendChild(script)};
    if(sources[index].startsWith('liftova-home.js'))setTimeout(mount,500);else mount();
  };
  load(0);
})();
