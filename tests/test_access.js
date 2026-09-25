const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const accessCode=html.split('/* PRISM ACCESS:')[1].split('/* STORAGE —')[0];
const free=['basic_workout_tracking','exercise_library','rest_timer','basic_history','basic_progress','water_tracking','weight_tracking','basic_goals','body_goal_setup','calorie_estimate','local_profile','custom_workouts','manual_substitutions','basic_progress_trends'];
const pro=['smart_progression','smart_substitutions','advanced_analytics','full_time_trends','muscle_volume_analytics','advanced_pr_insights','plateau_detection','weekly_prism_summary','phase_analysis','photo_comparison','advanced_measurement_trends','cloud_sync','data_export','premium_themes','unlimited_custom_workouts'];
const saved=new Map([
['workoutHistoryV52','[{"name":"Previous workout"}]'],
['customWorkoutsV5',JSON.stringify(Array.from({length:5},(_,i)=>({name:`Saved ${i+1}`})))],
['prismGoalPhasesV1','[{"type":"bulk"}]'],
['dailyTrackingV1','{"weight":[{"value":180}],"measurements":[{"value":34}]}'],
['prismActiveWorkoutV1','{"key":"preset-day1"}']
]);
const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)};
function load(){const context=vm.createContext({localStorage:storage,document:{getElementById:()=>null,addEventListener:()=>{}}});vm.runInContext('/* PRISM ACCESS:'+accessCode,context);return context}
function check(ctx,expr){return vm.runInContext(expr,ctx)}
const original=new Map(saved);
let app=load();
assert.equal(check(app,'effectivePrismTier()'),'free');
for(const key of free)assert.equal(check(app,`canAccessFeature(${JSON.stringify(key)})`),true,`${key} should be Free`);
for(const key of pro)assert.equal(check(app,`canAccessFeature(${JSON.stringify(key)})`),false,`${key} should be Pro`);
assert.equal(check(app,'canAccessFeature("unregistered")'),false);
assert.equal(check(app,'canAccessFeature("workout_tracking")'),true,'legacy lookup follows the central map');
assert.equal(check(app,'canAccessFeature("photo_comparisons")'),false);
assert.equal(check(app,'customWorkoutLimit()'),3);
assert.equal(JSON.parse(saved.get('customWorkoutsV5')).length,5,'existing workouts over Free limit remain saved');
check(app,'setBetaPreview("pro")');
assert.equal(check(app,'prismEntitlement.tier'),'beta');
for(const key of [...free,...pro])assert.equal(check(app,`canAccessFeature(${JSON.stringify(key)})`),true,`${key} should unlock in Pro`);
assert.equal(check(app,'customWorkoutLimit()'),Infinity);
app=load();assert.equal(check(app,'effectivePrismTier()'),'pro');
check(app,'setBetaPreview("free")');
assert.equal(check(app,'customWorkoutLimit()'),3);
for(const key of pro)assert.equal(check(app,`canAccessFeature(${JSON.stringify(key)})`),false);
app=load();assert.equal(check(app,'effectivePrismTier()'),'free');
check(app,'setBetaPreview("pro")');check(app,'PRISM_ACCESS.betaControlsEnabled=false');
assert.equal(check(app,'effectivePrismTier()'),'free','beta preview stops granting access when controls are disabled');
check(app,'PRISM_ACCESS.betaControlsEnabled=true');
assert.equal(check(app,'applyVerifiedPrismTier("pro","storekit")'),true);
app=load();assert.equal(check(app,'effectivePrismTier()'),'pro');
assert.equal(check(app,'applyVerifiedPrismTier("lifetime_pro","manual_grant")'),true);
check(app,'setBetaPreview("free")');assert.equal(check(app,'effectivePrismTier()'),'lifetime_pro');
app=load();assert.equal(check(app,'applyVerifiedPrismTier("pro","storekit")'),false);
for(const key of pro)assert.equal(check(app,`canAccessFeature(${JSON.stringify(key)})`),true);
for(const [key,value] of original)assert.equal(saved.get(key),value,`${key} changed when switching access`);
const saveCode=html.slice(html.indexOf('function saveCustomWorkout(){'),html.indexOf('function deleteCustomWorkout(',html.indexOf('function saveCustomWorkout(){')));
const originalWorkouts=JSON.parse(saved.get('customWorkoutsV5'));
const builder=vm.createContext({customWorkouts:originalWorkouts,customWorkoutLimit:()=>3,
showProPreview:()=>{builder.locked++},locked:0,builderSelected:['chest-press'],
document:{getElementById:()=>({value:'Another workout'})},localStorage:storage,goHome:()=>{},Date,alert:()=>{}});
vm.runInContext(saveCode,builder);
builder.saveCustomWorkout();assert.equal(builder.locked,1,'Free cannot create a fourth workout');
assert.equal(saved.get('customWorkoutsV5'),original.get('customWorkoutsV5'),'blocked creation keeps all existing workouts');
builder.customWorkoutLimit=()=>Infinity;builder.saveCustomWorkout();
assert.equal(JSON.parse(saved.get('customWorkoutsV5')).length,6,'Pro can add beyond the Free limit');
console.log('Free, Pro, Lifetime Pro, beta switching, limits, and saved data: OK');
