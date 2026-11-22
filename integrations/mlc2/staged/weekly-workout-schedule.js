/* MYLIFTCOACH 2.0 weekly workout schedule.
   Explicit "Use for today" always wins. Schedule is the next priority; then custom
   routines, then original presets. Browser-only and account-independent. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLC2WeeklySchedule=api;
})(globalThis,function(){
'use strict';
const KEY='mlc2-weekly-schedule-v1',SELECTED='mlc2-selected-workout-v1';
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ID=/^[a-z0-9][a-z0-9-]{0,99}$/;
function valid(map){
 if(!map||typeof map!=='object'||Array.isArray(map))return false;
 const entries=Object.entries(map);
 return entries.length<=7&&entries.every(([day,id])=>/^[0-6]$/.test(day)&&typeof id==='string'&&ID.test(id));
}
function read(storage){
 try{const raw=storage.getItem(KEY);if(raw===null)return {};
  const value=JSON.parse(raw);return valid(value)?value:{};
 }catch{return {}}
}
function save(storage,map){
 if(!valid(map))throw Error('Invalid weekly workout schedule');
 const json=JSON.stringify(map);
 storage.setItem(KEY,json);
 if(storage.getItem(KEY)!==json)throw Error('Weekly schedule was not retained');
 try{if(typeof window!=='undefined')window.MLC2ScheduleAuxSync?.()}catch{}
 return map;
}
function assign(storage,day,id,plans){
 const dayIndex=Number(day);
 if(!Number.isInteger(dayIndex)||dayIndex<0||dayIndex>6)throw Error('Unknown weekday');
 if(id!==''&&(!ID.test(String(id))||!plans.some(p=>p.id===id)))throw Error('Unknown workout');
 const next={...read(storage)};if(id==='')delete next[String(dayIndex)];else next[String(dayIndex)]=id;
 return save(storage,next);
}
function resolve({presets=[],custom=[],sessionsCompleted=0,storage,date=new Date()}){
 const plans=[...custom,...presets];
 if(!plans.length)return null;
 const selected=storage.getItem(SELECTED)||'';
 const explicitlyChosen=plans.find(p=>p.id===selected);
 if(explicitlyChosen)return {...explicitlyChosen,scheduleSource:'manual'};
 const currentDay=date.getDay();
 const scheduled=plans.find(p=>p.id===read(storage)[String(currentDay)]);
 if(scheduled)return {...scheduled,scheduleSource:'weekly'};
 const fallback=custom[0]||presets[sessionsCompleted%presets.length]||plans[0];
 return {...fallback,scheduleSource:'default'};
}
function clearOverride(storage){
 storage.removeItem(SELECTED);
 if(storage.getItem(SELECTED)!==null)throw Error('Unable to clear manual selection');
 try{if(typeof window!=='undefined')window.MLC2ScheduleAuxSync?.()}catch{}
}
function render(root,{presets,custom,storage,onChanged,doc=document}){
 if(!root)return;
 const plans=[...custom,...presets],map=read(storage);
 root.replaceChildren();
 const description=doc.createElement('p');
 description.textContent='Choose a workout for each weekday. Your manual “Use for today” choice takes priority until you select “Follow weekly schedule”.';
 root.append(description);
 const grid=doc.createElement('div');grid.className='mlc-weekly-schedule-grid';
 DAYS.forEach((name,index)=>{
  const label=doc.createElement('label');label.textContent=name;
  const select=doc.createElement('select');
  select.setAttribute('aria-label',name+' workout');
  const none=doc.createElement('option');none.value='';none.textContent='No scheduled workout';select.append(none);
  for(const p of plans){const option=doc.createElement('option');option.value=p.id;option.textContent=p.title;select.append(option)}
  select.value=map[String(index)]&&plans.some(p=>p.id===map[String(index)])?map[String(index)]:'';
  select.addEventListener('change',()=>{
   try{assign(storage,index,select.value,plans);onChanged?.()}
   catch(e){select.value=read(storage)[String(index)]||'';status.textContent='Could not save schedule: '+e.message}
  });
  label.append(select);grid.append(label);
 });
 root.append(grid);
 const button=doc.createElement('button');button.type='button';button.className='button-outline';
 button.textContent='Follow weekly schedule (clear manual selection)';
 button.addEventListener('click',()=>{try{clearOverride(storage);onChanged?.()}catch(e){status.textContent=e.message}});
 root.append(button);
 const status=doc.createElement('p');status.setAttribute('role','status');status.className='mlc-schedule-note';root.append(status);
}
return Object.freeze({KEY,DAYS,valid,read,save,assign,resolve,clearOverride,render});
});