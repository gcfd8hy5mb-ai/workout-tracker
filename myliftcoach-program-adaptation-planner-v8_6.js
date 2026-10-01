/* MYLIFTCOACH Program Adaptation Planner V8.6
   Combines Athlete/Coach evidence into bounded, reversible program-level proposals.
   Advisory only. Adaptive Programming remains final authority and proposals never auto-apply. */
(()=>{
 'use strict';
 const VERSION='8.6',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_PROGRAM_ADAPTATION_PLANNER_UNAVAILABLE='shared_core_missing';return;}
 const safe=core.safe,uniq=a=>[...new Set((a||[]).filter(Boolean).map(String))];
 const blocked=(reason='insufficient_evidence')=>({version:VERSION,state:'learning',reason,proposals:[],requiresApproval:true,autoApply:false,authority:'adaptive_programming',mayOverrideAdaptive:false});
 function collect(exerciseIds=[]){
  const ids=uniq(exerciseIds);
  return ids.map(id=>({
   exerciseId:id,
   context:safe(()=>window.myliftcoachCoachExerciseContextEvidence?.(id),null),
   dose:safe(()=>window.myliftcoachCoachDoseExplain?.(id),null),
   recovery:safe(()=>window.myliftcoachCoachRecoveryExplain?.(id,null),null),
   progression:safe(()=>window.myliftcoachCoachProgressionExplain?.(id),null),
   fatigue:safe(()=>window.myliftcoachCoachFatigueExplain?.(id),null)
  }));
 }
 function evidenceScore(row){
  let s=0;
  if(['supported','caution','emerging'].includes(row.context?.state))s++;
  if(['supported','emerging'].includes(row.dose?.state))s++;
  if(['supported','caution'].includes(row.recovery?.state))s++;
  if(['supported','caution'].includes(row.progression?.state))s++;
  if(['supported','caution'].includes(row.fatigue?.state))s++;
  return s;
 }
 function proposal(id,type,exerciseIds,reason,confidence,changes,signals){return {id:`program-v8-6-${id}`,type,scope:'program_adaptation',exerciseIds:uniq(exerciseIds),reason,confidence:Number(confidence.toFixed(3)),changes,signals,requiresApproval:true,autoApply:false,reversible:true,plannerVersion:VERSION,authority:'adaptive_programming',adaptiveReviewRequired:true};}
 function plan({exerciseIds=[]}={}){
  const rows=collect(exerciseIds),usable=rows.filter(r=>evidenceScore(r)>=2);
  if(rows.length<2||usable.length<2)return blocked('At least two exercises need multi-signal evidence before program-level adaptation is considered.');
  const proposals=[];
  const progressionRows=usable.filter(r=>r.progression?.state==='caution'&&r.progression?.tempo==='patient');
  for(const r of progressionRows){
   const confirming=(r.recovery?.state==='caution'?1:0)+(r.fatigue?.state==='caution'?1:0)+(r.context?.state==='caution'?1:0);
   if(confirming>=1)proposals.push(proposal(`cadence-${r.exerciseId}`,'progression_cadence_hold',[r.exerciseId],'Repeated progression underperformance is confirmed by at least one additional recovery/context/fatigue signal.',Math.min(.9,.58+confirming*.1),{extraSuccessfulExposures:1,durationExposures:2,noLoadIncrease:true},{progression:r.progression?.state,recovery:r.recovery?.state,fatigue:r.fatigue?.state,context:r.context?.state}));
  }
  const volumeRows=usable.filter(r=>r.fatigue?.state==='caution'&&r.fatigue?.profile?.deloadResponse==='responsive'&&['supported','emerging'].includes(r.dose?.state));
  for(const r of volumeRows){
   const bestVol=r.dose?.bestDose?.dose?.volume,worstVol=r.dose?.worstDose?.dose?.volume;
   const doseConfirms=bestVol&&worstVol&&bestVol!==worstVol;
   if(doseConfirms)proposals.push(proposal(`volume-${r.exerciseId}`,'temporary_volume_reduction',[r.exerciseId],'Accumulating fatigue, positive reduced-pressure response, and exercise-specific dose evidence agree that temporarily lowering volume is worth reviewing.',.78,{setDelta:-1,durationExposures:2,minWorkingSets:1,noLoadIncrease:true},{fatigue:'accumulating',deloadResponse:'responsive',bestVolume:bestVol,worstVolume:worstVol}));
  }
  const broad=volumeRows.length>=2?volumeRows:usable.filter(r=>r.fatigue?.state==='caution'&&r.fatigue?.profile?.deloadResponse==='responsive');
  if(broad.length>=2){
   proposals.push(proposal('reduced-pressure-block','reduced_pressure_block',broad.map(r=>r.exerciseId),'Fatigue is accumulating across multiple exercises and reduced-pressure exposures have repeatedly improved outcomes.',.82,{durationExposures:2,maxSetReductionPerExercise:1,noScheduleChange:true,noTrainingDayChange:true,noSplitChange:true,noLoadIncrease:true}, {fatigueCautionExercises:broad.length,deloadResponsiveExercises:broad.length}));
  }
  const stale=rows.filter(r=>['stale','unavailable'].includes(r.fatigue?.state)&&['stale','unavailable'].includes(r.progression?.state)).length;
  const state=proposals.length?'proposed':stale===rows.length?'stale':'learning';
  return {version:VERSION,state,exerciseIds:uniq(exerciseIds),rows,usableExercises:usable.length,proposals,reason:proposals.length?'Multiple independent Athlete/Coach signals agree strongly enough to create bounded program-level proposals.':'Evidence does not yet agree strongly enough for a program-level change.',requiresApproval:true,autoApply:false,authority:'adaptive_programming',mayOverrideAdaptive:false,guardrails:{multiSignalEvidenceRequired:true,noAutomaticProgramReplacement:true,noAutomaticScheduleChange:true,noAutomaticTrainingDayChange:true,noAutomaticSplitChange:true,noLoadIncreaseFromPlanner:true,noSetIncreaseFromPlanner:true,maxSetReductionPerExercise:1,maxDurationExposures:2,adaptiveProgrammingFinalAuthority:true}};
 }
 function audit(){return {version:VERSION,guardrails:{plannerAdvisoryOnly:true,multiSignalEvidenceRequired:true,noAutomaticProgramReplacement:true,noAutomaticScheduleChange:true,noAutomaticTrainingDayChange:true,noAutomaticSplitChange:true,noLoadIncreaseFromPlanner:true,noSetIncreaseFromPlanner:true,boundedReversibleChangesOnly:true,requiresApproval:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}};}
 window.myliftcoachProgramAdaptationEvidence=collect;
 window.myliftcoachProgramAdaptationPlan=plan;
 window.myliftcoachProgramAdaptationAudit=audit;
 window.MYLIFTCOACH_PROGRAM_ADAPTATION_PLANNER_VERSION=VERSION;
})();