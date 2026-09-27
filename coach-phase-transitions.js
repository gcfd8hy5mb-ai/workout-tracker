/* PRISM Coach Phase Transitions v1.0 — recommends transitions; never changes an accepted phase without approval. */
(()=>{
 const KEY='prismCoachPhaseTransitionV1',PHASE_KEY='prismCoachTrainingPhaseV1';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 function current(){const p=safe(()=>window.prismCoachTrainingPhase?.(),null);return p?.status==='accepted'?p:null}
 function daysActive(p){const at=p?.respondedAt||p?.at;if(!at)return 0;const ms=Date.now()-new Date(at).getTime();return Number.isFinite(ms)?Math.max(0,ms/86400000):0}
 function review(){
  const from=current(),evidence=safe(()=>window.prismCoachPhaseAnalyze?.(),null),recovery=safe(()=>window.prismCoachRecoveryAnalyze?.(),null);
  if(!from||!evidence)return {from:from?.name||null,to:null,ready:false,reason:'An accepted training phase is required before Coach can recommend a transition.',requiresApproval:true};
  const activeDays=daysActive(from);let to=null,reason='Current phase still matches the available evidence.';
  if(recovery?.state==='deload_candidate'&&from.name!=='Recovery'){
   to='Recovery';reason='Recovery signals are strong enough to interrupt the current phase before more aggressive progression.';
  }else if(from.name==='Recovery'&&recovery?.state!=='deload_candidate'&&activeDays>=5){
   to='Reassessment';reason='Recovery signals have eased. Coach recommends a short reassessment before normal progression resumes.';
  }else if(from.name==='Foundation'&&['Build','Intensification'].includes(evidence.name)&&activeDays>=7&&evidence.readyExercises>=3&&evidence.progressing>=2){
   to=evidence.name;reason='Enough exercises are now ready and progressing to move beyond Foundation.';
  }else if(['Build','Intensification'].includes(from.name)&&evidence.name==='Reassessment'&&activeDays>=7&&evidence.plateau>=2){
   to='Reassessment';reason='Multiple exercises are showing weak-response patterns despite time in the current phase.';
  }else if(from.name==='Reassessment'&&['Build','Intensification'].includes(evidence.name)&&activeDays>=7&&evidence.readyExercises>=3&&evidence.progressing>=2){
   to=evidence.name;reason='Reassessment has enough positive evidence to resume productive progression.';
  }
  return {from:from.name,to,ready:!!to,reason,activeDays:Math.floor(activeDays),evidence,requiresApproval:true};
 }
 function propose(){const r=review();if(!r.ready)return null;const p={id:`transition-${Date.now()}`,at:new Date().toISOString(),status:'proposed',...r};localStorage.setItem(KEY,JSON.stringify(p));return p}
 function proposal(){return safe(()=>JSON.parse(localStorage.getItem(KEY)||'null'),null)}
 function respond(status){if(!['accepted','declined'].includes(status))return null;const p=proposal();if(!p)return null;p.status=status;p.respondedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(p));if(status==='accepted'){
    const suggested=p.evidence||{},next={...suggested,name:p.to,id:`phase-${Date.now()}`,status:'accepted',at:new Date().toISOString(),respondedAt:new Date().toISOString(),transitionedFrom:p.from,transitionId:p.id,requiresApproval:true};
    localStorage.setItem(PHASE_KEY,JSON.stringify(next));window.dispatchEvent(new CustomEvent('prism:training-phase-transition',{detail:next}));
  }return p}
 window.prismCoachPhaseTransitionReview=review;window.prismCoachPhaseTransitionPropose=propose;window.prismCoachPhaseTransitionProposal=proposal;window.prismCoachPhaseTransitionRespond=respond;window.PRISM_COACH_PHASE_TRANSITIONS_VERSION='1.0';
})();