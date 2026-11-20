/* Non-destructive MYLIFTCOACH 2.0 cloud migration inventory.
 * Counts only owner-verified, successfully loaded data; missing sections
 * block a production cutover. This module has no storage/network writes.
 */
(function(root,factory){const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCV2CloudInventory=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function inspect({owner=null,historyOwner=null,trackingOwner=null,settingsOwner=null,
  scheduleOwner=null,history=null,tracking=null,settings=null,schedule=null,
  localSessions=null,cloudScheduleRpcVerified=false,cloudWritesVerified=false}={}){
  const signedIn=typeof owner==='string'&&owner.length>0;
  const historyReady=signedIn&&historyOwner===owner&&Array.isArray(history);
  const trackingReady=signedIn&&trackingOwner===owner&&tracking!==null&&typeof tracking==='object';
  const settingsReady=signedIn&&settingsOwner===owner&&settings!==null&&typeof settings==='object';
  const scheduleReady=signedIn&&scheduleOwner===owner&&schedule!==null&&
   Array.isArray(schedule.plans);
  const local=Array.isArray(localSessions)?localSessions.length:0;
  const groups=Object.freeze([
   Object.freeze({key:'history',label:'Original workout history',loaded:historyReady,count:historyReady?history.length:null}),
   Object.freeze({key:'tracking',label:'Original daily tracking',loaded:trackingReady,count:null}),
   Object.freeze({key:'settings',label:'Original profile and goals',loaded:settingsReady,count:null}),
   Object.freeze({key:'schedule',label:'Original custom workouts',loaded:scheduleReady,count:scheduleReady?schedule.plans.length:null})
  ]);
  const loaded=groups.filter(x=>x.loaded).length;
  const blockers=[];
  if(!signedIn)blockers.push('Sign in to the existing PRISM account');
  if(loaded!==4)blockers.push('Load all four original account sections read-only');
  if(!cloudScheduleRpcVerified)blockers.push('Verify the 2.0 schedule RPC and revision conflict protection');
  if(!cloudWritesVerified)blockers.push('Complete authenticated, owner-isolated save and read-back acceptance');
  if(local>0)blockers.push('Review '+local+' local 2.0 workout(s) before migrating to prevent loss or duplication');
  return Object.freeze({signedIn,groups,loaded,total:4,localWorkouts:local,
   cloudScheduleRpcVerified:cloudScheduleRpcVerified===true,
   cloudWritesVerified:cloudWritesVerified===true,
   readyForReplacement:blockers.length===0,
   blockers:Object.freeze(blockers),
   notice:'Read-only inventory; loading source records does not sync or overwrite them.'});
 }
 return Object.freeze({inspect});
});
