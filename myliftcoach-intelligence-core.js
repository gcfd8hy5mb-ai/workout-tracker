/* MYLIFTCOACH Intelligence Core v1
   Shared primitives for the Athlete -> Coach -> Adaptive intelligence pipeline.
   This module owns fail-closed account state, safe invocation, and authority metadata. */
(()=>{
 'use strict';
 const VERSION='1.0';
 const AUTHORITY='adaptive_programming';
 const safe=(fn,fallback=null)=>{try{const value=fn();return value==null?fallback:value}catch{return fallback}};
 const call=(name,args=[],fallback=null)=>typeof window[name]==='function'?safe(()=>window[name](...args),fallback):fallback;
 function account(){
  const boundary=window.myliftcoachIntelligenceAccountBoundary;
  if(boundary?.current)return boundary.current();
  const store=window.PRISMDeviceStore;
  if(store)return {valid:false,owner:store.owner||null,verified:null,stale:Boolean(store.stale),reason:'account_boundary_loading'};
  return {valid:true,owner:null,verified:null,stale:false,testUnbound:true};
 }
 function unavailable(reason='account_unverified'){
  return {state:'unavailable',reason,accountBound:true,authority:AUTHORITY,mayOverrideAdaptive:false};
 }
 function accountHold(reason='Personalized programming is paused until this account is verified.'){
  return {status:'account_hold',targetWeight:null,workingSets:null,reason,authority:AUTHORITY,accountBoundary:unavailable()};
 }
 function guardMetadata(extra={}){
  return Object.freeze({authority:AUTHORITY,mayOverrideAdaptive:false,preserveProgramSource:true,requiresApproval:true,...extra});
 }
 const api=Object.freeze({version:VERSION,authority:AUTHORITY,safe,call,account,unavailable,accountHold,guardMetadata});
 window.myliftcoachIntelligenceCore=api;
 window.MYLIFTCOACH_INTELLIGENCE_CORE_VERSION=VERSION;
})();
