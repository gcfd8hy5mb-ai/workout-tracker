const assert=require('node:assert/strict');
const model=require('../persistence/storage-model.js');
const reconcile=require('../persistence/reconcile.js');
(async()=>{
const A={mealPlanner:{week:'2026-10-12',days:[{date:'2026-10-12',items:[{name:'Chicken, rice & broccoli',kcal:650,servings:1}]}]},customRecurringSchedule:[{start:'2026-10-12',end:'2026-11-08',name:'A private workout',exercises:['squat']}],food:[{id:'food-a',name:'Only A',calories:650}]};
const B={mealPlanner:{week:'2026-10-19',days:[{date:'2026-10-19',items:[{name:'Tofu scramble & toast',kcal:480,servings:1}]}]},customRecurringSchedule:[],food:[{id:'food-b',name:'Only B',calories:480}]};
const a=await model.normalize({dailyTrackingV1:JSON.stringify(A)});
const b=await model.normalize({dailyTrackingV1:JSON.stringify(B)});
assert.deepEqual(JSON.parse(model.restoreSnapshot(a).dailyTrackingV1),A,'A planner and schedule survive normalized round-trip');
assert.deepEqual(JSON.parse(model.restoreSnapshot(b).dailyTrackingV1),B,'B planner and schedule survive normalized round-trip');
assert.notDeepEqual(model.restoreSnapshot(a),model.restoreSnapshot(b),'distinct account payloads must not merge');
assert.throws(()=>reconcile.assertOwner('account-A','account-B'),/Account changed/,'A local backup must not be uploaded using B session');
assert.throws(()=>reconcile.assertOwner('account-A',null),/Sign in required/);
assert.doesNotThrow(()=>reconcile.assertOwner('account-A','account-A'));
console.log('Meal plan cloud serialization, independent A/B restores, and owner guard checks PASS');
})().catch(e=>{console.error(e);process.exitCode=1});