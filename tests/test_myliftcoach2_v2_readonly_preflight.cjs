const test=require('node:test'),assert=require('node:assert/strict');
const mod=require('../myliftcoach2/v2-readonly-preflight.js');
const owner='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222';
const doc={version:1,plans:[{id:'custom-legs',title:'Leg Day',ids:['leg-press']}],assigned:['custom-legs',null,null,null,null,null,null],overrides:{'2026-11-20':'custom-legs'},recurring:[{start:'2026-11-13',end:null,workoutId:'custom-legs'}]};
const auth=()=>({access_token:'account-token',user:{id:owner},expires_at:Math.floor(Date.now()/1000)+3000});
function flow(overrides={}){
 let requests=[];
 const input={owner,session:auth(),getSession:async()=>auth(),verifyUser:async token=>{requests.push('verify:'+token);return {id:owner}},readCloud:async token=>{requests.push('read:'+token);return {status:404,data:{code:'PGRST202'}}},localDocument:doc,validExerciseIds:['leg-press'],...overrides};
 return {input,requests};
}
test('missing production RPC is reported as unavailable, never described as a passed cloud save',async()=>{
 const h=flow(),result=await mod.check(h.input);
 assert.equal(result.available,false);assert.equal(result.canWrite,false);assert.equal(result.readOnly,true);
 assert.deepEqual(h.requests,['verify:account-token','read:account-token']);
 assert.deepEqual(result.summary,{workouts:1,datedOverrides:1,recurringRules:1,assignedDays:1});
});
test('valid empty cloud result is only readiness, never permission to write',async()=>{
 const h=flow({readCloud:async()=>({status:200,data:null})});
 assert.deepEqual({...await mod.check(h.input)},{
  owner,summary:mod.inspectLocal(doc,['leg-press']),available:true,revision:0,existing:false,
  comparison:require('../myliftcoach2/v2-schedule-diff.js').compare({local:doc,cloud:null}),
  canWrite:false,readOnly:true
 });
});
test('already saved cloud revision is observable but no cloud content is imported',async()=>{
 const h=flow({readCloud:async()=>({status:200,data:{revision:9,document:doc}})});
 const result=await mod.check(h.input);assert.equal(result.revision,9);assert.equal(result.existing,true);assert.equal(result.canWrite,false);
 assert.equal(result.comparison.state,'same');
});
test('owner mismatch and expired auth fail before any network calls',async()=>{
 const h=flow({owner:second});await assert.rejects(mod.check(h.input),/Sign in again/);assert.deepEqual(h.requests,[]);
 const e=flow({session:{...auth(),expires_at:0}});await assert.rejects(mod.check(e.input),/Sign in again/);assert.deepEqual(e.requests,[]);
});
test('account switch after identity check prevents cloud read',async()=>{
 const h=flow({getSession:async()=>h.requests.includes('verify:account-token')?{...auth(),user:{id:second}}:auth()});
 await assert.rejects(mod.check(h.input),/Sign in again/);
 assert.deepEqual(h.requests,['verify:account-token']);
});
test('cloud read account change rejects and never reports success',async()=>{
 const h=flow({getSession:async()=>h.requests.includes('read:account-token')?{...auth(),user:{id:second}}:auth()});
 await assert.rejects(mod.check(h.input),/Sign in again/);
});
test('unmatched authenticated identity prevents cloud reads',async()=>{
 const h=flow({verifyUser:async()=>({id:second})});
 await assert.rejects(mod.check(h.input),/Verified user/);
});
test('invalid or missing local migration stops before a cloud read',async()=>{
 for(const localDocument of [null,{...doc,recurring:[{start:'bad',end:null,workoutId:'custom-legs'}]},{...doc,plans:[{...doc.plans[0],ids:['removed-id']}]}]){
  const h=flow({localDocument});
  await assert.rejects(mod.check(h.input));
  assert.deepEqual(h.requests,[]);
 }
});
test('unauthorized and malformed RPC responses are rejected',()=>{
 assert.throws(()=>mod.readResponse(403,{}),/not authorized/);
 assert.throws(()=>mod.readResponse(200,{revision:3,document:{}}));
 assert.equal(mod.readResponse(404,{code:'PGRST202'}).available,false);
});

test('remote weekly, rest and repeating changes are reported as drift without a save',async()=>{
 const remote={...doc,assigned:[null,...doc.assigned.slice(1)],overrides:{'2026-11-20':null},
  recurring:[]};
 const h=flow({readCloud:async token=>{h.requests.push('read:'+token);return {status:200,data:{revision:2,document:remote}}}});
 const result=await mod.check(h.input);
 assert.equal(result.available,true);assert.equal(result.comparison.state,'different');
 assert.equal(result.comparison.changedDays,1);assert.equal(result.comparison.changedOverrides,1);
 assert.equal(result.comparison.recurringChanged,true);assert.equal(result.canWrite,false);
 assert.deepEqual(h.requests,['verify:account-token','read:account-token']);
});
test('RPC not deployed returns no comparison or misleading cloud match',async()=>{
 const h=flow(),result=await mod.check(h.input);
 assert.equal(result.available,false);assert.equal(result.comparison,null);
});
