/* MYLIFTCOACH Program Overlay Policy V7.7 — outcome-informed proposal gating.
   V7.9 adds measured pre/post validation plus freshness/decay before positive history can support a proposal.
   Advisory only: never auto-accepts, auto-activates, or rewrites the user's program. */
(()=>{
 const VERSION='7.7';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 function policyFor(type){return safe(()=>window.myliftcoachProgramOverlayPolicy?.(type),null)}
 function evaluateProposal(proposal){
  if(!proposal)return {version:VERSION,allowed:false,proposal:null,policy:null,reason:'No program proposal is available.'};
  const policy=policyFor(proposal.type),validation=policy?.outcomeValidation||null,informative=Boolean(policy?.mayInformProgramming),validatedSupport=validation?Boolean(policy?.validatedSupport):informative&&policy?.state==='working',blocked=(informative&&policy?.state==='rethink')||Boolean(policy?.validatedBlock);
  if(blocked)return {version:VERSION,allowed:false,proposal:null,policy,blockedProposal:{type:proposal.type,title:proposal.title||null,reason:proposal.reason||null},reason:'Measured or repeated outcomes show this program-level strategy has underperformed, so MYLIFTCOACH will not repeat it without new evidence.',authority:'adaptive_programming',mayOverrideAdaptive:false,preserveProgramSource:true};
  const support=validatedSupport?'Recent measured pre/post trials show this proposal type has repeatedly improved outcomes versus the athlete baseline and may support reconsidering it.':validation?.state==='stale'?'Earlier outcomes are now stale, so Coach will not use them as current support.':validation&&policy?.state==='working'?'Directional outcomes looked positive, but measured baseline validation is not strong enough to count them as supporting evidence yet.':informative?'Past overlay outcomes are mixed and remain supporting context only.':'There is not enough overlay-outcome history to influence this proposal.';
  return {version:VERSION,allowed:true,proposal:{...proposal,outcomePolicy:{version:VERSION,state:policy?.state||'learning',confidence:Number(policy?.confidence||0),successRate:policy?.successRate??null,evidence:Number(policy?.evidence||0),mayInformProgramming:informative,validatedSupport,validation,mayOverrideAdaptive:false,support}},policy,reason:support,authority:'adaptive_programming',mayOverrideAdaptive:false,preserveProgramSource:true};
 }
 function review(){const base=safe(()=>window.prismCoachProgramReview?.__myliftcoachPolicyBase?.(),null);if(!base)return null;const decision=evaluateProposal(base.proposal);return {...base,proposal:decision.allowed?decision.proposal:null,outcomePolicyDecision:decision}}
 function install(attempt=0){if(typeof window.prismCoachProgramReview!=='function'){if(attempt<40)setTimeout(()=>install(attempt+1),100);return false}if(window.prismCoachProgramReview.__myliftcoachOverlayPolicy)return true;const base=window.prismCoachProgramReview;const wrapped=function(){const r=base();const decision=evaluateProposal(r?.proposal);return r?{...r,proposal:decision.allowed?decision.proposal:null,outcomePolicyDecision:decision}:r};wrapped.__myliftcoachOverlayPolicy=true;wrapped.__myliftcoachPolicyBase=base;window.prismCoachProgramReview=wrapped;return true}
 function loadCoachEvidence(){if(typeof document==='undefined'||!document.body||document.querySelector?.('script[data-myliftcoach-coach-evidence]'))return;const s=document.createElement('script');s.src='myliftcoach-coach-evidence-v8.js?v=8.0';s.async=false;s.dataset.myliftcoachCoachEvidence='1';document.body.appendChild(s)}
 function audit(){const types=['program_recovery','exercise_adjustment'],policies=Object.fromEntries(types.map(t=>[t,policyFor(t)]));return {version:VERSION,policies,guardrails:{outcomeMemoryAdvisoryOnly:true,validatedImprovementRequiredForPositiveSupport:true,staleEvidenceCannotSupport:true,noAutomaticAcceptance:true,noAutomaticActivation:true,noProgramMutation:true,noPresetFallback:true,preserveProgramSource:true,adaptiveProgrammingFinalAuthority:true}}}
 window.myliftcoachProgramOutcomePolicyEvaluate=evaluateProposal;
 window.myliftcoachProgramOutcomePolicyAudit=audit;
 window.MYLIFTCOACH_PROGRAM_OUTCOME_POLICY_VERSION=VERSION;
 install();loadCoachEvidence();
})();
