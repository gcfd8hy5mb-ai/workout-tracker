/* MYLIFTCOACH Intelligence Account Boundary v1
   Personalized learning/Coach/Adaptive reads fail closed unless the verified Supabase user
   matches the selected account-scoped device store. */
(()=>{
 'use strict';
 const VERSION='1.0';
 let epoch=0;
 const unavailable=(kind='account_unverified')=>({version:VERSION,state:'unavailable',reason:kind,accountBound:true,mayOverrideAdaptive:false});
 function current(){
  const manager=window.PRISMDeviceStore||null,owner=manager?.owner||null,verified=window.MYLIFTCOACH_VERIFIED_ACCOUNT_ID||null;
  const valid=Boolean(owner&&verified&&owner===verified&&!manager?.stale);
  return {version:VERSION,valid,owner,verified,stale:Boolean(manager?.stale),epoch};
 }
 function verify(userId){
  const manager=window.PRISMDeviceStore,id=String(userId||'');
  if(!manager?.owner||manager.owner!==id||manager.stale)throw Error('Verified account does not match the active MYLIFTCOACH account');
  window.MYLIFTCOACH_VERIFIED_ACCOUNT_ID=id;epoch++;return current();
 }
 function invalidate(reason='account_changed'){
  window.MYLIFTCOACH_VERIFIED_ACCOUNT_ID=null;epoch++;
  try{window.dispatchEvent(new CustomEvent('myliftcoach-intelligence-account-invalidated',{detail:{reason,epoch}}))}catch{}
  return current();
 }
 function token(){const s=current();return s.valid?Object.freeze({userId:s.owner,epoch:s.epoch}):null;}
 function isTokenCurrent(t){const s=current();return Boolean(t&&s.valid&&t.userId===s.owner&&t.epoch===s.epoch);}
 function guarded(base,fallback,args,ctx){const t=token();if(!t)return typeof fallback==='function'?fallback():fallback;const result=base.apply(ctx,args);return isTokenCurrent(t)?result:(typeof fallback==='function'?fallback():fallback);}
 function wrap(name,fallback){
  const base=window[name];if(typeof base!=='function'||base.__myliftcoachAccountBound)return;
  const wrapped=function(){return guarded(base,fallback,arguments,this)};
  wrapped.__myliftcoachAccountBound=true;wrapped.__myliftcoachAccountBoundBase=base;window[name]=wrapped;
 }
 function install(){
  wrap('prismInterventionRows',()=>[]);
  for(const name of ['prismRememberIntervention','prismInterventionRespond','prismInterventionOutcome'])wrap(name,()=>null);
  for(const name of ['myliftcoachCoachExerciseContextEvidence','myliftcoachCoachProposalContextEvidence','myliftcoachCoachDoseExplain','myliftcoachCoachDoseProposalSummary','myliftcoachCoachRecoveryExplain','myliftcoachCoachRecoveryProposalEvidence'])wrap(name,()=>unavailable());
  wrap('prismCoachProgramReview',()=>unavailable());
  wrap('prismAdaptivePrescription',()=>({status:'account_hold',targetWeight:null,workingSets:null,reason:'Personalized programming is paused until this account is verified.',authority:'adaptive_programming',accountBoundary:unavailable()}));
 }
 const api=Object.freeze({version:VERSION,current,verify,invalidate,token,isTokenCurrent,install,unavailable});
 window.myliftcoachIntelligenceAccountBoundary=api;
 window.MYLIFTCOACH_INTELLIGENCE_ACCOUNT_BOUNDARY_VERSION=VERSION;
 install();
 window.addEventListener?.('myliftcoach-account-verified',event=>{try{verify(event.detail?.userId);install()}catch{invalidate('verification_mismatch')}});
 window.addEventListener?.('myliftcoach-account-invalidated',event=>invalidate(event.detail?.reason||'account_changed'));
})();