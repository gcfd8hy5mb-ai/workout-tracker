/* MYLIFTCOACH 2.0 redesign bridge — single-app, read-only stage.
 * Uses the existing redesign account's in-memory workout history. Never writes
 * local storage, changes selections, migrates records, or contacts cloud.
 */
(function(){
'use strict';
function el(id){return document.getElementById(id)}
function valid(s){return s&&s.weight!==''&&s.weight!=null&&s.reps!==''&&s.reps!=null&&Number.isFinite(Number(s.weight))&&Number(s.weight)>0&&Number(s.weight)<=1500&&Number.isInteger(Number(s.reps))&&Number(s.reps)>=1&&Number(s.reps)<=100}
function sessions(){
 if(typeof workoutHistory==='undefined'||!Array.isArray(workoutHistory))return [];
 return workoutHistory.filter(s=>s&&Array.isArray(s.exercises)).map(s=>({
  id:String(s.id||s.date||''),created:s.date||null,title:String(s.workoutTitle||'Saved workout'),
  planId:s.workoutKey||null,
  sets:s.exercises.flatMap(e=>(Array.isArray(e.sets)?e.sets:[]).filter(valid).map(t=>({exerciseId:e.id,weight:Number(t.weight),reps:Number(t.reps)})))
 }));
}
function volumeAudit(saved){
 const root=el('mlc2RedesignAudit');root.replaceChildren();
 const total=saved.reduce((n,s)=>n+s.sets.reduce((v,t)=>v+t.weight*t.reps,0),0);
 const count=saved.reduce((n,s)=>n+s.sets.length,0);
 const summary=document.createElement('p');summary.className='mlc2-bridge-volume';
 summary.textContent=saved.length+' completed sessions · '+count+' valid weighted sets · '+total.toLocaleString()+' lb logged training volume';
 root.append(summary);
 const note=document.createElement('p');note.className='small';
 note.textContent='Read-only calculation from saved redesign workout history. Each valid weighted set contributes weight × reps. No data is rewritten.';
 root.append(note);
 const list=document.createElement('div');list.className='mlc2-bridge-history';
 for(const s of saved.slice(0,8)){
  const details=document.createElement('details'),summary=document.createElement('summary');
  const volume=s.sets.reduce((n,t)=>n+t.weight*t.reps,0);
  summary.textContent=s.title+' · '+volume.toLocaleString()+' lb · '+s.sets.length+' weighted sets';
  details.append(summary);
  const lines=document.createElement('ol');
  for(const set of s.sets){
   const li=document.createElement('li');li.textContent=(window.MLC2_EXERCISE_CATALOG?.find(e=>e.id===set.exerciseId)?.name||set.exerciseId)+' · '+set.weight+' lb × '+set.reps+' = '+(set.weight*set.reps).toLocaleString()+' lb';
   lines.append(li);
  }
  if(!s.sets.length){const text=document.createElement('p');text.textContent='No valid weighted sets in this session.';details.append(text)}
  else details.append(lines);
  list.append(details);
 }
 root.append(list);
}
function catalogExercises(){
 const entries=window.MLC2_EXERCISE_CATALOG;
 return Array.isArray(entries)?entries.filter(e=>e&&typeof e.id==='string'&&typeof e.name==='string'&&typeof e.group==='string'):[];
}
let libraryVisible=24;
function renderExerciseLibrary(){
 const root=el('mlc2ExerciseList'),count=el('mlc2ExerciseCount');
 if(!root||!count)return;
 const all=catalogExercises();
 const query=(el('mlc2ExerciseSearch')?.value||'').toLocaleLowerCase().trim();
 const group=el('mlc2MuscleGroup')?.value||'all';
 const found=all.filter(e=>(group==='all'||e.group===group)&&
  (!query||(e.name+' '+e.group+' '+String(e.equipment||'')).toLocaleLowerCase().includes(query)));
 count.textContent=found.length+' of '+all.length+' available exercises · text instructions only';
 root.replaceChildren();
 const preview=found.slice(0,libraryVisible);
 if(!preview.length){
  const empty=document.createElement('p');empty.className='small';empty.textContent='No exercises match your filters.';root.append(empty);return;
 }
 for(const exercise of preview){
  const item=document.createElement('details');item.className='mlc2-exercise-item';
  const title=document.createElement('summary');title.textContent=exercise.name+' · '+exercise.group+
    (exercise.equipment?' · '+exercise.equipment:'');
  item.append(title);
  const description=document.createElement('div');description.className='mlc2-exercise-description';
  const sections=[['How to perform',exercise.how],['Technique cue',exercise.cue],['Tips',exercise.tips],['Common mistakes',exercise.mistakes]];
  for(const [label,value] of sections){
   if(value==null||value==='')continue;
   const h=document.createElement('strong');h.textContent=label;description.append(h);
   if(Array.isArray(value)){
    const list=document.createElement('ul');
    for(const part of value.slice(0,12)){if(typeof part!=='string'||!part.trim())continue;
      const li=document.createElement('li');li.textContent=part;list.append(li)}
    if(list.children.length)description.append(list);
   }else{
    const p=document.createElement('p');p.textContent=String(value);description.append(p);
   }
  }
  const imageStatus=document.createElement('p');imageStatus.className='small';
  imageStatus.textContent='Approved exercise demonstration: awaiting secure media integration.';
  description.append(imageStatus);item.append(description);root.append(item);
 }
 if(found.length>libraryVisible){
  const more=document.createElement('button');more.type='button';more.className='action-button';
  more.textContent='Show next '+Math.min(24,found.length-libraryVisible)+' exercises';
  more.addEventListener('click',()=>{libraryVisible+=24;renderExerciseLibrary()});
  root.append(more);
 }
}
function initializeExerciseLibrary(){
 const search=el('mlc2ExerciseSearch'),group=el('mlc2MuscleGroup');
 if(search&&!search.dataset.mlc2Ready){
  search.dataset.mlc2Ready='yes';
  search.addEventListener('input',()=>{libraryVisible=24;renderExerciseLibrary()});
  group?.addEventListener('change',()=>{libraryVisible=24;renderExerciseLibrary()});
 }
 renderExerciseLibrary();
}
window.showMLC2Integration=function(){
 if(typeof showScreen!=='function')return;
 showScreen('mlc2IntegrationScreen');
 if(typeof setBottomNav==='function')setBottomNav('Workout');
 const data=sessions();volumeAudit(data);
 initializeExerciseLibrary();
 const root=el('mlc2RedesignProgram');root.replaceChildren();
 const isPro=typeof effectivePrismTier==='function'&&['pro','lifetime_pro'].includes(effectivePrismTier());
 const status=el('mlc2IntegrationStatus');
 status.textContent='Existing redesign records: '+data.length+' · 344-exercise catalog: '+(window.MLC2_EXERCISE_CATALOG?.length||0)+'.';
 if(!isPro){const note=document.createElement('p');note.className='small';note.textContent='Adaptive program generation is available in Pro beta mode. Switch modes under Profile. Your saved history remains visible below.';root.append(note);return}
 if(!window.MLC2ProgramBuilder){root.textContent='Program generator not loaded. Your saved workouts are unaffected.';return}
 window.MLC2ProgramBuilder.render(root,window.MLC2_EXERCISE_CATALOG||[],data,{mode:'pro'});
};
})();
