/* MYLIFTCOACH Adaptive Programming V8 arbitration — final authority over Athlete Learning + Coach advisory signals.
   Preserves existing Adaptive v2.2 prescriptions and adds conservative arbitration around stale, conflicting, recovery, fatigue, and plateau evidence. */
(()=>{
 const VERSION='8.0',core=window.myliftcoachIntelligenceCore;
 const safe=core?.safe||((fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}});
 function coachEvidence(type='program_recovery'){return safe(()=>window.myliftcoachCoachEvidenceExplain?.(type),null)}
 function athletePolicy(type='program_recovery'){return safe(()=>window.myliftcoachProgramOutcomeValidationPolicy?.(type),null)}
 function hardHold(exerciseId){
  const fatigue=safe(()=>window.prismAdaptiveFatigueSignals?.(),null),coach=safe(()=>window.prismCoachAnalyzeBase?.(),null),signal=coach?.snapshot?.checkinSignal||null;
  const repeated=(fatigue?.repeated||[]).find(x=>String(x.id)===String(exerciseId));
  const plateau=(coach?.snapshot?.plateaus||[]).find(x=>String(x.id)===String(exerciseId));
  if(signal?.load==='conservative')return {active:true,kind:'recovery',reason:`Recovery check-in requires a conservative exposure. ${signal.reason||''}`.trim()};
  if(repeated)return {active:true,kind:'fatigue',reason:'Repeated fatigue signals require a hold before progression.'};
  if(plateau)return {active:true,kind:'plateau',reason:plateau.reason||'Plateau evidence requires a controlled hold before changing load.'};
  return {active:false,kind:null,reason:null};
 }
 function arbitratePrescription(base){
  if(!base)return base;
  const hold=hardHold(base.exerciseId),athlete=athletePolicy('program_recovery'),coach=coachEvidence('program_recovery');
  let status=base.status,targetWeight=base.targetWeight,reason=base.reason,decision='existing_adaptive';
  const lastWeight=Number(base.lastWeight||base.targetWeight||0);
  if(hold.active){status=hold.kind==='plateau'?'plateau_hold':'recovery_hold';targetWeight=lastWeight||targetWeight;reason=hold.reason;decision=`hard_${hold.kind}_hold`;}
  else if(athlete?.state==='rethink'||coach?.classification?.state==='caution'){
    if(status==='increase'){status='evidence_hold';targetWeight=lastWeight||targetWeight;reason='Recent validated outcomes conflict with progression, so Adaptive Programming is holding this exposure while new evidence is collected.';decision='recent_outcome_conflict_hold';}
  }else if(athlete?.state==='stale'||coach?.classification?.state==='stale'){
    decision='stale_evidence_ignored';
  }else if(athlete?.state==='mixed'||coach?.classification?.state==='mixed'){
    if(status==='increase'){status='evidence_hold';targetWeight=lastWeight||targetWeight;reason='Current outcome evidence is mixed, so Adaptive Programming is requiring another controlled exposure before increasing load.';decision='mixed_evidence_hold';}
  }else if(athlete?.state==='validated_helpful'&&coach?.classification?.state==='supported'){
    decision='fresh_support_considered';
  }
  return {...base,status,targetWeight,reason,adaptiveV8:{version:VERSION,decision,authority:'adaptive_programming',athleteState:athlete?.state||'unavailable',coachState:coach?.classification?.state||'unavailable',hardHold:hold.active?hold.kind:null,staleEvidenceIgnored:athlete?.state==='stale'||coach?.classification?.state==='stale',mayOverrideAdaptive:false}};
 }
 function arbitrateProposal(proposal){
  if(!proposal)return null;
  const type=proposal.type==='exercise_adjustment'?'exercise_adjustment':'program_recovery',athlete=athletePolicy(type),coach=coachEvidence(type);
  if(athlete?.state==='stale'||coach?.classification?.state==='stale')return {...proposal,adaptiveV8:{version:VERSION,decision:'stale_advisory_ignored',authority:'adaptive_programming',requiresApproval:true}};
  if(athlete?.mayBlockProposal||coach?.classification?.state==='caution')return {...proposal,adaptiveV8:{version:VERSION,decision:'blocked_by_recent_outcomes',authority:'adaptive_programming',requiresApproval:true,blocked:true}};
  return {...proposal,adaptiveV8:{version:VERSION,decision:athlete?.maySupportProposal?'fresh_support_considered':'advisory_only',authority:'adaptive_programming',requiresApproval:true,blocked:false}};
 }
 function legacyInstall(name,marker,factory,attempt=0){const base=window[name];if(typeof base!=='function'){if(attempt<100&&typeof setTimeout==='function')setTimeout(()=>legacyInstall(name,marker,factory,attempt+1),100);return false}if(base[marker])return true;const wrapped=factory(base);wrapped[marker]=true;wrapped[`${marker}Base`]=base;window[name]=wrapped;return true}
 function install(){
  const wrap=core?.installWrapper?((name,marker,factory,options={})=>core.installWrapper(name,marker,factory,options)):((name,marker,factory)=>legacyInstall(name,marker,factory));
  wrap('prismAdaptivePrescription','__myliftcoachAdaptiveV8',base=>function(){return arbitratePrescription(base.apply(this,arguments))},{maxAttempts:100,delayMs:100});
  wrap('prismAdaptiveAnalyze','__myliftcoachAdaptiveV8',base=>function(){const r=base.apply(this,arguments);const proposals=(r?.proposals||[]).map(arbitrateProposal).filter(p=>!p?.adaptiveV8?.blocked);return r?{...r,proposals,adaptiveV8:{version:VERSION,authority:'adaptive_programming',coachAdvisoryOnly:true,athleteLearningAdvisoryOnly:true}}:r},{maxAttempts:100,delayMs:100});
  return true;
 }
 function audit(){return {version:VERSION,authority:'adaptive_programming',guardrails:{athleteLearningAdvisoryOnly:true,coachAdvisoryOnly:true,staleEvidenceIgnored:true,recoveryOverridesSupport:true,fatigueOverridesSupport:true,plateauOverridesSupport:true,mixedEvidenceCannotIncreaseLoad:true,recentHarmCannotIncreaseLoad:true,noUnsafeJump:true,noAutomaticProgramReplacement:true,noPresetFallback:true,preserveCustomProgramAuthority:true,adaptiveProgrammingFinalAuthority:true}}}
 window.myliftcoachAdaptiveArbitratePrescription=arbitratePrescription;
 window.myliftcoachAdaptiveArbitrateProposal=arbitrateProposal;
 window.myliftcoachAdaptiveV8Audit=audit;
 window.MYLIFTCOACH_ADAPTIVE_ARBITRATION_VERSION=VERSION;
 install();
})();
