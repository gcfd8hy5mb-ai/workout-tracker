const assert=require('assert');
global.window=global;
const mem=new Map();
global.localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
let owner='athlete-01';
global.myliftcoachIntelligenceCore={account:()=>({valid:true,owner})};
global.document={body:null,readyState:'loading',addEventListener(){},querySelector(){return null}};
require('../myliftcoach-pre-v10_4-readiness.js');
require('../myliftcoach-autonomy-calibration-v10_3_6.js');
require('../myliftcoach-admin-shadow-dashboard-v4.js');

const athletes=[
['Hypertrophy beginner','hypertrophy',.86,.84,.78,.14,null],['Hypertrophy intermediate','hypertrophy',.82,.83,.75,.15,null],['Hypertrophy advanced','hypertrophy',.77,.82,.70,.17,null],['Strength novice','strength',.87,.85,.80,.12,null],['Strength intermediate','strength',.82,.84,.75,.14,null],['Strength advanced','strength',.76,.82,.69,.17,null],['Power focused','power',.78,.80,.70,.17,null],['Fat loss moderate deficit','fat_loss',.75,.80,.66,.18,null],['Fat loss aggressive deficit','fat_loss',.68,.77,.57,.20,9],['Recomposition','recomp',.79,.81,.71,.16,null],['Maintenance','maintenance',.88,.86,.82,.11,null],['High stress worker','hypertrophy',.70,.78,.59,.20,8],['Poor sleeper','strength',.69,.77,.58,.20,10],['Variable recovery','hypertrophy',.71,.79,.60,.21,7],['Fast responder','strength',.91,.88,.86,.09,null],['Slow responder','hypertrophy',.70,.79,.60,.21,null],['Masters athlete','strength',.76,.82,.68,.18,null],['High frequency athlete','hypertrophy',.75,.81,.66,.18,null],['Low frequency athlete','hypertrophy',.84,.84,.77,.14,null],['Returning after layoff','recomp',.78,.80,.69,.18,11]
].map((x,i)=>({id:`athlete-${String(i+1).padStart(2,'0')}`,name:x[0],goal:x[1],confidence:x[2],reliability:x[3],success:x[4],neutral:x[5],driftWeek:x[6]}));
const types=['progression_cadence_hold','preserve_hold','temporary_volume_reduction','reduced_pressure_block'];
function strategy(type){return type==='temporary_volume_reduction'||type==='reduced_pressure_block'?{type,changes:{durationExposures:2,setDelta:-1,maxSetReductionPerExercise:1,noScheduleChange:true,noTrainingDayChange:true,noSplitChange:true}}:{type,changes:{durationExposures:1,noScheduleChange:true,noTrainingDayChange:true,noSplitChange:true}}}
function contextFor(a,session,week){if(a.driftWeek&&week>=a.driftWeek)return 'drifting_high_fatigue';if(['fat_loss'].includes(a.goal)&&session%4===2)return 'deficit_high_fatigue';if(['high stress worker','poor sleeper','variable recovery'].includes(a.name.toLowerCase()))return 'strained_recovery';return session%3===0?'normal_recovery':'stable_training'}
function outcomeFor(a,idx,session,context){let success=a.success;if(context.includes('high_fatigue'))success-=.12;if(context==='strained_recovery')success-=.08;if(a.name==='Fast responder')success+=.04;success=Math.max(.35,Math.min(.93,success));const u=((idx+1)*53+session*29+(session%7)*11)%100/100;if(u<success)return 'better';if(u<success+a.neutral)return 'same';return 'worse'}

const summaries=[];let totalSessions=0,totalShadow=0,totalWouldApply=0,totalWorse=0;
for(let ai=0;ai<athletes.length;ai++){
  const a=athletes[ai];owner=a.id;
  let shadow=0,would=0,worse=0;
  for(let session=0;session<48;session++){
    totalSessions++;const week=Math.floor(session/4)+1,type=types[(session+ai)%types.length],context=contextFor(a,session,week),drift=Boolean(a.driftWeek&&week>=a.driftWeek),hardConflict=(a.name==='Variable recovery'&&session%11===0),fresh=!(a.name==='Poor sleeper'&&session%13===0),samples=Math.min(20,5+week),confidence=Math.max(.55,a.confidence-(context.includes('high_fatigue')?.06:0)),reliability=Math.max(.55,a.reliability-(context==='strained_recovery'?.05:0));
    const decision=myliftcoachV104ShadowDecision(strategy(type),{samples,reliability,confidence,drift,fresh,hardConflict});shadow++;totalShadow++;assert.equal(decision.actualMutation,false);assert.equal(decision.owner,a.id);
    if(decision.wouldApply){would++;totalWouldApply++;const outcome=outcomeFor(a,ai,session,context);if(outcome==='worse'){worse++;totalWorse++}myliftcoachAutonomyCalibrationRecord({type,context,confidence,reliability,outcome,shadow:true});}
  }
  const engine=myliftcoachAutonomyCalibrationProfiles();
  const cloud=myliftcoachAutonomyCalibrationRows().map(r=>({user_id:a.id,event_kind:'calibration',decision_type:r.type,context:r.context,confidence:r.confidence,reliability:r.reliability,actual_outcome:r.actual,consequence_weight:r.consequenceWeight}));
  const dash=myliftcoachAdminShadowCategoryProfiles(cloud);
  assert.deepEqual(dash.map(p=>[p.type,p.context,p.count,p.qualified]),engine.map(p=>[p.type,p.context,p.count,p.qualified]),`${a.name}: dashboard must match V10.3.6 category qualification exactly`);
  assert(myliftcoachAutonomyCalibrationRows().every(r=>r.owner===a.id),`${a.name}: calibration crossover detected`);
  assert(myliftcoachV104ShadowRows().every(r=>r.owner===a.id),`${a.name}: shadow crossover detected`);
  const qualified=engine.filter(p=>p.qualified).length;
  const drifting=engine.filter(p=>p.context==='drifting_high_fatigue');assert(drifting.every(p=>!p.qualified),`${a.name}: drifting category must not qualify`);
  summaries.push({athlete:a.name,goal:a.goal,wouldApply:would,worse,qualifiedCategories:qualified});
}
assert.equal(totalSessions,960);assert.equal(summaries.length,20);assert(totalWouldApply>0);assert(summaries.some(x=>x.qualifiedCategories>0));
console.log('20-athlete / 12-week MYLIFTCOACH shadow simulation');
console.table(summaries);
console.log(JSON.stringify({athletes:20,weeks:12,sessions:totalSessions,shadowDecisions:totalShadow,wouldApply:totalWouldApply,wouldApplyRate:Number((totalWouldApply/totalShadow).toFixed(3)),worseOutcomes:totalWorse,worseRateAmongApplied:Number((totalWorse/Math.max(1,totalWouldApply)).toFixed(3)),athletesWithQualifiedCategory:summaries.filter(x=>x.qualifiedCategories>0).length,crossAthleteLeakage:0,realTrainingMutations:0},null,2));
console.log('Category-specific dashboard parity, account isolation, drift blocking, and shadow-only authority passed.');