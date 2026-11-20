const test=require('node:test'),assert=require('node:assert/strict');
const {preview}=require('../myliftcoach2/today-coach.js');
const catalog=[{id:'leg-press',name:'Leg Press'},{id:'seated-row',name:'Seated Row'}];
const local=[
 {created:'2026-11-15T15:00:00Z',sets:[{exerciseId:'leg-press',weight:160,reps:10},{exerciseId:'leg-press',weight:160,reps:10}]},
 {created:'2026-11-12T15:00:00Z',sets:[{exerciseId:'leg-press',weight:155,reps:9},{exerciseId:'leg-press',weight:155,reps:10}]}];
const legacy=[
 {date:'2026-11-14T15:00:00Z',exercises:[{id:'seated-row',sets:[{weight:100,reps:10},{weight:100,reps:10}]}]},
 {date:'2026-11-11T15:00:00Z',exercises:[{id:'seated-row',sets:[{weight:95,reps:8},{weight:95,reps:9}]}]}];
test('Coach preview follows selected custom workout IDs and exact order',()=>{
 const plan={id:'custom',title:'My custom day',ids:['seated-row','leg-press']};
 const before=JSON.stringify({plan,local,catalog});
 const result=preview({plan,catalog,localSessions:local});
 assert.deepEqual(result.items.map(x=>x.id),plan.ids);
 assert.equal(result.items[0].status,'insufficient');
 assert.equal(result.items[1].weight,165);
 assert.equal(result.ready,1);
 assert.equal(JSON.stringify({plan,local,catalog}),before);
});
test('Verified legacy history can provide evidence without replacing local progression',()=>{
 const result=preview({plan:{title:'Today',ids:['leg-press','seated-row']},catalog,localSessions:local,legacySessions:legacy,legacyVerified:true});
 assert.equal(result.ready,2);
 assert.equal(result.items[0].source,'2.0 history');
 assert.equal(result.items[1].source,'Verified original history');
});
test('Unverified history never surfaces suggested weights',()=>{
 const result=preview({plan:{ids:['seated-row']},catalog,legacySessions:legacy,legacyVerified:false});
 assert.equal(result.ready,0);
 assert.equal(result.items[0].weight,null);
});
test('Rest day and missing catalog ID never fall back to arbitrary presets',()=>{
 assert.equal(preview({catalog}).status,'rest');
 const result=preview({plan:{ids:['missing','leg-press']},catalog});
 assert.equal(result.items[0].status,'unavailable');
 assert.equal(result.items[1].status,'insufficient');
});

test('personal target appears alongside but never replaces the calculated Coach suggestion',()=>{
 const p=preview({plan:{ids:['leg-press']},catalog,localSessions:local,personalTargets:{'leg-press':175}});
 assert.equal(p.items[0].personalTarget,175);
 assert.equal(p.items[0].weight,165);
 assert.equal(p.items[0].source,'2.0 history');
});
test('malformed or absent manual targets do not become automatic prescriptions',()=>{
 const p=preview({plan:{ids:['seated-row','leg-press']},catalog,
  personalTargets:{'seated-row':-3,'leg-press':Infinity}});
 assert.deepEqual(p.items.map(x=>x.personalTarget),[null,null]);
 assert.ok(p.items.every(x=>x.weight===null));
});
