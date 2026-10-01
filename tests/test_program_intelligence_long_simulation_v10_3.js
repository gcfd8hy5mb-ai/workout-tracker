const assert=require('assert');
global.window=global;global.myliftcoachIntelligenceCore={account:()=>({valid:true,owner:'sim'})};
global.myliftcoachProgramAdaptationOutcomeProfile=(type,id)=>({state:'helpful',count:6,confidence:.82,weightedScore:.8});
global.myliftcoachAdaptiveProgramPlanV10=()=>({version:'10.0',owner:'sim',context:{programPressure:true},strategy:[
 {proposalId:'reduce',type:'temporary_volume_reduction',exerciseIds:['press'],horizonExposures:2,requiresApproval:true,autoApply:false},
 {proposalId:'hold',type:'progression_cadence_hold',exerciseIds:['row'],horizonExposures:2,requiresApproval:true,autoApply:false}
]});
global.prismCoachPhaseAnalyze=()=>({name:'Build',intent:'accumulate',weeks:4});
require('../myliftcoach-program-plan-outcomes-v10_1.js');require('../myliftcoach-multi-horizon-optimization-v10_2.js');require('../myliftcoach-phase-aware-optimization-v10_3.js');
for(const weeks of [6,12,16,20]){let last=null;for(let w=0;w<weeks;w++){last=myliftcoachPhaseAwareProgramReviewV103();assert.equal(last.state,'phase_aware_review_ready');assert.equal(last.autoApply,false);assert.equal(last.requiresApproval,true);assert(last.ranked.length>0);for(const r of last.ranked){assert.equal(r.horizonExposures,2);assert(r.multiHorizon.uncertainty.multiWeek>=r.multiHorizon.uncertainty.immediate);assert(['temporary_volume_reduction','progression_cadence_hold'].includes(r.type));}}assert(last.primary);console.log(`V10.3 ${weeks}-week simulation pass: bounded phase-aware program review remains stable.`)}
console.log('V10.1→V10.3 6/12/16/20-week multi-horizon simulation pass.');