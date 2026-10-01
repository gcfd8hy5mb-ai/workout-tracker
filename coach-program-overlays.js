/* MYLIFTCOACH Program Overlays V7.5 — temporary, reversible constraints from accepted V7.4 proposals.
   Preserves the user's current program source and can only make prescriptions more conservative. */
(()=>{
 const VERSION='7.5';
 const KEY='myliftcoachProgramOverlaysV1';
 const PROPOSAL_KEY='prismCoachProgramProposalsV1';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 const rows=(key)=>{const v=safe(()=>JSON.parse(localStorage.getItem(key)||'[]'),[]);return Array.isArray(v)?v:[]};
 const save=(items)=>localStorage.setItem(KEY,JSON.stringify(items.slice(0,50)));
 const now=()=>new Date().toISOString();
 function proposals(){return rows(PROPOSAL_KEY)}
 function overlays(){return rows(KEY)}
 function active(){return overlays().filter(x=>x.status==='active'&&Number(x.remainingExposures)>0)}
 function proposalById(id){return proposals().find(x=>String(x.id)===String(id))||null}
 function activate(proposalId,exposures=1){const p=proposalById(proposalId);if(!p||p.status!=='accepted'||p.requiresApproval!==true||p.reversible!==true)return null;const count=Math.max(1,Math.min(3,Number(exposures)||1)),items=overlays(),existing=items.find(x=>x.proposalId===p.id&&x.status==='active');if(existing)return existing;const overlay={id:`po-${Date.now()}`,version:VERSION,proposalId:p.id,proposalType:p.type,createdAt:now(),status:'active',remainingExposures:count,initialExposures:count,preserveProgramSource:true,authority:'adaptive_programming',changes:(p.changes||[]).map(c=>({exerciseId:String(c.exerciseId),exercise:c.exercise||null,muscle:c.muscle||null,change:c.change||'',reason:c.reason||p.reason||''}))};items.unshift(overlay);save(items);return overlay}
 function findForExercise(exerciseId){const id=String(exerciseId);return active().find(o=>(o.changes||[]).some(c=>String(c.exerciseId)===id))||null}
 function apply(prescription){if(!prescription?.exerciseId)return prescription;const overlay=findForExercise(prescription.exerciseId);if(!overlay)return prescription;const change=(overlay.changes||[]).find(c=>String(c.exerciseId)===String(prescription.exerciseId));if(!change)return prescription;const next={...prescription,programOverlay:{id:overlay.id,version:VERSION,proposalId:overlay.proposalId,remainingExposures:overlay.remainingExposures,preserveProgramSource:true,reason:change.reason},sourceProgramPreserved:true};const currentTarget=Number(prescription.targetWeight)||0,lastWeight=Number(prescription.lastWeight)||currentTarget;if(currentTarget>0&&lastWeight>0)next.targetWeight=Math.min(currentTarget,lastWeight);if(Number.isFinite(Number(prescription.workingSets))&&Number(prescription.workingSets)>1)next.workingSets=Math.max(1,Number(prescription.workingSets)-1);next.status='program_recovery_hold';next.reason=`${prescription.reason||''}${prescription.reason?' ':''}Accepted program recovery overlay: ${change.reason||change.change||'temporarily reduce progression pressure.'}`;next.source='program_overlay_v7_5';return next}
 function consume(exerciseId){const id=String(exerciseId),items=overlays(),overlay=items.find(o=>o.status==='active'&&Number(o.remainingExposures)>0&&(o.changes||[]).some(c=>String(c.exerciseId)===id));if(!overlay)return null;overlay.remainingExposures=Math.max(0,Number(overlay.remainingExposures)-1);overlay.lastConsumedAt=now();if(overlay.remainingExposures===0){overlay.status='completed';overlay.completedAt=now()}save(items);return overlay}
 function undo(id){const items=overlays(),overlay=items.find(o=>o.id===id||o.proposalId===id);if(!overlay)return null;overlay.status='undone';overlay.undoneAt=now();overlay.remainingExposures=0;save(items);return overlay}
 function audit(){const items=overlays();return {version:VERSION,active:items.filter(x=>x.status==='active').length,completed:items.filter(x=>x.status==='completed').length,undone:items.filter(x=>x.status==='undone').length,guardrails:{acceptedProposalRequired:true,temporary:true,reversible:true,noExerciseRemoval:true,noLoadIncrease:true,noVolumeIncrease:true,noPresetFallback:true,preserveProgramSource:true,adaptiveProgrammingFinalAuthority:true}}}
 function installProgramResponseBridge(){if(typeof window.prismCoachProgramRespond!=='function'||window.prismCoachProgramRespond.__myliftcoachOverlay)return false;const base=window.prismCoachProgramRespond;const wrapped=function(id,status){const result=base(id,status);if(result&&status==='accepted')activate(id,1);if(result&&status==='undone')undo(id);return result};wrapped.__myliftcoachOverlay=true;window.prismCoachProgramRespond=wrapped;return true}
 function installPrescriptionBridge(){if(typeof window.prismAdaptivePrescription!=='function'||window.prismAdaptivePrescription.__myliftcoachOverlay)return false;const base=window.prismAdaptivePrescription;const wrapped=function(exerciseId){return apply(base(exerciseId))};wrapped.__myliftcoachOverlay=true;window.prismAdaptivePrescription=wrapped;return true}
 function installOutcomeBridge(){if(typeof window.prismInterventionOutcome!=='function'||window.prismInterventionOutcome.__myliftcoachOverlay)return false;const base=window.prismInterventionOutcome;const wrapped=function(exerciseId,outcome,details){const result=base(exerciseId,outcome,details);if(result)consume(exerciseId);return result};wrapped.__myliftcoachOverlay=true;window.prismInterventionOutcome=wrapped;return true}
 function install(attempt=0){const a=installProgramResponseBridge(),b=installPrescriptionBridge(),c=installOutcomeBridge();if((!a||!b||!c)&&attempt<40)setTimeout(()=>install(attempt+1),100)}
 window.myliftcoachProgramOverlayActivate=activate;
 window.myliftcoachProgramOverlayApply=apply;
 window.myliftcoachProgramOverlayConsume=consume;
 window.myliftcoachProgramOverlayUndo=undo;
 window.myliftcoachProgramOverlayAudit=audit;
 window.MYLIFTCOACH_PROGRAM_OVERLAY_VERSION=VERSION;
 install();
})();
