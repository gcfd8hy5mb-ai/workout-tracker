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
function commit(storage,key,state,presetIds){
 const serialized=JSON.stringify(saved(state,presetIds));
 storage.setItem(key,serialized);
 if(storage.getItem(key)!==serialized)throw Error('Workout schedule was not saved');
 return state;
}
return Object.freeze({DAYS,normalize,dayIndex,resolve,assign,edit,add,saved,commit});
});
