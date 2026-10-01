/* MYLIFTCOACH Coach Evidence V8.0 — interpret Athlete Learning V7.9 without taking programming authority.
   Adds freshness-aware explanations, conflict handling, and recommendation strength to Coach review output. */
(()=>{
 const VERSION='8.0';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 function classify(policy){
  if(!policy)return {state:'unavailable',strength:'none',tone:'neutral',summary:'Athlete Learning evidence is unavailable.',conflict:false};
  if(policy.state==='validated_helpful')return {state:'supported',strength:policy.confidence>=.65?'moderate':'light',tone:'positive',summary:`Recent measured outcomes support this strategy (${policy.recentTrials} recent validated trial${policy.recentTrials===1?'':'s'}).`,conflict:false};
  if(policy.state==='rethink')return {state:'caution',strength:'strong',tone:'caution',summary:`Recent measured outcomes argue against repeating this strategy (${policy.recentHurt||0} recent harmful trial${policy.recentHurt===1?'':'s'}).`,conflict:true};
  if(policy.state==='stale')return {state:'stale',strength:'none',tone:'neutral',summary:'Past results are too old to guide the current recommendation. Coach needs fresh evidence.',conflict:false};
  if(policy.state==='mixed')return {state:'mixed',strength:'light',tone:'neutral',summary:'Recent outcomes are mixed, so Coach should keep the recommendation conservative.',conflict:true};
  return {state:'learning',strength:'none',tone:'neutral',summary:'Coach is still collecting enough recent outcome evidence to judge this strategy.',conflict:false};
 }
 function explain(type){const policy=safe(()=>window.myliftcoachProgramOutcomeValidationPolicy?.(type),null),classification=classify(policy);return {version:VERSION,proposalType:type,policy,classification,authority:'adaptive_programming',advisoryOnly:true,requiresApproval:true,mayOverrideAdaptive:false}}
 function enrich(review){
  if(!review)return review;
  const type=review.proposal?.type||review.outcomePolicyDecision?.blockedProposal?.type||'program_recovery';
  const evidence=explain(type),proposal=review.proposal?{...review.proposal}:null;
  if(proposal){
    proposal.coachEvidence={state:evidence.classification.state,strength:evidence.classification.strength,summary:evidence.classification.summary,freshness:evidence.policy?.freshness??null,confidence:evidence.policy?.confidence??0,effectiveEvidence:evidence.policy?.effectiveEvidence??0,recentTrials:evidence.policy?.recentTrials??0,mayOverrideAdaptive:false};
    proposal.coachExplanation=evidence.classification.summary;
    proposal.requiresApproval=true;proposal.authority='adaptive_programming';proposal.preserveProgramSource=true;
  }
  const blocked=Boolean(evidence.policy?.mayBlockProposal)||Boolean(review.outcomePolicyDecision?.allowed===false);
  return {...review,proposal:blocked?null:proposal,coachEvidence:evidence,coachDecision:{state:blocked?'blocked':proposal?'advisory':'observe',reason:blocked?evidence.classification.summary:proposal?evidence.classification.summary:'No program-level proposal is currently justified.',requiresApproval:Boolean(proposal),mayOverrideAdaptive:false,authority:'adaptive_programming'}};
 }
 function install(attempt=0){
  const base=window.prismCoachProgramReview;
  if(typeof base!=='function'||typeof window.myliftcoachProgramOutcomeValidationPolicy!=='function'){if(attempt<80)setTimeout(()=>install(attempt+1),100);return false}
  if(base.__myliftcoachCoachV8)return true;
  const wrapped=function(){return enrich(base.apply(this,arguments))};
  wrapped.__myliftcoachCoachV8=true;wrapped.__myliftcoachCoachV8Base=base;window.prismCoachProgramReview=wrapped;return true;
 }
 function audit(){return {version:VERSION,programRecovery:explain('program_recovery'),exerciseAdjustment:explain('exercise_adjustment'),guardrails:{athleteLearningReadOnly:true,staleEvidenceCannotSupport:true,conflictsExplicit:true,noAutomaticAcceptance:true,noAutomaticActivation:true,noProgramMutation:true,noPresetFallback:true,preserveProgramSource:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}}}
 window.myliftcoachCoachEvidenceExplain=explain;
 window.myliftcoachCoachEvidenceEnrich=enrich;
 window.myliftcoachCoachEvidenceAudit=audit;
 window.MYLIFTCOACH_COACH_EVIDENCE_VERSION=VERSION;
 install();
})();
