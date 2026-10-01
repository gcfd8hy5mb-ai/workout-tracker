const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

function load(path,window){vm.runInNewContext(fs.readFileSync(path,'utf8'),{window,setTimeout:()=>{},console,Math,Date,Number,String,Boolean,Object,Array,JSON});}

function buildWindow({contextState='supported',doseState='supported',recoveryState='supported',recoveryTiming='on_time'}={}){
 const window={
  prismAdaptivePrescription:(base)=>({...base}),
  myliftcoachCoachExerciseContextEvidence:()=>({state:contextState,summary:'context signal',strength:'strong'}),
  myliftcoachCoachDoseExplain:()=>doseState==='supported'?{state:'supported',bestDose:{dose:{volume:'moderate',pressure:'conservative'}},worstDose:{dose:{volume:'high',pressure:'progressive'}},separation:.25}:{state:doseState},
  myliftcoachCoachRecoveryExplain:()=>({state:recoveryState,timing:recoveryTiming})
 };
 load('myliftcoach-adaptive-context-v8_1.js',window);
 load('myliftcoach-adaptive-dose-v8_2.js',window);
 load('myliftcoach-adaptive-recovery-v8_3.js',window);
 return window;
}

const scenarios=[
 {name:'healthy progression',signals:{contextState:'supported',doseState:'supported',recoveryState:'supported',recoveryTiming:'on_time'},base:{exerciseId:'bench',status:'increase',targetWeight:105,lastWeight:100,workingSets:3,recoveryHours:72},unsafe:false},
 {name:'strained current context',signals:{contextState:'caution',doseState:'supported',recoveryState:'supported',recoveryTiming:'on_time'},base:{exerciseId:'bench',status:'increase',targetWeight:105,lastWeight:100,workingSets:3,recoveryHours:72},unsafe:true},
 {name:'too much volume and pressure',signals:{contextState:'supported',doseState:'supported',recoveryState:'supported',recoveryTiming:'on_time'},base:{exerciseId:'bench',status:'increase',targetWeight:105,lastWeight:100,workingSets:5,recoveryHours:72},unsafe:true},
 {name:'early repeat',signals:{contextState:'supported',doseState:'learning',recoveryState:'supported',recoveryTiming:'early'},base:{exerciseId:'bench',status:'increase',targetWeight:105,lastWeight:100,workingSets:3,recoveryHours:24},unsafe:true},
 {name:'mixed noisy evidence',signals:{contextState:'mixed',doseState:'learning',recoveryState:'learning',recoveryTiming:'unknown'},base:{exerciseId:'bench',status:'increase',targetWeight:105,lastWeight:100,workingSets:3,recoveryHours:48},unsafe:true},
 {name:'stale evidence',signals:{contextState:'stale',doseState:'stale',recoveryState:'stale',recoveryTiming:'unknown'},base:{exerciseId:'bench',status:'increase',targetWeight:105,lastWeight:100,workingSets:3,recoveryHours:72},unsafe:false},
 {name:'missed-workout recovery uncertainty',signals:{contextState:'conflict',doseState:'learning',recoveryState:'learning',recoveryTiming:'unknown'},base:{exerciseId:'row',status:'increase',targetWeight:155,lastWeight:150,workingSets:3,recoveryHours:120},unsafe:true},
 {name:'plateau hard hold survives',signals:{contextState:'supported',doseState:'supported',recoveryState:'supported',recoveryTiming:'on_time'},base:{exerciseId:'squat',status:'plateau_hold',targetWeight:225,lastWeight:225,workingSets:4,recoveryHours:96},unsafe:true}
];
let naiveUnsafeProgressions=0,smartUnsafeProgressions=0;
for(const s of scenarios){
 const w=buildWindow(s.signals);
 const naive={...s.base};
 if(s.unsafe&&naive.status==='increase')naiveUnsafeProgressions++;
 const smart=w.prismAdaptivePrescription({...s.base});
 if(s.unsafe&&smart.status==='increase')smartUnsafeProgressions++;
 assert(Number(smart.workingSets||0)<=Number(s.base.workingSets||0),'learned layers must never increase sets');
 assert(Number(smart.targetWeight||0)<=Math.max(Number(s.base.targetWeight||0),Number(s.base.lastWeight||0)),'learned layers must never increase beyond base prescription');
 if(s.base.status==='plateau_hold')assert.equal(smart.status,'plateau_hold','hard plateau hold must survive');
}
assert(naiveUnsafeProgressions>0,'baseline should contain unsafe progressions to compare');
assert(smartUnsafeProgressions<naiveUnsafeProgressions,'consolidated intelligence should prevent more unsafe progressions than naive baseline');
assert.equal(smartUnsafeProgressions,0,'stress scenarios should not leave unsafe increases active');
console.log(`full-system intelligence stress passed: naive unsafe=${naiveUnsafeProgressions}, smart unsafe=${smartUnsafeProgressions}`);
