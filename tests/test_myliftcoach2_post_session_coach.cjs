const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../myliftcoach2/post-session-coach.js');
const catalog=[{id:'leg-press',name:'Leg Press'}];
const set=(weight,reps)=>({exerciseId:'leg-press',weight,reps});
const current={id:'new',created:'2026-11-18T12:00:00Z',title:'My workout',readiness:'Normal',sets:[set(165,10),set(165,10)]};
const earlier=[{id:'old',created:'2026-11-11T12:00:00Z',sets:[set(160,8),set(160,9)]}];
test('completed session produces a data-backed debrief and next exposure suggestion',()=>{
 const result=api.review(current,earlier,catalog);
 assert.equal(result.status,'ready');
 assert.equal(result.suggestions[0].weight,170);
 assert.equal(result.suggestions[0].status,'evidence');
 assert.match(result.note,/never change/);
});
test('missing or empty session never invents progress',()=>{
 assert.equal(api.review(null,earlier,catalog).status,'unavailable');
 assert.equal(api.review({...current,sets:[]},earlier,catalog).status,'unavailable');
});
test('post workout review is read-only',()=>{
 const before=JSON.stringify([current,...earlier]);
 api.review(current,earlier,catalog);
 assert.equal(JSON.stringify([current,...earlier]),before);
});
