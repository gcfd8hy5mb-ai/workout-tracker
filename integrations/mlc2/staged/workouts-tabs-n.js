/* Workouts-only progressive enhancement for approved 11-21N.
   No account, storage, login, session, or workout persistence changes. */
(function(){
 'use strict';
 function init(){
  const page=document.getElementById('workouts');
  if(!page||page.dataset.compactTabsReady)return;
  const heading=page.querySelector('.page-heading');
  const toolbar=page.querySelector('.custom-workout-toolbar');
  const schedule=page.querySelector('#weeklySchedule')?.closest('article');
  const recovery=page.querySelector('#guestWorkoutRecovery');
  const grid=page.querySelector('#workoutGrid');
  const legacy=page.querySelector('.original-plan-panel');
  const create=document.getElementById('createWorkout');
  const homeTitle=document.getElementById('todayTitle');
  const homeStart=document.getElementById('todayStart');
  if(!heading||!toolbar||!schedule||!recovery||!grid||!legacy||!create||!homeTitle||!homeStart)return;
  const nav=document.createElement('div');
  nav.className='workout-tabs-n';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Workout sections');
  const panels={};
  [['today','Today'],['routines','My Workouts'],['schedule','Schedule']].forEach(([id,label],i)=>{
   const button=document.createElement('button');button.type='button';button.textContent=label;
   button.id='workouts-n-tab-'+id;button.dataset.workoutNTab=id;button.setAttribute('role','tab');
   button.setAttribute('aria-controls','workouts-n-panel-'+id);button.setAttribute('aria-selected',i===0?'true':'false');button.tabIndex=i===0?0:-1;
   nav.append(button);
   const panel=document.createElement('section');panel.className='workouts-n-panel';panel.id='workouts-n-panel-'+id;
   panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
   panel.hidden=i!==0;panels[id]=panel;
  });
  const today=document.createElement('article');today.className='workouts-n-today';
  const kicker=document.createElement('span');kicker.className='workouts-n-kicker';kicker.textContent="TODAY'S WORKOUT";
  const title=document.createElement('h2');title.id='workouts-n-today-title';
  const detail=document.createElement('p');detail.id='workouts-n-today-detail';
  const actions=document.createElement('div');actions.className='workouts-n-actions';
  const start=document.createElement('button');start.type='button';start.className='button-primary';start.textContent='Start workout';
  const change=document.createElement('button');change.type='button';change.className='button-outline';change.textContent='Change workout';
  actions.append(start,change);today.append(kicker,title,detail,actions);
  const priority=document.createElement('p');priority.className='workouts-n-priority';priority.textContent='Your selected custom workout takes priority over presets and Coach suggestions.';
  panels.today.append(today,priority);
  const listHead=document.createElement('div');listHead.className='workouts-n-list-heading';
  const listTitle=document.createElement('h2');listTitle.textContent='My routines';
  listHead.append(listTitle);panels.routines.append(listHead,toolbar,recovery,grid);
  const legacyDetails=document.createElement('details');legacyDetails.className='workouts-n-legacy';
  const legacySummary=document.createElement('summary');legacySummary.textContent='Original app routines (read-only)';
  legacyDetails.append(legacySummary,legacy);panels.routines.append(legacyDetails);
  panels.schedule.append(schedule);
  heading.querySelector('h1').textContent='Workouts';
  const description=heading.querySelector('p');
  if(description)description.textContent='Start a workout, manage routines, or update your weekly schedule.';
  page.append(nav,panels.today,panels.routines,panels.schedule);
  function syncToday(){
   title.textContent=homeTitle.textContent||'Your next workout';
   detail.textContent=document.getElementById('todayDescription')?.textContent||'Choose a routine to begin.';
   start.disabled=!homeStart.dataset.homeWorkout;
  }
  function select(id){
   if(!panels[id])return;
   Object.entries(panels).forEach(([key,panel])=>{
    const active=key===id;panel.hidden=!active;
    const button=nav.querySelector('[data-workout-n-tab="'+key+'"]');
    button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
   });
   syncToday();
  }
  nav.addEventListener('click',event=>{const button=event.target.closest('[data-workout-n-tab]');if(button)select(button.dataset.workoutNTab)});
  nav.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   const names=['today','routines','schedule'];
   const selected=nav.querySelector('[aria-selected="true"]')?.dataset.workoutNTab||'today';
   let index=names.indexOf(selected);
   index=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3;
   event.preventDefault();select(names[index]);nav.querySelector('[data-workout-n-tab="'+names[index]+'"]').focus();
  });
  start.addEventListener('click',()=>{syncToday();if(!start.disabled)homeStart.click()});
  change.addEventListener('click',()=>select('routines'));
  const observer=new MutationObserver(syncToday);
  observer.observe(homeTitle,{childList:true,subtree:true,characterData:true});
  observer.observe(homeStart,{attributes:true,attributeFilter:['data-home-workout']});
  page.dataset.compactTabsReady='true';
  syncToday();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
