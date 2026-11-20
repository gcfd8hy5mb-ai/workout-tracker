/* MYLIFTCOACH 2.0 — secure read-only profile and training goal import.
   Local entitlement values are deliberately excluded. */
(function(root,factory){
 const model=typeof module==='object'&&module.exports?require('../persistence/storage-model.js'):root.PRISMStorageModel;
 const api=factory(model);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCOriginalAccountSettings=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(model){
'use strict';
const sources=Object.freeze([{key:'prismLocalProfileV1',table:'profile'}, {key:'workoutGoalsV1',table:'goals'}]);
function clean(profile,goals){
 const p=profile&&typeof profile==='object'&&!Array.isArray(profile)?profile:{};
 const g=goals&&typeof goals==='object'&&!Array.isArray(goals)?goals:{};
 const displayName=typeof p.displayName==='string'?p.displayName.slice(0,100):'';
 return {
  displayName,avatarId:['prism','blue','teal','violet'].includes(p.avatarId)?p.avatarId:'prism',
  onboardingComplete:p.onboardingComplete===true,
  trainingGoal:['muscle','strength','fat-loss','consistency'].includes(g.goal)?g.goal:null,
  days:[2,3,4,5].includes(Number(g.days))?Number(g.days):null,
  trainingFocus:['balanced','upper','lower'].includes(g.focus)?g.focus:null,
  workoutMode:g.basic===true?'basic':g.skipped===true?'skipped':'personalized'
 };
}
async function load({endpoint,publishableKey,accessToken,userId,fetcher=fetch,maxPages=100}){
 if(!model?.restoreSnapshot||!/^https:\/\//.test(endpoint||'')||!publishableKey||!accessToken||!userId)throw Error('Verified account required');
 const snapshot=Object.create(null);
 for(const {key,table} of sources){
  const rows=[];
  for(const tableName of ['sources',table]){
   for(let page=0;page<maxPages;page++){
    const url=new URL('/rest/v1/prism_account_'+tableName,endpoint);
    for(const [k,v] of [['user_id','eq.'+userId],['source_key','eq.'+key],['select','*'],['order','id'],['limit','500'],['offset',String(page*500)]])url.searchParams.set(k,v);
    const response=await fetcher(url.toString(),{method:'GET',cache:'no-store',headers:{apikey:publishableKey,Authorization:'Bearer '+accessToken,Accept:'application/json'}});
    if(!response.ok)throw Error('Account profile read failed ('+response.status+')');
    const list=await response.json();if(!Array.isArray(list))throw Error('Invalid account profile response');
    for(const row of list){if(row?.user_id!==userId||row?.source_key!==key)throw Error('Account profile ownership mismatch');rows.push({...row,table:tableName});}
    if(list.length<500)break;
    if(page===maxPages-1)throw Error('Profile read exceeded safe limit');
   }
  }
  if(!rows.length)continue;
  const restored=model.restoreSnapshot(rows);
  if(typeof restored[key]!=='string')throw Error('Incomplete original account settings');
  snapshot[key]=JSON.parse(restored[key]);
 }
 if(!Object.keys(snapshot).length)return null; // No original record is not a restored profile.
 return clean(snapshot.prismLocalProfileV1,snapshot.workoutGoalsV1);
}
return Object.freeze({clean,load});
});
