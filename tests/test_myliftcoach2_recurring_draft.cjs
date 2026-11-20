const test=require('node:test'),assert=require('node:assert/strict');
const storeAPI=require('../myliftcoach2/recurring-draft.js'),legacy=require('../myliftcoach2/original-custom-schedule.js'),migrate=require('../myliftcoach2/v2-recurring-schedule.js'),week=require('../myliftcoach2/weekly-schedule.js');
const ids=['press','row','squat'],owner='11111111-1111-4111-8111-111111111111';
const orig=legacy.normalize([{name:'Legs',exercises:['squat']}],{customSchedule:{'2026-11-20':{name:'Legs',exercises:['squat']}},customRecurringSchedule:[{name:'Legs',exercises:['squat'],start:'2026-11-13',end:'2027-01-29'}]},ids);
const defaults={plans:[{id:'upper-a',title:'Upper',ids:['press']}],assigned:['upper-a',null,null,null,null,null,null]};
function doc(){return migrate.migrate({original:orig,weekly:defaults,validExerciseIds:ids}).document}
function storage(){const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),map}}
test('complete recurrence and dated overrides survive account-scoped reload',()=>{
 const db=storage(),draft=doc();
 storeAPI.commit(db,'v2-recurring',owner,draft,ids);
 const restored=storeAPI.read(db,'v2-recurring',owner,ids);
 assert.equal(migrate.resolve(restored,'2026-11-20').source,'one-time');
 assert.equal(migrate.resolve(restored,'2026-12-04').source,'recurring');
 assert.equal(migrate.resolve(restored,'2027-02-05').plan,null);
 assert.equal(storeAPI.read(db,'v2-recurring',null,ids),null);
 assert.equal(storeAPI.read(db,'v2-recurring','22222222-2222-4222-8222-222222222222',ids),null);
});
test('renamed workout and exercise edit changes future recurring sessions after reopening',()=>{
 const db=storage(),initial=doc(),id=initial.recurring[0].workoutId;
 const changed=storeAPI.edited(initial,{plans:initial.plans.map(p=>p.id===id?{...p,title:'Revised Leg Day',ids:['squat','row']}:p),assigned:initial.assigned},ids);
 storeAPI.commit(db,'recurring',owner,changed,ids);
 const restored=storeAPI.read(db,'recurring',owner,ids);
 assert.deepEqual(migrate.resolve(restored,'2026-12-04').plan.ids,['squat','row']);
 assert.equal(migrate.resolve(restored,'2026-12-04').plan.title,'Revised Leg Day');
 assert.equal(initial.plans.find(p=>p.id===id).title,'Legs');
});
test('invalid stored exercise stops restoration and preserves bytes',()=>{
 const db=storage(),bad=doc();bad.plans[1].ids=['removed-exercise'];
 const raw=JSON.stringify(bad);db.setItem(week.ownerKey('recurring',owner),raw);
 assert.throws(()=>storeAPI.read(db,'recurring',owner,ids),/unavailable/);
 assert.equal(db.getItem(week.ownerKey('recurring',owner)),raw);
});
test('storage failure cannot claim successful in-memory schedule change',()=>{
 const db={getItem:()=>null,setItem:()=>{throw Error('Quota exceeded')}};
 assert.throws(()=>storeAPI.commit(db,'recurring',owner,doc(),ids),/Quota exceeded/);
});
test('invalid schedule cannot be saved and override remains intact when editing weekly fallback',()=>{
 const initial=doc();
 const changed=storeAPI.edited(initial,{plans:initial.plans,assigned:[null,'upper-a',null,null,null,null,null]},ids);
 assert.deepEqual(changed.overrides,initial.overrides);
 assert.deepEqual(changed.recurring,initial.recurring);
 assert.equal(migrate.resolve(changed,'2026-11-20').source,'one-time');
 assert.equal(migrate.resolve(changed,'2026-11-17').plan.title,'Upper');
});

test('explicit edited date overrides imported recurrence without deleting future rules',()=>{
 const original=doc(),id=original.recurring[0].workoutId;
 const custom={id:'custom-fresh-workout',title:'My Personal Friday',ids:['row']};
 const candidate={plans:[...original.plans,custom],assigned:original.assigned.map((v,i)=>i===4?custom.id:v)};
 const edited=storeAPI.edited(original,candidate,ids);
 const withOverride={...edited,overrides:{...edited.overrides,'2026-11-27':custom.id}};
 const db=storage();
 storeAPI.commit(db,'recurring',owner,withOverride,ids);
 const restored=storeAPI.read(db,'recurring',owner,ids);
 assert.equal(migrate.resolve(restored,'2026-11-27').plan.title,'My Personal Friday');
 assert.equal(migrate.resolve(restored,'2026-12-04').plan.id,id);
 assert.equal(migrate.resolve(restored,'2026-11-20').source,'one-time');
 assert.deepEqual(restored.recurring,original.recurring);
});

