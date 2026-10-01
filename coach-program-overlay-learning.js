/* MYLIFTCOACH Program Overlay Learning V7.6 — outcome memory for temporary program overlays.
   Learns whether accepted conservative program adjustments helped without changing the user's saved program. */
(()=>{
 const VERSION='7.6';
 const OVERLAY_KEY='myliftcoachProgramOverlaysV1';
 const INTERVENTION_KEY='prismCoachInterventionsV1';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 const rows=(key)=>{const v=safe(()=>JSON.parse(localStorage.getItem(key)||'[]'),[]);return Array.isArray(v)?v:[]};
 const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,Number(n)||0));
 function completedOverlays(){return rows(OVERLAY_KEY).filter(x=>x&&['completed','undone'].includes(x.status))}
 function interventionRows(){return rows(INTERVENTION_KEY)}
 function outcomeForExercise(exerciseId,completedAt){const t=Date.parse(completedAt||'');return interventionRows().filter(x=>String(x.exerciseId)===String(exerciseId)&&x.outcome).filter(x=>!Number.isFinite(t)||Date.parse(x.outcome?.at||x.at||0)>=t-36*3600000).sort((a,b)=>Date.parse(b.outcome?.at||b.at||0)-Date.parse(a.outcome?.at||a.at||0))[0]||null}
 function evaluateOverlay(overlay){const outcomes=[];for(const c of overlay.changes||[]){const row=outcomeForExercise(c.exerciseId,overlay.completedAt||overlay.lastConsumedAt||overlay.createdAt);if(!row)continue;const value=row.outcome?.value||'same',score=value==='better'?1:value==='same'?.5:0;outcomes.push({exerciseId:String(c.exerciseId),value,score,at:row.outcome?.at||null})}const n=outcomes.length,mean=n?outcomes.reduce((s,x)=>s+x.score,0)/n:.5;let result='learning';if(n){if(mean>=.67)result='helped';else if(mean<=.33)result='hurt';else result='neutral'}return {overlayId:overlay.id,proposalId:overlay.proposalId,proposalType:overlay.proposalType,evidence:n,score:Number(mean.toFixed(3)),result,outcomes,completedAt:overlay.completedAt||overlay.lastConsumedAt||null}}
 function history(){return completedOverlays().map(evaluateOverlay).sort((a,b)=>Date.parse(b.completedAt||0)-Date.parse(a.completedAt||0))}
 function policy(proposalType='program_recovery'){const h=history().filter(x=>x.proposalType===proposalType&&x.evidence>0).slice(0,12),n=h.length;if(!n)return {version:VERSION,proposalType,evidence:0,state:'learning',confidence:0,successRate:null,mayInformProgramming:false,mayOverrideAdaptive:false,reason:'No completed overlay outcomes are available yet.'};const success=h.filter(x=>x.result==='helped').length,hurt=h.filter(x=>x.result==='hurt').length,neutral=h.filter(x=>x.result==='neutral').length,successRate=(success+.5*neutral)/n,confidence=clamp(n/6);let state='mixed';if(n<2)state='learning';else if(successRate>=.67&&hurt===0)state='working';else if(successRate<=.38||hurt>=Math.max(2,Math.ceil(n/2)))state='rethink';return {version:VERSION,proposalType,evidence:n,state,confidence:Number(confidence.toFixed(3)),successRate:Number(successRate.toFixed(3)),helped:success,neutral,hurt,mayInformProgramming:n>=2&&confidence>=.33,mayOverrideAdaptive:false,reason:state==='working'?'Recent accepted program overlays generally improved subsequent outcomes.':state==='rethink'?'Recent accepted program overlays often failed to improve outcomes, so Coach should reduce trust in repeating this strategy.':state==='learning'?'More completed overlay outcomes are needed before trusting the pattern.':'Overlay outcomes are mixed; continue observing before changing strategy.'}}
 function audit(){const h=history();return {version:VERSION,completed:h.length,policies:{program_recovery:policy('program_recovery'),exercise_adjustment:policy('exercise_adjustment')},guardrails:{historyReadOnly:true,noProgramMutation:true,noAutomaticActivation:true,mayInformProgrammingOnly:true,mayOverrideAdaptive:false,preserveProgramSource:true}}}
 function loadOutcomePolicy(){if(typeof document==='undefined'||!document.body||document.querySelector?.('script[data-myliftcoach-outcome-validation]'))return;const s=document.createElement('script');s.src='myliftcoach-program-outcome-validation.js?v=7.8';s.async=false;s.dataset.myliftcoachOutcomeValidation='1';document.body.appendChild(s)}
 window.myliftcoachProgramOverlayOutcomeHistory=history;
 window.myliftcoachProgramOverlayPolicy=policy;
 window.myliftcoachProgramOverlayLearningAudit=audit;
 window.MYLIFTCOACH_PROGRAM_OVERLAY_LEARNING_VERSION=VERSION;
 loadOutcomePolicy();
})();
