const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const accessCode = html.split('/* PRISM ACCESS:')[1].split('/* STORAGE —')[0];
const saved = new Map([
  ['workoutHistoryV52', '[{"name":"Previous workout"}]'],
  ['customWorkoutsV5', '[{"name":"Existing workout"}]'],
  ['dailyTrackingV1', '{"weight":[{"value":180}]}'],
  ['prismActiveWorkoutV1', '{"key":"preset-day1"}']
]);
const storage = {getItem:key=>saved.get(key)||null, setItem:(key,value)=>saved.set(key,value)};
function load(){
  const context = vm.createContext({localStorage:storage, document:{getElementById:()=>null,addEventListener:()=>{}}});
  vm.runInContext('/* PRISM ACCESS:'+accessCode, context);
  return context;
}
function check(context, expr){return vm.runInContext(expr,context)}
const original=new Map(saved);
let app=load();
assert.equal(check(app,'effectivePrismTier()'),'free');
assert.equal(check(app,'canAccessFeature("workout_tracking")'),true);
assert.equal(check(app,'canAccessFeature("basic_history")'),true);
assert.equal(check(app,'canAccessFeature("local_backup")'),true);
assert.equal(check(app,'canAccessFeature("smart_progression")'),false);
assert.equal(check(app,'customWorkoutLimit()'),3);
check(app,'setBetaPreview("pro")');
assert.equal(check(app,'prismEntitlement.tier'),'beta');
assert.equal(check(app,'canAccessFeature("smart_progression")'),true);
assert.equal(check(app,'customWorkoutLimit()'),Infinity);
app=load();assert.equal(check(app,'effectivePrismTier()'),'pro'); // refresh
check(app,'PRISM_ACCESS.betaControlsEnabled=false');
assert.equal(check(app,'effectivePrismTier()'),'free'); // beta UI disabled before launch
check(app,'PRISM_ACCESS.betaControlsEnabled=true');
check(app,'setBetaPreview("free")');
assert.equal(check(app,'canAccessFeature("smart_progression")'),false);
app=load();assert.equal(check(app,'effectivePrismTier()'),'free');
assert.equal(check(app,'applyVerifiedPrismTier("pro","storekit")'),true);
assert.equal(check(app,'canAccessFeature("advanced_analytics")'),true);
app=load();assert.equal(check(app,'effectivePrismTier()'),'pro');
assert.equal(check(app,'applyVerifiedPrismTier("lifetime_pro","manual_grant")'),true);
assert.equal(check(app,'canAccessFeature("photo_comparisons")'),true);
check(app,'setBetaPreview("free")'); // beta toggle never downgrades lifetime
assert.equal(check(app,'effectivePrismTier()'),'lifetime_pro');
app=load();assert.equal(check(app,'effectivePrismTier()'),'lifetime_pro');
assert.equal(check(app,'applyVerifiedPrismTier("pro","storekit")'),false);
assert.equal(check(app,'effectivePrismTier()'),'lifetime_pro');
for(const [key,value] of original)assert.equal(saved.get(key),value,`${key} changed`);
console.log('Entitlement tiers, reload persistence, and saved workout data: OK');
