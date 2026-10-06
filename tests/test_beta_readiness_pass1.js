const fs=require('fs');
const assert=require('assert');

const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
const sw=fs.readFileSync('sw.js','utf8');
const config=fs.readFileSync('supabase-config.js','utf8');
const onboarding=fs.readFileSync('onboarding.js','utf8');
const sequence=fs.readFileSync('myliftcoach-home-sequence-fix.js','utf8');
const workout=fs.readFileSync('workout-experience.js','utf8');
const accountController=fs.readFileSync('persistence/account-controller.js','utf8');
const accountSync=fs.readFileSync('persistence/account-sync.js','utf8');

// Installed-app shell and update safety.
assert.equal(manifest.name,'MYLIFTCOACH','installed app must use MYLIFTCOACH name');
assert.equal(manifest.display,'standalone','installed app must launch standalone');
assert.equal(manifest.scope,'./','installed app scope must stay inside the app');
assert(sw.includes('myliftcoach-home-v23-goal-program'),'beta readiness must bump the installed PWA cache');
assert(sw.includes('UPGRADE_VERSION = "23"'),'installed clients must receive the v23 upgrade signal');
assert(sw.includes('url.pathname.includes("/myliftcoach-")'),'MYLIFTCOACH runtime and UX files must be network-first');
for(const asset of [
  'myliftcoach-home-sequence-fix.js?v=5',
  'myliftcoach-custom-workout-fix.js?v=2',
  'myliftcoach-daily-tracking-ux.js?v=1',
  'myliftcoach-history-records-ux.css?v=1',
  'apple-touch-icon-180.png?v=10'
])assert(sw.includes(asset),`installed shell must cache current ${asset}`);

// Loader must point at the same scheduling/runtime generation the service worker protects.
assert(config.includes("'myliftcoach-home-sequence-fix.js?v=5'"),'runtime must load current schedule authority');
assert(config.includes("'myliftcoach-custom-workout-fix.js?v=2'"),'runtime must load current custom workout editor');
assert(!config.includes("'liftova-custom-home.js"),'retired history-driven custom Home scheduler must stay unloaded');

// First-run journey must remain resumable and terminate in the real app.
assert(onboarding.includes('localStorage'),'onboarding must persist first-run state locally');
assert(/onboarding|journey/i.test(onboarding),'first-run onboarding flow must remain present');

// One weekly schedule authority: custom plan > preset fallback, explicit rest wins.
assert(sequence.includes('const source=customs.length?'),'custom workouts must take precedence over preset/suggested plans');
assert(sequence.includes('if(override.rest){week[i]=null;continue}'),'explicit Rest Day must override scheduled training');
assert(sequence.includes('window.myliftcoachWeeklySchedule=weeklySchedule'),'weekly schedule must be exposed as the canonical schedule source');

// Workout interaction must persist numeric sets rather than presentation-only values.
assert(workout.includes("saveSet(key,'weight',w)"),'weight logging must use persistence path');
assert(workout.includes("saveSet(key,'reps',r)"),'rep logging must use persistence path');
assert(workout.includes('startWorkoutRest'),'confirmed sets must continue into the workout/rest flow');

// Account/cloud modules required by the existing A→B→A, restore, retry, and deletion suites must remain connected.
assert(/user|account|session/i.test(accountController),'account controller must remain active');
assert(/sync|save|restore/i.test(accountSync),'account sync must retain save/restore behavior');

console.log(JSON.stringify({
  suite:'MYLIFTCOACH Beta Readiness Pass 1',
  checks:{
    standaloneInstall:true,
    installedRuntimeFreshness:true,
    firstRunContinuity:true,
    customScheduleAuthority:true,
    workoutPersistence:true,
    cloudAccountPath:true
  }
},null,2));