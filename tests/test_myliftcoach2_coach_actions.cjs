const test=require('node:test'),assert=require('node:assert/strict');
const {prioritize}=require('../myliftcoach2/coach-actions.js');
const today={status:'scheduled',items:[{id:'leg-press',name:'Leg Press',status:'ready',action:'increase',reason:'Top rep range reached',source:'2.0 history'}]};
test('prioritizes conservative check-in above a supported weight increase',()=>{
 const a=prioritize({today,checkin:{load:'conservative',reason:'Reported tiredness'}});
 assert.equal(a.kind,'caution');assert.equal(a.exerciseId,'leg-press');assert.equal(a.requiresExplicitAction,true);
});
test('allows optional evidence-based increase without modifying a workout plan',()=>{
 const before=JSON.stringify(today),a=prioritize({today,checkin:{load:'normal'}});
 assert.equal(a.kind,'progress');assert.match(a.why,/optional/);assert.equal(JSON.stringify(today),before);
});
test('rest day never becomes a replacement preset',()=>{
 const a=prioritize({today:{status:'rest',items:[]}});
 assert.equal(a.kind,'rest');assert.match(a.description,/not schedule/);
});
test('missing exercises require correction, not invented guidance',()=>{
 const a=prioritize({today:{status:'scheduled',items:[{id:'unknown',status:'unavailable'}]}});
 assert.equal(a.kind,'missing-exercise');
});
test('insufficient workout evidence remains learning state',()=>{
 assert.equal(prioritize({today:{status:'scheduled',items:[{id:'a',status:'insufficient'}]}}).kind,'learning');
});
