// MYLIFTCOACH daily tracking UX — non-destructive interaction polish.
(() => {
  'use strict';
  const IDS=['waterScreen','foodScreen','weightScreen','goalsScreen'];

  function todayLabel(){
    try{return new Intl.DateTimeFormat(undefined,{weekday:'long',month:'short',day:'numeric'}).format(new Date())}
    catch{return 'Today'}
  }

  function ensureToolbar(screen){
    if(screen.querySelector('.mlc-tracking-toolbar'))return;
    const heading=screen.querySelector(':scope > h2');
    if(!heading)return;
    const bar=document.createElement('div');
    bar.className='mlc-tracking-toolbar';
    bar.innerHTML=`<div class="mlc-tracking-today"><span>Today</span><strong>${todayLabel()}</strong></div>`;
    heading.after(bar);
  }

  function improveFields(screen){
    screen.querySelectorAll('input,select,textarea').forEach(field=>{
      if(!field.getAttribute('autocomplete'))field.setAttribute('autocomplete','off');
      if(field instanceof HTMLInputElement && ['number','decimal','numeric'].includes(field.inputMode||field.type))field.setAttribute('enterkeyhint','done');
    });
    screen.querySelectorAll('form').forEach(form=>{
      if(form.dataset.mlcTrackingForm==='1')return;
      form.dataset.mlcTrackingForm='1';
      form.addEventListener('keydown',event=>{
        if(event.key!=='Enter'||event.shiftKey||event.target?.tagName==='TEXTAREA')return;
        const fields=[...form.querySelectorAll('input:not([type=hidden]),select,textarea,button[type=submit]')].filter(el=>!el.disabled&&el.offsetParent!==null);
        const index=fields.indexOf(event.target);
        if(index<0)return;
        const next=fields[index+1];
        if(next && next.tagName!=='BUTTON'){
          event.preventDefault();
          next.focus();
        }
      });
    });
  }

  function improveEmptyStates(screen){
    screen.querySelectorAll('.empty').forEach(box=>{
      if(box.dataset.mlcTrackingEmpty==='1')return;
      box.dataset.mlcTrackingEmpty='1';
      box.classList.add('mlc-tracking-empty');
      const text=(box.textContent||'').trim();
      if(!text)return;
      box.innerHTML=`<strong>Nothing logged yet</strong><span>${text}</span>`;
    });
  }

  function improveButtons(screen){
    screen.querySelectorAll('button').forEach(button=>{
      if(!button.getAttribute('aria-label')){
        const label=(button.textContent||'').replace(/\s+/g,' ').trim();
        if(label)button.setAttribute('aria-label',label);
      }
    });
  }

  function decorate(screen){
    if(!screen)return;
    screen.dataset.myliftcoachTracking='1';
    ensureToolbar(screen);
    improveFields(screen);
    improveEmptyStates(screen);
    improveButtons(screen);
  }

  function boot(){
    IDS.forEach(id=>{
      const screen=document.getElementById(id);
      if(!screen)return;
      decorate(screen);
      if(screen.dataset.mlcTrackingObserver==='1')return;
      screen.dataset.mlcTrackingObserver='1';
      let queued=false;
      new MutationObserver(()=>{
        if(queued)return;
        queued=true;
        requestAnimationFrame(()=>{queued=false;decorate(screen)});
      }).observe(screen,{subtree:true,childList:true});
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
