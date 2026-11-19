const test=require('node:test'),assert=require('node:assert/strict');
const {inspect}=require('../myliftcoach2/v2-cloud-inventory.js');
const owner='account-1';
test('unverified account or records cannot claim migration ready',()=>{
 const r=inspect({history:[{id:'a'}],tracking:{},settings:{},schedule:{plans:[]}});
 assert.equal(r.loaded,0);assert.equal(r.readyForReplacement,false);
});
test('owner mismatch in any section blocks source import',()=>{
 const r=inspect({owner,historyOwner:owner,history:[{id:'a'}],trackingOwner:'account-2',
  tracking:{},settingsOwner:owner,settings:{},scheduleOwner:owner,schedule:{plans:[]}});
 assert.equal(r.loaded,3);assert.equal(r.groups[1].loaded,false);
});
test('fully read-only loaded source is still not verified cloud synchronization',()=>{
 const r=inspect({owner,historyOwner:owner,history:[{id:'a'}],trackingOwner:owner,tracking:{},
  settingsOwner:owner,settings:{},scheduleOwner:owner,schedule:{plans:[]}});
 assert.equal(r.loaded,4);assert.equal(r.readyForReplacement,false);
 assert.ok(r.blockers.some(x=>x.includes('RPC')));
});
test('local workouts remain a deliberate migration review blocker',()=>{
 const params={owner,historyOwner:owner,history:[{id:'a'}],trackingOwner:owner,tracking:{},
  settingsOwner:owner,settings:{},scheduleOwner:owner,schedule:{plans:[]},
  cloudScheduleRpcVerified:true,cloudWritesVerified:true,localSessions:[{id:'b'}]};
 const r=inspect(params);assert.equal(r.localWorkouts,1);assert.equal(r.readyForReplacement,false);
 assert.ok(r.blockers.some(x=>x.includes('prevent loss')));
});
test('all verified conditions explicitly required for hypothetical readiness',()=>{
 const r=inspect({owner,historyOwner:owner,history:[],trackingOwner:owner,tracking:{},
  settingsOwner:owner,settings:{},scheduleOwner:owner,schedule:{plans:[]},
  cloudScheduleRpcVerified:true,cloudWritesVerified:true,localSessions:[]});
 assert.equal(r.readyForReplacement,true);
});
