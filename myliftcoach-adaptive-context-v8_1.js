/* MYLIFTCOACH Adaptive Context Arbitration V8.1
   Final authority layer consuming Coach V8.1 current-context evidence without granting Coach/Athlete direct prescription control. */
(()=>{
 const VERSION='8.1';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 function contextEvidence(exerciseId){return safe(()=>window.myliftcoachCoachExerciseContextEvidence?.(String(exerciseId)),null)}
 function hardStatus(base){return ['recovery_hold','plateau_hold'].includes(base?.status)||String(base?.adaptiveV8?.decision||'').startsWith('hard_')}
 function arbitratePrescription(base){
  if(!base)return base;
  const ctx=contextEvidence(base.exerciseId),lastWeight=Number(base.lastWeight||base.targetWeight||0);let status=base.status,targetWeight=base.targetWeight,reason=base.reason,decision='context_neutral';
  if(hardStatus(base)){decision='existing_hard_hold_preserved'}
  else if(['caution','conflict'].includes(ctx?.state)){
    if(status==='increase'){status='context_hold';targetWeight=lastWeight||targetWeight;reason=ctx.summary||'Current-context evidence argues for another controlled exposure before progression.'}
    decision=ctx.state==='conflict'?'context_conflict_hold':'context_caution_hold';
  }else if(ctx?.state==='stale'){
    decision='stale_context_ignored';
  }else if(ctx?.state==='mixed'){
    if(status==='increase'){status='context_hold';targetWeight=lastWeight||targetWeight;reason='Context-specific outcomes are mixed, so Adaptive Programming is holding this exposure until the athlete produces another clean data point.'}
    decision='mixed_context_hold';
  }else if(ctx?.state==='supported'){
    decision='context_support_considered';
  }else if(ctx?.state==='learning'||ctx?.state==='uncertain')decision='context_learning_only';
  return {...base,status,targetWeight,reason,adaptiveContextV81:{version:VERSION,decision,authority:'adaptive_programming',contextState:ctx?.state||'unavailable',contextStrength:ctx?.strength||'none',currentContext:ctx?.currentContext||null,hardHoldPreserved:hardStatus(base),supportNeverForcesProgression:true,mayOverrideAdaptive:false}};
 }
 function arbitrateProposal(proposal){
  if(!proposal)return null;
  const ctx=safe(()=>window.myliftcoachCoachProposalContextEvidence?.(proposal),null);
  if(!ctx)return {...proposal,adaptiveContextV81:{version:VERSION,decision:'context_unavailable',authority:'adaptive_programming',requiresApproval:true,blocked:false}};
  if(ctx.state==='caution')return {...proposal,adaptiveContextV81:{version:VERSION,decision:'blocked_by_current_context',authority:'adaptive_programming',requiresApproval:true,blocked:true,summary:ctx.summary}};
  if(ctx.state==='stale')return {...proposal,adaptiveContextV81:{version:VERSION,decision:'stale_context_ignored',authority:'adaptive_programming',requiresApproval:true,blocked:false,summary:ctx.summary}};
  if(ctx.state==='mixed')return {...proposal,adaptiveContextV81:{version:VERSION,decision:'mixed_context_advisory',authority:'adaptive_programming',requiresApproval:true,blocked:false,summary:ctx.summary}};
  if(ctx.state==='supported')return {...proposal,adaptiveContextV81:{version:VERSION,decision:'context_support_considered',authority:'adaptive_programming',requiresApproval:true,blocked:false,summary:ctx.summary}};
  return {...proposal,adaptiveContextV81:{version:VERSION,decision:'context_learning_only',authority:'adaptive_programming',requiresApproval:true,blocked:false,summary:ctx.summary}};
 }
 function install(attempt=0){
  if(typeof window.prismAdaptivePrescription!=='function'){if(attempt<100)setTimeout(()=>install(attempt+1),100);return false}
  if(window.prismAdaptivePrescription.__myliftcoachAdaptiveContextV81)return true;
  const base=window.prismAdaptivePrescription;
  const wrapped=function(){return arbitratePrescription(base.apply(this,arguments))};wrapped.__myliftcoachAdaptiveContextV81=true;wrapped.__myliftcoachAdaptiveContextV81Base=base;window.prismAdaptivePrescription=wrapped;
  if(typeof window.prismAdaptiveAnalyze==='function'&&!window.prismAdaptiveAnalyze.__myliftcoachAdaptiveContextV81){const analyzeBase=window.prismAdaptiveAnalyze;const analyzeWrapped=function(){const r=analyzeBase.apply(this,arguments),proposals=(r?.proposals||[]).map(arbitrateProposal).filter(x=>!x?.adaptiveContextV81?.blocked);return r?{...r,proposals,adaptiveContextV81:{version:VERSION,authority:'adaptive_programming',coachContextAdvisoryOnly:true,athleteContextAdvisoryOnly:true}}:r};analyzeWrapped.__myliftcoachAdaptiveContextV81=true;analyzeWrapped.__myliftcoachAdaptiveContextV81Base=analyzeBase;window.prismAdaptiveAnalyze=analyzeWrapped;}
  return true;
 }
 function audit(){return {version:VERSION,authority:'adaptive_programming',guardrails:{currentContextConsidered:true,contextCautionCannotIncreaseLoad:true,contextConflictCannotIncreaseLoad:true,mixedContextCannotIncreaseLoad:true,staleContextIgnored:true,hardRecoveryFatiguePlateauHoldsPreserved:true,positiveContextNeverForcesProgression:true,coachContextAdvisoryOnly:true,athleteContextAdvisoryOnly:true,noUnsafeJump:true,noAutomaticProgramReplacement:true,noPresetFallback:true,preserveCustomProgramAuthority:true,adaptiveProgrammingFinalAuthority:true}}}
 window.myliftcoachAdaptiveContextArbitratePrescription=arbitratePrescription;
 window.myliftcoachAdaptiveContextArbitrateProposal=arbitrateProposal;
 window.myliftcoachAdaptiveContextV81Audit=audit;
 window.MYLIFTCOACH_ADAPTIVE_CONTEXT_VERSION=VERSION;
 install();
})();
