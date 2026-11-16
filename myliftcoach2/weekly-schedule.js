/* MYLIFTCOACH 2.0 weekly schedule — local preview only; original data untouched. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCWeeklySchedule=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const defaultAssignments=['upper-a','lower-a',null,'upper-b','lower-b',null,null];
function cleanPlan(raw,validExercises){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.ids))throw Error('Valid workout exercises required');
 const ids=[...new Set(raw.ids.map(String))].filter(id=>validExercises.includes(id));
 if(!ids.length||ids.length>40)throw Error('Choose at least one valid exercise');
 const title=String(raw.title||'').trim().slice(0,80);
 if(!title)throw Error('Workout name required');
 return {id:String(raw.id),title,kind:String(raw.kind||'Custom'),description:String(raw.description||'Your personal workout').slice(0,200),ids};
}
function normalize(raw,presets,validExercises){
 const presetIds=presets.map(x=>x.id),entries=Array.isArray(raw?.plans)?raw.plans:[];
 const plans=presets.map(plan=>({...plan,ids:plan.ids.slice()}));
 for(const entry of entries){
  try{
   const p=cleanPlan(entry,validExercises);
   const ix=plans.findIndex(item=>item.id===p.id);
   if(ix>=0)plans[ix]=p;
   else if(p.id.startsWith('custom-')&&plans.length<55)plans.push(p);
  }catch{}
 }
 const allowed=new Set(plans.map(x=>x.id));
 const assigned=Array.isArray(raw?.assigned)&&raw.assigned.length===7?raw.assigned:defaultAssignments;
 const days=assigned.map(id=>id===null?null:allowed.has(id)?id:null);
 return {plans,assigned:days};
}
function dayIndex(date=new Date()){
 const d=date instanceof Date?date:new Date(date);
 if(!Number.isFinite(d.getTime()))throw Error('Invalid day');
 return (d.getDay()+6)%7;
}
function resolve(state,date=new Date()){
 const day=dayIndex(date),id=state.assigned[day];
 return {day,index:day,dayName:DAYS[day],plan:id?state.plans.find(p=>p.id===id)||null:null};
}
function assign(state,day,id){
 if(!Number.isInteger(day)||day<0||day>6)throw Error('Invalid weekday');
 if(id!==null&&!state.plans.some(p=>p.id===id))throw Error('Workout not found');
 return {...state,assigned:state.assigned.map((value,i)=>i===day?id:value)};
}
function edit(state,id,changes,validExercises){
 const index=state.plans.findIndex(p=>p.id===id);
 if(index<0)throw Error('Workout not found');
 const plan=cleanPlan({...state.plans[index],...changes,id},validExercises);
 return {...state,plans:state.plans.map((p,i)=>i===index?plan:p)};
}
function add(state,id,changes,validExercises){
 if(state.plans.some(p=>p.id===id)||!/^custom-[a-zA-Z0-9-]{3,90}$/.test(id))throw Error('Unique custom workout ID required');
 const plan=cleanPlan({...changes,id,kind:'Custom'},validExercises);
 return {...state,plans:[...state.plans,plan]};
}
function saved(state,presetIds){
 return {version:1,plans:state.plans.map(p=>({...p,ids:p.ids.slice()})),assigned:state.assigned.slice()};
}
function ownerKey(base,owner){
 if(!base||typeof base!=='string')throw Error('Schedule storage key required');
 if(owner==null)return base+':guest';
 if(!/^[a-zA-Z0-9_-]{8,128}$/.test(String(owner)))throw Error('Verified owner identifier required');
 return base+':account:'+owner;
}
function loadOwned(storage,base,owner,presets,validExercises){
 const key=ownerKey(base,owner);
 let serialized=null;
 try{serialized=storage.getItem(key)}catch{throw Error('Schedule storage unavailable')}
 if(serialized==null)return normalize(null,presets,validExercises);
 let input;
 try{input=JSON.parse(serialized)}catch{throw Error('Saved account schedule is unreadable; refuse preset overwrite')}
 if(!input||input.version!==1||!Array.isArray(input.plans)||!Array.isArray(input.assigned)||input.assigned.length!==7)throw Error('Saved schedule format invalid');
 const allowed=new Set(presets.map(x=>x.id));
 for(const p of input.plans||[])if(p&&typeof p.id==='string')allowed.add(p.id);
 // Refuse silent replacement when a linked custom plan was removed/corrupted.
 for(const id of input.assigned)if(id!=null&&!allowed.has(id))throw Error('Saved workout assignment is missing');
 return normalize(input,presets,validExercises);
}
function commitOwned(storage,base,owner,state,presetIds){
 return commit(storage,ownerKey(base,owner),state,presetIds);
}
function commit(storage,key,state,presetIds){
 const serialized=JSON.stringify(saved(state,presetIds));
 storage.setItem(key,serialized);
 if(storage.getItem(key)!==serialized)throw Error('Workout schedule was not saved');
 return state;
}
return Object.freeze({DAYS,normalize,dayIndex,resolve,assign,edit,add,saved,commit,ownerKey,loadOwned,commitOwned});
});
