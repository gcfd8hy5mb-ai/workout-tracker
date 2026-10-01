/* MYLIFTCOACH Adaptive Dose Arbitration V8.2 — final authority over dose-response evidence. */
(()=>{
 const VERSION='8.2',core=window.myliftcoachIntelligenceCore;
 const safe=core?.safe||((fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}});
 const setsFor=v=>v==='low'?2:v==='moderate'?3:v==='high'?5:null;
 function arbitrate(base){if(!base)return base;const evidence=safe(()=>window.myliftcoachCoachDoseExplain?.(base.exerciseId),null);if(!evidence||!['supported','emerging'].includes(evidence.state))return {...base,adaptiveDoseV82:{version:VERSION,decision:evidence?.state==='stale'?'stale_ignored':'no_action',authority:'adaptive_programming'}};
  const best=evidence.bestDose,worst=evidence.worstDose,separation=Number(evidence.separation||0),currentSets=Number(base.workingSets||0);let workingSets=currentSets,status=base.status,reason=base.reason,decision='evidence_considered';
  if(evidence.state==='supported'&&best&&worst&&separation>=.15){const targetSets=setsFor(best.dose.volume);if(targetSets&&currentSets>targetSets){workingSets=targetSets;decision='reduce_to_supported_volume';reason=`Adaptive Programming reduced this exposure to ${targetSets} working sets because repeated athlete-specific outcomes were stronger at ${best.dose.volume} volume than the higher observed dose.`;}
   if(best.dose.pressure==='conservative'&&worst.dose.pressure==='progressive'&&status==='increase'){status='evidence_hold';decision=decision==='reduce_to_supported_volume'?'reduce_volume_and_hold_load':'hold_progression_pressure';reason='Adaptive Programming is holding the load increase because this athlete has repeatedly performed better under conservative progression pressure than under progressive pressure.';}
  }
  return {...base,workingSets,status,reason,adaptiveDoseV82:{version:VERSION,decision,authority:'adaptive_programming',coachDoseState:evidence.state,bestDose:best?.dose||null,separation,neverIncreaseSetsFromDoseEvidence:true,neverIncreaseLoadFromDoseEvidence:true}};
 }
 function legacyInstall(name,marker,factory,attempt=0){const base=window[name];if(typeof base!=='function'){if(attempt<100&&typeof setTimeout==='function')setTimeout(()=>legacyInstall(name,marker,factory,attempt+1),100);return false}if(base[marker])return true;const wrapped=factory(base);wrapped[marker]=true;wrapped[`${marker}Base`]=base;window[name]=wrapped;return true}
 function install(){const wrap=core?.installWrapper?((name,marker,factory,options={})=>core.installWrapper(name,marker,factory,options)):((name,marker,factory)=>legacyInstall(name,marker,factory));return wrap('prismAdaptivePrescription','__myliftcoachDoseV82',base=>function(){return arbitrate(base.apply(this,arguments))},{maxAttempts:100,delayMs:100});}
 function audit(){return {version:VERSION,authority:'adaptive_programming',guardrails:{coachDoseAdvisoryOnly:true,requiresStrongSeparation:true,neverIncreaseSetsFromDoseEvidence:true,neverIncreaseLoadFromDoseEvidence:true,staleDoseIgnored:true,recoveryFatiguePlateauLayersPreserved:true,noProgramReplacement:true,adaptiveProgrammingFinalAuthority:true}}}
 window.myliftcoachAdaptiveDoseArbitrate=arbitrate;window.myliftcoachAdaptiveDoseAudit=audit;window.MYLIFTCOACH_ADAPTIVE_DOSE_VERSION=VERSION;install();
})();
