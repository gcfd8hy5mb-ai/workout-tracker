/* MYLIFTCOACH 2.0 Progress compact navigation.
   Presentation-only DOM reorganization. Existing renderers, IDs, stored records
   and account/cloud logic remain unchanged. */
(()=>{
'use strict';
function init(){
 const page=document.getElementById('progress');
 if(!page||page.dataset.compactProgressReady)return;
 const metrics=page.querySelector('.metrics');
 const recap=document.getElementById('postWorkoutRecap')?.closest('.panel');
 const chart=document.getElementById('progressChart')?.closest('.panel');
 const history=document.getElementById('sessionHistory')?.closest('.panel');
 const records=document.getElementById('demoRecords')?.closest('.panel');
 const original=document.getElementById('legacyRecords')?.closest('.panel');
 if(!metrics||!recap||!chart||!history||!records||!original)return;
 page.classList.add('progress-compact');
 const heading=page.querySelector('.page-heading');
 const intro=heading?.querySelector('p');
 if(intro)intro.textContent='Your training at a glance. Choose a section for more details.';
 const tabs=document.createElement('div');
 tabs.className='progress-compact-tabs';
 tabs.setAttribute('role','tablist');
 tabs.setAttribute('aria-label','Progress categories');
 const groups={};
 const defs=[['overview','Overview'],['strength','Strength'],['history','History'],['body','Body']];
 defs.forEach(([id,label],i)=>{
  const button=document.createElement('button');
  button.type='button';button.id='progress-tab-'+id;
  button.dataset.progressTab=id;button.textContent=label;
  button.setAttribute('role','tab');
  button.setAttribute('aria-controls','progress-panel-'+id);
  button.setAttribute('aria-selected',String(i===0));
  button.tabIndex=i===0?0:-1;
  tabs.append(button);
  const panel=document.createElement('section');
  panel.className='progress-compact-panel';
  panel.id='progress-panel-'+id;
  panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
  panel.hidden=i!==0;groups[id]=panel;
 });
 // Existing data-driven panels retain their elements, IDs and event handlers.
 groups.overview.append(recap,chart);
 groups.strength.append(records);
 const auditCard=document.createElement('article');
 auditCard.className='panel volume-audit-card';
 const auditHeading=document.createElement('div');auditHeading.className='panel-heading';
 const auditTitle=document.createElement('h3');auditTitle.textContent='Verify pounds lifted';
 auditHeading.append(auditTitle);
 const auditBody=document.createElement('div');auditBody.id='progressVolumeAudit';
 auditCard.append(auditHeading,auditBody);
 groups.strength.prepend(auditCard);
 groups.strength.append(original);
 groups.history.append(history);
 const openHistory=document.createElement('button');
 openHistory.type='button';openHistory.className='progress-compact-link';
 openHistory.textContent='Open full workout history →';
 openHistory.addEventListener('click',()=>{
  window.MLC2ProgressNavigate?.('history');
 });
 groups.history.append(openHistory);
 const count=document.createElement('p');
 count.className='progress-compact-note';
 count.textContent='Recent sessions appear above. Open full history for older and original-app records.';
 groups.history.append(count);
 const bodyCard=document.createElement('article');bodyCard.className='progress-compact-body';
 const bodyTitle=document.createElement('h3');bodyTitle.textContent='Body progress';
 const bodyDescription=document.createElement('p');
 bodyDescription.textContent='View your saved weight trends, measurements, and progress photos under Daily Tracking. No records are moved or changed.';
 const openTracking=document.createElement('button');
 openTracking.type='button';openTracking.className='progress-compact-link';
 openTracking.textContent='Open body tracking →';
 openTracking.addEventListener('click',()=>window.MLC2ProgressNavigate?.('tracking'));
 bodyCard.append(bodyTitle,bodyDescription,openTracking);
 groups.body.append(bodyCard);
 const summary=document.createElement('p');
 summary.className='progress-compact-label';summary.textContent='YOUR TRAINING SNAPSHOT';
 metrics.before(summary);
 metrics.after(tabs,...defs.map(([id])=>groups[id]));
 function select(id,focus=false){
  if(!groups[id])return;
  defs.forEach(([key])=>{
   const visible=key===id;
   groups[key].hidden=!visible;
   const b=tabs.querySelector('[data-progress-tab="'+key+'"]');
   b.setAttribute('aria-selected',String(visible));b.tabIndex=visible?0:-1;
  });
  if(focus)tabs.querySelector('[data-progress-tab="'+id+'"]').focus();
 }
 tabs.addEventListener('click',e=>{
  const button=e.target.closest('[data-progress-tab]');
  if(button)select(button.dataset.progressTab);
 });
 tabs.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();
  const ids=defs.map(([id])=>id);
  const selected=tabs.querySelector('[aria-selected="true"]')?.dataset.progressTab||'overview';
  const index=ids.indexOf(selected);
  const next=e.key==='Home'?0:e.key==='End'?ids.length-1:(index+(e.key==='ArrowRight'?1:ids.length-1))%ids.length;
  select(ids[next],true);
 });
 page.dataset.compactProgressReady='true';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
