const fs=require('fs');
const assert=require('assert');

const photoScope=fs.readFileSync('persistence/photo-scope.js','utf8');
const startup=fs.readFileSync('myliftcoach-startup-smooth.js','utf8');
const config=fs.readFileSync('supabase-config.js','utf8');
const startupCss=fs.readFileSync('myliftcoach-startup-smooth.css','utf8');

assert(photoScope.includes("document.documentElement.classList.add('myliftcoach-starting')"),'first-paint gate must be installed from the head loader');
assert(photoScope.includes("startupCss.href = 'myliftcoach-startup-smooth.css?v=2'"),'startup skin must begin loading during head parsing');
assert(photoScope.includes("canonicalHomeCss.href = 'liftova-home.css?v=12'"),'canonical Home CSS must be preloaded before Home JS renders');
assert(photoScope.includes("canonicalHomeCss.dataset.liftovaHome = 'true'"),'canonical Home preload must prevent duplicate Home CSS injection');

assert(startupCss.includes('body>*:not(#myliftcoachStartupCover):not(#liftovaAuthGate)'),'legacy app content must remain hidden behind the startup surface');
assert(startup.includes("if(root.classList.contains('prism-account-booting')) return false"),'startup must fail closed while account identity is unresolved');
assert(startup.includes('if(user?.id===manager.owner)'),'early unlock must require exact Supabase/account-scope identity match');
assert(startup.includes("home&&!home.classList.contains('hidden')")&&startup.includes("home.querySelector('.liftova-home-shell')"),'visible Home must require the canonical Home shell before reveal');
assert(!startup.includes("window.addEventListener('load',reveal"),'first usable paint must not wait for every secondary module/image to finish loading');
assert(!startup.includes('setTimeout(reveal,1600)'),'startup must not depend on the old fixed 1.6 second reveal delay');
assert(startup.includes('requestIdleCallback'),'owner-only shadow tooling must be deferred until after first usable paint');

const startupIndex=config.indexOf("myliftcoach-startup-smooth.js?v=2");
const anatomyIndex=config.indexOf("myliftcoach-anatomy-v2.js?v=1");
const homeIndex=config.indexOf("liftova-home.js?v=12");
const scheduleIndex=config.indexOf("myliftcoach-home-sequence-fix.js?v=4");
const onboardingIndex=config.indexOf("liftova-onboarding.js?v=7");
assert(startupIndex>=0&&anatomyIndex>startupIndex&&homeIndex>anatomyIndex&&scheduleIndex>homeIndex&&onboardingIndex>scheduleIndex,'canonical Home must load at the front of the sequential module chain');

console.log('pre-beta startup regression checks passed');
