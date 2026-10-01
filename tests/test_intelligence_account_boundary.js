const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const boundarySrc=fs.readFileSync(path.join(__dirname,'..','myliftcoach-intelligence-account-boundary.js'),'utf8');
const contractSrc=fs.readFileSync(path.join(__dirname,'..','myliftcoach-intelligence-contract-v1.js'),'utf8');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

(async()=>{
 let active=A,reads=0,writes=0,adaptiveCalls=0;
 const listeners={};
 const window={
  PRISMDeviceStore:{owner:A,stale:false},
  PRISMCloud:{currentUser:async()=>({id:active})},
  prismInterventionRows(){reads++;return [{athlete:active}]},
  prismRememberIntervention(){writes++;return {athlete:active}},
  prismInterventionRespond(){writes++;return {athlete:active}},
  prismInterventionOutcome(){writes++;return {athlete:active}},
  myliftcoachCoachExerciseContextEvidence(){reads++;return {state:'supported',athlete:active}},
  myliftcoachCoachProposalContextEvidence(){reads++;return {state:'supported',athlete:active}},
  myliftcoachCoachDoseExplain(){reads++;return {state:'supported',athlete:active}},
  myliftcoachCoachDoseProposalSummary(){reads++;return {state:'supported',athlete:active}},
  myliftcoachCoachRecoveryExplain(){reads++;return {state:'supported',athlete:active}},
  myliftcoachCoachRecoveryProposalEvidence(){reads++;return {state:'supported',athlete:active}},
  prismCoachProgramReview(){reads++;return {state:'supported',athlete:active}},
  prismAdaptivePrescription(){adaptiveCalls++;return {status:'increase',targetWeight:110,athlete:active}},
  addEventListener(type,fn){(listeners[type]||(listeners[type]=[])).push(fn)},
  dispatchEvent(){},
  localStorage:{},
 };
 const context={window,globalThis:window,CustomEvent:function(type,init){this.type=type;this.detail=init?.detail},BroadcastChannel:function(){this.onmessage=null},console};
 vm.runInNewContext(boundarySrc,context,{filename:'myliftcoach-intelligence-account-boundary.js'});
 vm.runInNewContext(contractSrc,context,{filename:'myliftcoach-intelligence-contract-v1.js'});
 const boundary=window.myliftcoachIntelligenceAccountBoundary,intel=window.myliftcoachIntelligence;

 // Startup is fail-closed until the Supabase user is independently verified.
 assert.equal(boundary.current().valid,false);
 assert.deepEqual(Array.from(window.prismInterventionRows()),[]);
 assert.equal(window.prismRememberIntervention({exerciseId:'press'}),null);
 assert.equal(window.prismAdaptivePrescription({exerciseId:'press'}).status,'account_hold');
 assert.equal(reads,0);assert.equal(writes,0);assert.equal(adaptiveCalls,0);

 await boundary.refreshVerification();
 assert.equal(boundary.current().valid,true);assert.equal(boundary.current().owner,A);
 const tokenA=boundary.token();
 assert.equal(window.prismInterventionRows()[0].athlete,A);
 assert.equal(window.prismRememberIntervention({exerciseId:'press'}).athlete,A);
 assert.equal(intel.coach('press').dose.athlete,A);
 assert.equal(intel.prescribe({exerciseId:'press'}).athlete,A);

 // A -> B owner switch must invalidate A instantly, before B verification completes.
 window.PRISMDeviceStore.owner=B;active=B;
 const readsBefore=reads,writesBefore=writes,adaptiveBefore=adaptiveCalls;
 assert.equal(boundary.current().valid,false);
 assert.equal(boundary.isTokenCurrent(tokenA),false);
 assert.deepEqual(Array.from(window.prismInterventionRows()),[]);
 assert.equal(window.prismRememberIntervention({exerciseId:'press'}),null);
 assert.equal(intel.coach('press').dose.reason,'account_unverified');
 assert.equal(intel.prescribe({exerciseId:'press'}).status,'account_hold');
 assert.equal(reads,readsBefore);assert.equal(writes,writesBefore);assert.equal(adaptiveCalls,adaptiveBefore);

 // Only B's independently verified session can reactivate personalized intelligence.
 await boundary.refreshVerification();
 assert.equal(boundary.current().valid,true);assert.equal(boundary.current().owner,B);
 assert.equal(window.prismInterventionRows()[0].athlete,B);
 assert.equal(intel.coach('press').dose.athlete,B);
 assert.equal(intel.prescribe({exerciseId:'press'}).athlete,B);

 // A stale tab is denied even when its selected owner and last verified id match.
 window.PRISMDeviceStore.stale=true;
 assert.equal(boundary.current().valid,false);
 assert.deepEqual(Array.from(window.prismInterventionRows()),[]);
 assert.equal(intel.prescribe({exerciseId:'press'}).status,'account_hold');

 // B -> A -> verified A restores A only; B's token cannot survive the switch.
 window.PRISMDeviceStore.stale=false;const tokenB=boundary.token();
 window.PRISMDeviceStore.owner=A;active=A;
 assert.equal(boundary.isTokenCurrent(tokenB),false);
 await boundary.refreshVerification();
 assert.equal(boundary.current().owner,A);assert.equal(boundary.current().verified,A);
 assert.equal(window.prismInterventionRows()[0].athlete,A);
 assert.equal(intel.coach('press').recovery.athlete,A);

 boundary.invalidate('sign_out');
 assert.equal(boundary.current().valid,false);
 assert.deepEqual(Array.from(window.prismInterventionRows()),[]);
 assert.equal(intel.prescribe({exerciseId:'press'}).status,'account_hold');

 console.log('Production intelligence account boundary: A/B/A verification, fail-closed reads/writes, stale-tab denial, token invalidation, and sign-out hold pass.');
})().catch(error=>{console.error(error);process.exitCode=1});
