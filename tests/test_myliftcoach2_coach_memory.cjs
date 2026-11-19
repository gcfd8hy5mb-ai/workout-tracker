const test=require('node:test'),assert=require('node:assert/strict');
const {review,guard}=require('../myliftcoach2/coach-memory.js');
const rows=(ratings,id='leg-press')=>ratings.map((rating,i)=>({feedbackId:'cf-1-'+(i+1),sessionId:'session-'+i,exerciseId:id,rating,at:'2026-11-'+String(14+i).padStart(2,'0')+'T12:00:00Z'}));
test('holds a supported Coach increase for review only after repeated worse user ratings',()=>{
 const memory=review(rows(['worse','worse','same','worse']),'leg-press');
 assert.equal(memory.signal,'review');
 const action={kind:'progress',exerciseId:'leg-press',title:'Increase',requiresExplicitAction:true};
 const revised=guard(action,memory);
 assert.equal(revised.kind,'review-outcomes');
 assert.equal(action.kind,'progress');
 assert.match(revised.why,/does not alter/);
});
test('does not infer outcome pattern from fewer than four rated sessions',()=>{
 assert.equal(review(rows(['worse','worse','worse']),'leg-press').signal,'learning');
});
test('other exercise outcomes cannot constrain this exercise',()=>{
 const memory=review(rows(['worse','worse','worse','worse'],'seated-row'),'leg-press');
 assert.equal(memory.count,0);
});
test('positive ratings are observations, not proof of causal efficacy',()=>{
 const memory=review(rows(['better','better','same','better']),'leg-press');
 assert.equal(memory.signal,'positive');
 assert.match(memory.message,/does not prove/);
});
test('does not rewrite rest, conservative or unrelated Coach decisions',()=>{
 const memory=review(rows(['worse','worse','worse','same']),'leg-press');
 const action={kind:'rest',exerciseId:null};
 assert.equal(guard(action,memory),action);
 assert.equal(guard({kind:'progress',exerciseId:'seated-row'},memory).kind,'progress');
});
