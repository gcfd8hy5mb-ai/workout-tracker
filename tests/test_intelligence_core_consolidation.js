const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const files=['myliftcoach-intelligence-core.js','myliftcoach-intelligence-contract-v1.js','myliftcoach-intelligence-account-boundary.js'];
const listeners={};
const window={
 PRISMDeviceStore:null,
 addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn)},
 dispatchEvent:()=>{},
 localStorage:{},
};
const context=vm.createContext({window,console,setTimeout,CustomEvent:function(type,init){this.type=type;this.detail=init?.detail},BroadcastChannel:function(){this.onmessage=null}});
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
assert.equal(window.myliftcoachIntelligenceCore.version,'1.1');
assert.equal(typeof window.myliftcoachIntelligenceCore.installWrapper,'function');
assert.equal(window.myliftcoachIntelligence.version,'1.2');
assert.equal(window.myliftcoachIntelligence.coreVersion,'1.1');
assert.equal(window.myliftcoachIntelligenceAccountBoundary.coreVersion,'1.1');
assert.equal(window.myliftcoachIntelligence.authority,'adaptive_programming');
const unavailable=window.myliftcoachIntelligenceCore.unavailable('test');
assert.deepEqual(JSON.parse(JSON.stringify(unavailable)),{state:'unavailable',reason:'test',accountBound:true,authority:'adaptive_programming',mayOverrideAdaptive:false});
window.PRISMDeviceStore={owner:'user-a',stale:false};
window.MYLIFTCOACH_VERIFIED_ACCOUNT_ID=null;
const blocked=window.myliftcoachIntelligence.prescribe('press');
assert.equal(blocked.status,'account_hold');
assert.equal(blocked.authority,'adaptive_programming');
assert.equal(window.myliftcoachIntelligence.account().valid,false);
window.MYLIFTCOACH_VERIFIED_ACCOUNT_ID='user-a';
window.prismAdaptivePrescription=()=>({status:'hold',authority:'adaptive_programming'});
window.myliftcoachIntelligenceAccountBoundary.install();
const allowed=window.myliftcoachIntelligence.prescribe('press');
assert.equal(allowed.status,'hold');
assert.equal(allowed.authority,'adaptive_programming');
window.PRISMDeviceStore.owner='user-b';
assert.equal(window.myliftcoachIntelligence.account().valid,false);
assert.equal(window.myliftcoachIntelligence.prescribe('press').status,'account_hold');
const config=fs.readFileSync('supabase-config.js','utf8');
const corePos=config.indexOf("myliftcoach-intelligence-core.js?v=1.1");
const contractPos=config.indexOf("myliftcoach-intelligence-contract-v1.js?v=1.2");
const boundaryPos=config.indexOf("myliftcoach-intelligence-account-boundary.js?v=1.1");
assert(corePos>0&&contractPos>corePos&&boundaryPos>contractPos,'core -> contract -> boundary loader order must be preserved');
console.log('Intelligence core v1.1 consolidation, shared wrapper installer, fail-closed account behavior, Adaptive authority, and loader order pass.');
