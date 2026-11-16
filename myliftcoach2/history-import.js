/* Read-only, account-scoped import of original workoutHistoryV52; never writes or stores history. */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('../persistence/storage-model.js'):root.PRISMStorageModel);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCOriginalHistory=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(model){
 'use strict';
 const source='workoutHistoryV52';
 const tables=['sources','sessions','session_exercises','sets'];
 function normalizedSession(item){
  if(!item||!Array.isArray(item.exercises)||!Number.isFinite(Date.parse(item.date)))return null;
  const exercises=item.exercises.filter(ex=>ex&&Array.isArray(ex.sets)).map(ex=>({
   id:String(ex.id||''),name:String(ex.name||ex.id||'Exercise'),
   sets:ex.sets.filter(s=>s&&Number.isFinite(Number(s.weight))&&Number(s.weight)>0&&Number.isFinite(Number(s.reps))&&Number(s.reps)>0).map(s=>({set:s.set,weight:Number(s.weight),reps:Number(s.reps),completed:s.completed!==false}))
  })).filter(ex=>ex.sets.length);
  if(!exercises.length)return null;
  return {id:item.id,date:item.date,workoutKey:String(item.workoutKey||''),workoutTitle:String(item.workoutTitle||'Workout'),durationMinutes:item.durationMinutes,readiness:['Great','Normal','Tired'].includes(item.readiness)?item.readiness:null,recordIds:Array.isArray(item.recordIds)?item.recordIds:[],exercises};
 }
 async function load({endpoint,publishableKey,accessToken,userId,fetcher=fetch,maxPages=100}){
  if(!model?.restoreSnapshot)throw Error('Original storage model unavailable');
  if(!/^https:\/\//.test(endpoint||'')||!publishableKey||!accessToken||!userId)throw Error('Authenticated account required');
  const rows=[];
  for(const table of tables){
   for(let page=0;page<maxPages;page++){
    const url=new URL('/rest/v1/prism_account_'+table,endpoint);
    url.searchParams.set('user_id','eq.'+userId);
    url.searchParams.set('source_key','eq.'+source);
    url.searchParams.set('select','*');
    url.searchParams.set('order','id');
    url.searchParams.set('limit','500');
    url.searchParams.set('offset',String(page*500));
    const response=await fetcher(url.toString(),{method:'GET',cache:'no-store',headers:{apikey:publishableKey,Authorization:'Bearer '+accessToken,Accept:'application/json'}});
    if(!response.ok)throw Error('History read failed ('+response.status+'). No data was changed.');
    const group=await response.json();
    if(!Array.isArray(group))throw Error('Unexpected history response');
    for(const row of group){
     if(row?.user_id!==userId||row?.source_key!==source)throw Error('History account ownership mismatch');
     rows.push({...row,table});
    }
    if(group.length<500)break;
    if(page===maxPages-1)throw Error('History exceeds safe preview limit; no partial import shown');
   }
  }
  if(!rows.length)return [];
  const snapshot=model.restoreSnapshot(rows);
  const raw=snapshot[source];
  if(typeof raw!=='string')throw Error('Incomplete original history snapshot');
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed))throw Error('Original history has an unexpected format');
  const result=parsed.map(normalizedSession).filter(Boolean);
  if(result.length!==parsed.length)throw Error('Original history has unsupported records; import not displayed');
  return result.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
 }
 return Object.freeze({load,normalizedSession});
});
