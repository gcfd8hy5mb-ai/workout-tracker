/* MYLIFTCOACH 2.0 — deterministic, optional Pro program-builder preview.
 * Uses the released exercise catalog and completed session history only.
 * Never saves/replaces a workout, guesses a load, or calls cloud APIs.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLC2ProgramBuilder=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const GOALS=['balanced','strength','muscle'];
const EQUIPMENT=['Any','Machine','Dumbbell','Bodyweight','Cable','Barbell'];
const DAYS=[3,4,5];
const SPLITS={
 3:[['Chest','Back','Shoulders','Arms','Core'],['Legs','Legs','Core','Back'],['Chest','Back','Legs','Shoulders','Arms']],
 4:[['Chest','Back','Shoulders','Arms'],['Legs','Legs','Core','Legs'],['Back','Chest','Arms','Shoulders'],['Legs','Legs','Core','Back']],
 5:[['Chest','Chest','Shoulders','Arms'],['Back','Back','Arms','Core'],['Legs','Legs','Core','Legs'],['Chest','Back','Shoulders','Arms'],['Legs','Legs','Core','Back']]
};
const LABELS={balanced:'Balanced training',strength:'Strength emphasis',muscle:'Muscle-building emphasis'};
function normalizeOptions(options={}){
 return {goal:GOALS.includes(options.goal)?options.goal:'balanced',
  days:DAYS.includes(Number(options.days))?Number(options.days):4,
  equipment:EQUIPMENT.includes(options.equipment)?options.equipment:'Any'};
}
function historyCounts(sessions){
 const counts=new Map();
 for(const session of Array.isArray(sessions)?sessions:[]){
  if(!session||!Array.isArray(session.sets))continue;
  for(const set of session.sets){
   if(!set||typeof set.exerciseId!=='string')continue;
   if(set.weight==null||String(set.weight).trim()===''||set.reps==null||String(set.reps).trim()==='')continue;
   const w=Number(set.weight),r=Number(set.reps);
   if(!Number.isFinite(w)||w<0||w>1500||!Number.isInteger(r)||r<1||r>100)continue;
   counts.set(set.exerciseId,(counts.get(set.exerciseId)||0)+1);
  }
 }
 return counts;
}
function build(catalog,sessions,options={}){
 const opts=normalizeOptions(options);
 if(!Array.isArray(catalog))return {status:'unavailable',days:[],options:opts};
 const usage=historyCounts(sessions);
 const valid=catalog.filter(e=>e&&typeof e.id==='string'&&e.id&&typeof e.name==='string'&&
  ['Chest','Back','Shoulders','Arms','Legs','Core'].includes(e.group)&&
  typeof e.equipment==='string'&&
  (opts.equipment==='Any'||e.equipment.toLowerCase().includes(opts.equipment.toLowerCase())));
 const unique=[...new Map(valid.map(e=>[e.id,e])).values()];
 // Familiar exercises take precedence only when they were actually logged.
 // Catalog order is the deterministic fallback. No invented weight or preference data.
 const ordered=unique.map((e,i)=>({e,i,n:usage.get(e.id)||0}))
  .sort((a,b)=>b.n-a.n||a.i-b.i).map(x=>x.e);
 const scheduled=SPLITS[opts.days].map((groups,idx)=>{
  const chosen=[],used=new Set();
  for(const group of groups){
   const eligible=ordered.filter(e=>e.group===group&&!used.has(e.id));
   // Alternate across sessions to avoid silently repeating the same exact choices.
   const rotated=eligible.length?eligible[idx%eligible.length]:null;
   if(!rotated)continue;
   chosen.push({id:rotated.id,name:rotated.name,group:rotated.group,equipment:rotated.equipment,
    sets:opts.goal==='strength'?3:opts.goal==='muscle'?3:2,
    reps:opts.goal==='strength'?'5–8':opts.goal==='muscle'?'8–12':'8–12',
    weight:null});
   used.add(rotated.id);
  }
  return {day:idx+1,exercises:chosen,missing:groups.length-chosen.length};
 });
 const count=scheduled.reduce((n,d)=>n+d.exercises.length,0);
 return {status:count?'ready':'unavailable',options:opts,days:scheduled,exerciseCount:count,
  limited:scheduled.some(d=>d.missing>0),usedLoggedHistory:usage.size>0};
}
function render(root,catalog,sessions,options={}){
 if(!root)return;
 root.replaceChildren();
 if(options.mode!=='pro')return;
 let settings=normalizeOptions(options.initial);
 const create=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
 const intro=create('p','coach-program-disclaimer','Optional suggested routine from the 344-exercise catalog. Your Home workout and custom routines are never replaced. No weights are assigned automatically.');
 const settingsArea=create('div','coach-program-options');
 const controls=[['goal','Training focus',GOALS.map(v=>[v,LABELS[v]])],['days','Days per week',DAYS.map(v=>[String(v),v+' days'])],['equipment','Available equipment',EQUIPMENT.map(v=>[v,v])]];
 const inputMap={};
 for(const [key,title,choices] of controls){
  const label=create('label','coach-program-label',title),select=create('select','coach-program-select');
  select.setAttribute('aria-label',title);
  for(const [value,name] of choices){const o=document.createElement('option');o.value=value;o.textContent=name;select.append(o)}
  select.value=String(settings[key]);label.append(select);settingsArea.append(label);inputMap[key]=select;
 }
 const status=create('p','coach-program-status');
 const daysRoot=create('div','coach-program-days');
 function redraw(){
  settings=normalizeOptions({goal:inputMap.goal.value,days:inputMap.days.value,equipment:inputMap.equipment.value});
  const result=build(catalog,sessions,settings);
  daysRoot.replaceChildren();
  if(result.status!=='ready'){status.textContent='No matching exercises are available with this equipment filter. Choose another category.';return}
  status.textContent=result.exerciseCount+' exercise slots across '+result.days.length+' days.'+
   (result.limited?' Some requested movement groups do not have enough matching equipment options.':'')+
   (result.usedLoggedHistory?' Previously logged exercises are prioritized where available.':' No training history needed to preview.');
  for(const d of result.days){
   const details=create('details','coach-program-day');
   if(d.day===1)details.open=true;
   const summary=create('summary','', 'Day '+d.day+' · '+d.exercises.length+' movements');
   details.append(summary);
   const ul=create('ol','coach-program-exercises');
   for(const e of d.exercises){ul.append(create('li','',e.name+' · '+e.sets+' sets × '+e.reps+' reps · '+e.equipment))}
   if(!d.exercises.length)ul.append(create('li','', 'No matching exercises in this category.'));
   details.append(ul);daysRoot.append(details);
  }
 }
 for(const sel of Object.values(inputMap))sel.addEventListener('change',redraw);
 root.append(intro,settingsArea,status,daysRoot);
 const note=create('p','coach-program-disclaimer','Preview only. Confirm exercises, recovery, equipment and training loads yourself. Your custom workouts remain the selected priority on Home.');
 root.append(note);redraw();
}
return Object.freeze({GOALS,EQUIPMENT,DAYS,normalizeOptions,historyCounts,build,render});
});
