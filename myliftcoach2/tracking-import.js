/* Authenticated, owner-checked read-only original dailyTrackingV1 retrieval.
   Does not mutate Supabase, guest data, account preferences, or demo sessions. */
(function(root,factory){
 const model=typeof module==='object'&&module.exports?require('../persistence/storage-model.js'):root.PRISMStorageModel;
 const api=factory(model);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCOriginalTracking=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(model){
 'use strict';
 const source='dailyTrackingV1',tables=['sources','tracking','tracking_entries','tracking_maps'];
 function safeNumber(value){const n=Number(value);return Number.isFinite(n)&&n>=0?n:0;}
 function validDay(value){
  if(typeof value!=='string'||!/^([0-9]{4})-(0[1-9]|1[0-2])-([0-9]{2})$/.test(value))return false;
  const date=new Date(value+'T12:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
 }
 function normalize(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid original tracking format');
  const asArray=x=>Array.isArray(x)?x:[];
  const water=asArray(raw.water).filter(x=>x&&validDay(x.day)&&safeNumber(x.amount)>0).map(x=>({day:x.day,amount:safeNumber(x.amount)}));
  const food=asArray(raw.food).filter(x=>x&&validDay(x.day)&&Number.isFinite(Number(x.calories))&&Number(x.calories)>=0).map(x=>({
   day:x.day,name:String(x.name||'Food'),calories:safeNumber(x.calories),
   protein:x.protein==null?null:safeNumber(x.protein),carbs:x.carbs==null?null:safeNumber(x.carbs),fat:x.fat==null?null:safeNumber(x.fat)
  }));
  const weight=asArray(raw.weight).filter(x=>x&&validDay(x.day)&&Number.isFinite(Number(x.value))&&Number(x.value)>0).map(x=>({day:x.day,value:Number(x.value)}));
  return {water,food,weight,waterGoal:safeNumber(raw.waterGoal),waterUnit:raw.waterUnit==='oz'?'oz':'ml',
   calorieGoal:raw.calorieGoal==null?null:safeNumber(raw.calorieGoal),calorieMode:raw.calorieMode==='auto'?'auto':raw.calorieMode==='manual'?'manual':null,
   savedMeals:asArray(raw.savedMeals).length,foodFavorites:asArray(raw.foodFavorites).length};
 }
 async function load({endpoint,publishableKey,accessToken,userId,fetcher=fetch,maxPages=100}){
  if(!model?.restoreSnapshot||!/^https:\/\//.test(endpoint||'')||!publishableKey||!accessToken||!userId)throw Error('Verified account and HTTPS connection required');
  const rows=[];
  for(const table of tables){
   for(let page=0;page<maxPages;page++){
    const url=new URL('/rest/v1/prism_account_'+table,endpoint);
    for(const [key,value] of [['user_id','eq.'+userId],['source_key','eq.'+source],['select','*'],['order','id'],['limit','500'],['offset',String(page*500)]])url.searchParams.set(key,value);
    const response=await fetcher(url.toString(),{method:'GET',cache:'no-store',headers:{apikey:publishableKey,Authorization:'Bearer '+accessToken,Accept:'application/json'}});
    if(!response.ok)throw Error('Original tracking read failed ('+response.status+'); nothing was changed');
    const list=await response.json();
    if(!Array.isArray(list))throw Error('Unexpected tracking response');
    for(const row of list){
     if(row?.user_id!==userId||row?.source_key!==source)throw Error('Original tracking owner mismatch');
     rows.push({...row,table});
    }
    if(list.length<500)break;
    if(page===maxPages-1)throw Error('Tracking data exceeds preview limit; no partial data shown');
   }
  }
  if(!rows.length)return null;
  const restored=model.restoreSnapshot(rows),raw=restored[source];
  if(typeof raw!=='string')throw Error('Incomplete original tracking snapshot');
  return normalize(JSON.parse(raw));
 }
 function monthSummary(tracking,month){
  if(!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(String(month||'')))return null;
  const group=(rows)=>Array.isArray(rows)?rows.filter(x=>validDay(x?.day)&&x.day.startsWith(month+'-')):[];
  const water=group(tracking?.water),food=group(tracking?.food),weight=group(tracking?.weight).slice().sort((a,b)=>b.day.localeCompare(a.day));
  const totalWater=water.reduce((sum,row)=>sum+row.amount,0);
  const calories=food.reduce((sum,row)=>sum+row.calories,0);
  return {month,waterEntries:water.length,foodEntries:food.length,weightEntries:weight.length,totalWater,calories,
   latestWeight:weight.length?{date:weight[0].day,value:weight[0].value}:null};
 }
 return Object.freeze({load,normalize,monthSummary});
});
