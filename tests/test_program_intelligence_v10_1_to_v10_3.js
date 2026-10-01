const assert=require('assert');
global.window=global;let valid=true,owner='A',historyMode='helpful',phaseName='Build';
global.myliftcoachIntelligenceCore={account:()=>valid?{valid:true,owner}:{valid:false,owner}};
global.myliftcoachAdaptiveProgramPlanV10=()=>({version:'10.0',owner,context:{programPressure:true},strategy:[
 {proposalId:'reduce',type:'reduced_pressure_block',exerciseIds:['press','row'],horizonExposures:2,requiresApproval:true,autoApply:false},
 {proposalId:'hold',type:'progression_cadence_hold',exerciseIds:['press'],horizonExposures:2,requiresApproval:true,autoApply:false}
]});
global.myliftcoachProgramAdaptationOutcomeProfile=(type,id)=>({state:historyMode,count:4,confidence:.8,weightedScore:historyMode==='harmful'?.2:.82});
global.myliftcoachProgramAdaptationRespond=(id,value)=>({id,response:value});
global.myliftcoachProgramAdaptationFollowThrough=(id,value)=>({id,followThrough:value});
global.myliftcoachProgramAdaptationOutcome=(id,value)=>({id,outcome:value});
global.prismCoachPhaseAnalyze=()=>({name:phaseName,intent:'test',weeks:4});
require('../myliftcoach-program-plan-outcomes-v10_1.js');
require('../myliftcoach-multi-horizon-optimization-v10_2.js');
require('../myliftcoach-phase-aware-optimization-v10_3.js');
let learned=myliftcoachProgramPlanOutcomeReviewV101();assert.equal(learned.state,'outcome_informed_review');assert.equal(learned.strategies.length,2);assert.equal(learned.strategies[0].outcomeLearning.maySupportRepeat,true);assert.equal(learned.autoApply,false);
historyMode='harmful';let harmful=myliftcoachProgramPlanOutcomeReviewV101();assert.equal(harmful.state,'blocked_by_outcome_history');assert.equal(harmful.strategies.length,0);assert.equal(harmful.suppressed.length,2);
historyMode='helpful';let horizons=myliftcoachMultiHorizonProgramReviewV102();assert.equal(horizons.state,'multi_horizon_review_ready');assert.equal(horizons.horizons.length,3);assert(horizons.ranked.every(x=>x.multiHorizon.uncertainty.multiWeek>=x.multiHorizon.uncertainty.immediate));assert(horizons.ranked.every(x=>x.horizonExposures===2));
const custom={version:'10.2',owner:'A',ranked:[
 {proposalId:'hold',type:'progression_cadence_hold',exerciseIds:['press'],horizonExposures:2,multiHorizon:{immediate:.75,week:.72,multiWeek:.68}},
 {proposalId:'reduce',type:'reduced_pressure_block',exerciseIds:['press','row'],horizonExposures:2,multiHorizon:{immediate:.45,week:.65,multiWeek:.75}}
],suppressed:[]};
phaseName='Recovery';let recovery=myliftcoachPhaseAwareProgramReviewV103(custom);assert.equal(recovery.primary.type,'reduced_pressure_block');assert.equal(recovery.phase.name,'Recovery');
phaseName='Build';let build=myliftcoachPhaseAwareProgramReviewV103(custom);assert.equal(build.primary.type,'progression_cadence_hold');assert.deepEqual(build.ranked.map(x=>x.proposalId).sort(),['hold','reduce']);assert(build.ranked.every(x=>x.horizonExposures===2));assert.equal(build.autoApply,false);
valid=false;let blocked=myliftcoachProgramPlanOutcomeReviewV101();assert.equal(blocked.state,'unavailable');assert.equal(blocked.reason,'account_unverified');
const a1=myliftcoachProgramPlanOutcomeAuditV101(),a2=myliftcoachMultiHorizonAuditV102(),a3=myliftcoachPhaseAwareAuditV103();assert.equal(a1.guardrails.helpfulHistoryCannotIncreaseMagnitude,true);assert.equal(a2.guardrails.mayNotExtendAppliedHorizon,true);assert.equal(a3.guardrails.phaseCannotCreateStrategy,true);assert.equal(a3.guardrails.adaptiveProgrammingFinalAuthority,true);
console.log('V10.1→V10.3 program intelligence: outcome learning, multi-horizon uncertainty, phase-aware re-ranking, boundedness, and fail-closed account scope pass.');