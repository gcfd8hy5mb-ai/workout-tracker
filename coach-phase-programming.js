/* PRISM Coach Phase-Aware Programming v1.1 — approved phases shape workout targets. */
(()=>{
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 function activePhase(){const p=safe(()=>window.prismCoachTrainingPhase?.(),null);return p?.status==='accepted'?p:null}
 function roundLoad(v){return Math.max(0,Math.round(Number(v||0)/5)*5)}
 function apply(id,decision){if(!decision||decision.synthetic)return decision;const phase=activePhase();if(!phase)return {...decision,trainingPhase:null};const d={...decision,next:{...decision.next},trainingPhase:{name:phase.name,weeks:phase.weeks||null,goal:phase.goal||null,status:'accepted'}};const latest=Number(d.latest?.weight||d.next?.weight||0),min=Number(d.next?.repsMin||8),max=Number(d.next?.repsMax||12);
  if(phase.name==='Foundation'){
   if(d.progressionAction==='increase_weight'){d.next.weight=latest;d.progressionAction='increase_reps'}
   d.next.repsMin=Math.max(8,min);d.next.repsMax=Math.max(d.next.repsMin,max);d.reason=`${d.reason} Foundation phase favors repeatable technique and rep quality before faster load progression.`
  }else if(phase.name==='Build'){
   d.reason=`${d.reason} Build phase keeps normal hypertrophy progression active.`
  }else if(phase.name==='Intensification'){
   d.next.repsMin=Math.max(5,min-2);d.next.repsMax=Math.max(d.next.repsMin,Math.min(10,max-2));d.reason=`${d.reason} Intensification phase shifts the target toward a slightly heavier, tighter rep range while preserving Coach confidence and recovery safeguards.`
  }else if(phase.name==='Recovery'){
   d.next.weight=roundLoad(latest*0.9);d.next.repsMin=Math.max(6,min-1);d.next.repsMax=Math.max(d.next.repsMin,max-2);d.progressionAction='recovery_hold';d.phaseVolumeFactor=.75;d.reason='Approved Recovery phase reduces training stress: roughly 10% less load and 25% less volume before normal progression resumes.'
  }else if(phase.name==='Reassessment'){
   d.next.weight=Math.min(Number(d.next.weight||latest),latest);if(d.progressionAction==='increase_weight')d.progressionAction='hold';d.reason=`${d.reason} Reassessment phase holds aggressive load progression while Coach re-establishes reliable baselines.`
  }
  return d
 }
 function install(){const base=window.prismAdaptiveSetDecision;if(typeof base!=='function'||base.__prismPhaseWrapped)return false;const wrapped=function(){const d=base.apply(this,arguments);return apply(d?.id,d)};wrapped.__prismPhaseWrapped=true;wrapped.__prismPhaseBase=base;window.prismAdaptiveSetDecision=wrapped;safe(()=>window.prismAdaptiveSetRender?.(),null);return true}
 window.prismCoachActiveTrainingPhase=activePhase;window.prismCoachPhaseProgramApply=apply;window.PRISM_COACH_PHASE_PROGRAMMING_VERSION='1.1';
 if(!install()){let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>=40)clearInterval(timer)},100)}
})();