test('one-date rest exception overrides repeating workout, preserves future Fridays after reload',()=>{
 const initial=doc(),db=storage(),restDate='2026-11-27';
 const edited={...initial,overrides:{...initial.overrides,[restDate]:null}};
 storeAPI.commit(db,'recurring',owner,edited,ids);
 const restored=storeAPI.read(db,'recurring',owner,ids);
 assert.equal(migrate.resolve(restored,restDate).plan,null);
 assert.equal(migrate.resolve(restored,restDate).source,'one-time');
 assert.equal(migrate.resolve(restored,'2026-12-04').plan.id,initial.recurring[0].workoutId);
 assert.equal(migrate.resolve(restored,'2026-11-20').plan.id,initial.recurring[0].workoutId);
 assert.deepEqual(restored.recurring,initial.recurring);
 assert.deepEqual(initial.overrides[restDate],undefined);
});
test('rest override validation permits null only, not unsupported workout identifiers',()=>{
 const base=doc();
 assert.equal(migrate.validate({...base,overrides:{...base.overrides,'2026-11-27':null}}),true);
 assert.throws(()=>migrate.validate({...base,overrides:{...base.overrides,'2026-11-27':'unknown-plan'}}),/Unmatched dated workout/);
});

test('restore only the selected dated exception, preserving other overrides and recurrence',()=>{
 const original=doc(),date='2026-11-27',db=storage();
 const changed={...original,overrides:{...original.overrides,[date]:null}};
 const restored=storeAPI.restoreDate(changed,date,ids);
 assert.equal(Object.hasOwn(restored.overrides,date),false);
 assert.deepEqual(restored.overrides,original.overrides);
 assert.deepEqual(restored.recurring,original.recurring);
 assert.equal(migrate.resolve(restored,date).source,'recurring');
 assert.equal(migrate.resolve(restored,date).plan.id,original.recurring[0].workoutId);
 storeAPI.commit(db,'recurring',owner,restored,ids);
 assert.equal(migrate.resolve(storeAPI.read(db,'recurring',owner,ids),date).source,'recurring');
 assert.equal(migrate.resolve(changed,date).plan,null);
 assert.throws(()=>storeAPI.restoreDate(restored,date,ids),/exception not found/);
});

test('stale recurring editor cannot overwrite a newer saved workout from another tab',()=>{
 const db=storage(),initial=doc();
 storeAPI.commit(db,'recurring',owner,initial,ids,null);
 const tabA=storeAPI.read(db,'recurring',owner,ids);
 const tabB=storeAPI.read(db,'recurring',owner,ids);
 const id=initial.recurring[0].workoutId;
 const changedA=storeAPI.edited(tabA,{plans:tabA.plans.map(p=>p.id===id?{...p,title:'Tab A Legs'}:p),assigned:tabA.assigned},ids);
 storeAPI.commit(db,'recurring',owner,changedA,ids,tabA);
 const persisted=db.getItem(week.ownerKey('recurring',owner));
 const changedB=storeAPI.edited(tabB,{plans:tabB.plans.map(p=>p.id===id?{...p,title:'Tab B Legs'}:p),assigned:tabB.assigned},ids);
 assert.throws(()=>storeAPI.commit(db,'recurring',owner,changedB,ids,tabB),/changed in another tab/);
 assert.equal(db.getItem(week.ownerKey('recurring',owner)),persisted);
 assert.equal(storeAPI.read(db,'recurring',owner,ids).plans.find(p=>p.id===id).title,'Tab A Legs');
});
test('recurring schedule activation refuses replacing an existing or unreadable document',()=>{
 const db=storage(),initial=doc(),key=week.ownerKey('recurring',owner);
 storeAPI.commit(db,'recurring',owner,initial,ids,null);
 const first=db.getItem(key);
 assert.throws(()=>storeAPI.commit(db,'recurring',owner,initial,ids,null),/changed in another tab/);
 assert.equal(db.getItem(key),first);
 db.setItem(key,'{corrupt');
 assert.throws(()=>storeAPI.commit(db,'recurring',owner,initial,ids,null),/unreadable/);
 assert.equal(db.getItem(key),'{corrupt');
});
