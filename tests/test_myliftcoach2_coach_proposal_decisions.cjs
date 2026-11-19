const test=require('node:test'),assert=require('node:assert/strict');
const p=require('../myliftcoach2/coach-proposal-decisions.js');
function store(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)}}
const proposal={exerciseId:'leg-press',status:'increase',weight:165,source:'2.0 history',requiresApproval:true};
test('acceptance records explicit review without writing or mutating a workout',()=>{
 const storage=store(),plan={ids:['leg-press']},before=JSON.stringify({proposal,plan});
 p.decide(storage,'guest',proposal,'accepted');
 assert.equal(p.status(storage,'guest',proposal),'accepted');
 assert.equal(JSON.stringify({proposal,plan}),before);
});
test('dismissing one weight proposal does not dismiss a later new weight',()=>{
 const storage=store();p.decide(storage,'guest',proposal,'dismissed');
 assert.equal(p.status(storage,'guest',proposal),'dismissed');
 assert.equal(p.status(storage,'guest',{...proposal,weight:170}),null);
});
test('owner-specific decisions are never imported between users',()=>{
 const storage=store();p.decide(storage,'user1',proposal,'accepted');
 assert.equal(p.status(storage,'user2',proposal),null);
});
test('rest, review-only, missing evidence and arbitrary prescriptions fail closed',()=>{
 const storage=store();
 for(const data of [null,{...proposal,status:'review-increase',weight:null},{...proposal,requiresApproval:false},{...proposal,weight:Infinity}]){
  assert.throws(()=>p.decide(storage,'guest',data,'accepted'));
 }
 assert.equal(storage.getItem(p.key('guest')),null);
});
test('malformed local history blocks overwrite',()=>{
 const storage=store();storage.setItem(p.key('guest'),'{');
 assert.throws(()=>p.decide(storage,'guest',proposal,'dismissed'),/recovery/);
 assert.equal(storage.getItem(p.key('guest')),'{');
});
