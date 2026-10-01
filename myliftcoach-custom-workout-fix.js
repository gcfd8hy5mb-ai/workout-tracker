// MYLIFTCOACH workout management fixes.
// Keeps the week strip tied to the active plan and allows existing custom workouts to be edited.
(() => {
  'use strict';

  let editingCustomIndex = null;

  const style = document.createElement('style');
  style.id = 'myliftcoachCustomWorkoutFixStyles';
  style.textContent = `
    #customButtons .myliftcoach-custom-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:stretch;margin-bottom:10px}
    #customButtons .myliftcoach-custom-row>.day-button{margin:0}
    #customButtons .myliftcoach-edit-workout{min-width:72px;border:1px solid var(--line);border-radius:13px;background:#17101f;color:#c77dff;font-weight:750;padding:0 14px}
    #customButtons .myliftcoach-edit-workout:active{background:#2d1640}
  `;
  document.head.appendChild(style);

  function planTitles(){
    try{
      if(typeof workoutGoals!=='undefined' && workoutGoals && !workoutGoals.skipped){
        if(workoutGoals.basic && typeof presetWorkouts!=='undefined'){
          return Object.values(presetWorkouts).map(day=>day?.title).filter(Boolean);
        }
        if(typeof suggestedWorkouts==='function'){
          return suggestedWorkouts(workoutGoals).map(day=>day?.title).filter(Boolean);
        }
      }
    }catch{}
    return [];
  }

  function scheduleSlots(count){
    if(count<=0)return [];
    if(count===1)return [0];
    if(count===2)return [0,3];
    if(count===3)return [0,2,4];
    if(count===4)return [0,1,3,4];
    if(count===5)return [0,1,2,3,4];
    if(count===6)return [0,1,2,3,4,5];
    return [0,1,2,3,4,5,6];
  }

  function syncWeekStrip(){
    const days=[...document.querySelectorAll('.lh-week .lh-day')];
    if(days.length!==7)return;
    const titles=planTitles();
    if(!titles.length)return;
    const labels=Array(7).fill('Rest');
    const slots=scheduleSlots(titles.length);
    titles.slice(0,slots.length).forEach((title,i)=>{labels[slots[i]]=title});
    days.forEach((day,i)=>{
      const label=day.querySelector('span');
      if(label)label.textContent=labels[i]||'Rest';
    });
  }

  function builderSaveButton(){
    return document.querySelector('#builderScreen .save-button');
  }

  const originalShowBuilder = window.showBuilder;
  if(typeof originalShowBuilder==='function'){
    window.showBuilder=function(...args){
      editingCustomIndex=null;
      const button=builderSaveButton();
      if(button)button.textContent='Save Workout';
      return originalShowBuilder.apply(this,args);
    };
  }

  window.editCustomWorkout=function(index){
    try{
      const workout=customWorkouts?.[index];
      if(!workout)return;
      editingCustomIndex=index;
      builderSelected=[...(workout.exercises||[])];
      const name=document.getElementById('customWorkoutName');
      const search=document.getElementById('builderSearch');
      if(name)name.value=workout.name||'';
      if(search)search.value='';
      if(typeof showScreen==='function')showScreen('builderScreen');
      if(typeof setBottomNav==='function')setBottomNav('Workouts');
      if(typeof renderBuilderSelected==='function')renderBuilderSelected();
      if(typeof renderBuilderLibrary==='function')renderBuilderLibrary();
      const button=builderSaveButton();
      if(button)button.textContent='Save Changes';
    }catch(error){console.error('MYLIFTCOACH custom workout edit failed',error)}
  };

  const originalSaveCustomWorkout=window.saveCustomWorkout;
  if(typeof originalSaveCustomWorkout==='function'){
    window.saveCustomWorkout=function(...args){
      if(editingCustomIndex===null)return originalSaveCustomWorkout.apply(this,args);
      const name=document.getElementById('customWorkoutName')?.value.trim()||'';
      if(!name){alert('Give your workout a name first.');return}
      if(!builderSelected?.length){alert('Add at least one exercise.');return}
      const previous=customWorkouts[editingCustomIndex];
      if(!previous){editingCustomIndex=null;return originalSaveCustomWorkout.apply(this,args)}
      customWorkouts[editingCustomIndex]={...previous,name,exercises:[...builderSelected]};
      localStorage.setItem('customWorkoutsV5',JSON.stringify(customWorkouts));
      editingCustomIndex=null;
      const button=builderSaveButton();
      if(button)button.textContent='Save Workout';
      if(typeof showManageWorkouts==='function')showManageWorkouts();
    };
  }

  function addEditButtons(){
    const area=document.getElementById('customButtons');
    if(!area || typeof customWorkouts==='undefined')return;
    const workoutButtons=[...area.querySelectorAll(':scope > .day-button')];
    workoutButtons.forEach((button,index)=>{
      if(button.parentElement?.classList.contains('myliftcoach-custom-row'))return;
      const row=document.createElement('div');
      row.className='myliftcoach-custom-row';
      button.before(row);
      row.appendChild(button);
      const edit=document.createElement('button');
      edit.type='button';
      edit.className='myliftcoach-edit-workout';
      edit.textContent='Edit';
      edit.setAttribute('aria-label',`Edit ${customWorkouts[index]?.name||'custom workout'}`);
      edit.onclick=()=>window.editCustomWorkout(index);
      row.appendChild(edit);
    });
  }

  const originalRenderCustomButtons=window.renderCustomButtons;
  if(typeof originalRenderCustomButtons==='function'){
    window.renderCustomButtons=function(...args){
      const result=originalRenderCustomButtons.apply(this,args);
      addEditButtons();
      return result;
    };
  }

  const originalShowManageWorkouts=window.showManageWorkouts;
  if(typeof originalShowManageWorkouts==='function'){
    window.showManageWorkouts=function(...args){
      const result=originalShowManageWorkouts.apply(this,args);
      requestAnimationFrame(addEditButtons);
      return result;
    };
  }

  function sync(){syncWeekStrip();addEditButtons()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();

  const observer=new MutationObserver(records=>{
    if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1 && (node.matches?.('.liftova-home-shell,.lh-week,#customButtons,.day-button') || node.querySelector?.('.lh-week,#customButtons,.day-button'))))){
      requestAnimationFrame(sync);
    }
  });
  if(document.body)observer.observe(document.body,{subtree:true,childList:true});
})();
