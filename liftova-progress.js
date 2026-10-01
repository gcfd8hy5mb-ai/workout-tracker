// MYLIFTCOACH progress presentation layer. Leaves existing progress calculations intact.
(() => {
  'use strict';
  function ensureStyles(){
    if(document.querySelector('link[data-liftova-progress]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='liftova-progress.css?v=7';
    link.dataset.liftovaProgress='true';
    document.head.appendChild(link);
  }
  function improveEmptyStates(screen){
    screen.querySelectorAll('.card,.progress-exercise').forEach(card=>{
      if(card.querySelector('.liftova-progress-empty'))return;
      const text=(card.textContent||'').trim().toLowerCase();
      const empty=/no (workouts|data|history|records|progress)|nothing (yet|logged)|complete .* workout|log .* workout/.test(text);
      if(!empty)return;
      card.classList.add('liftova-is-empty');
      const existing=[...card.children].find(el=>/no (workouts|data|history|records|progress)|nothing (yet|logged)|complete .* workout|log .* workout/i.test(el.textContent||''));
      if(existing){
        const box=document.createElement('div');
        box.className='liftova-progress-empty';
        box.innerHTML='<strong>Your progress starts here</strong><span>Finish a workout and MYLIFTCOACH will begin building your strength, volume and consistency trends.</span>';
        existing.replaceWith(box);
      }
    });
  }
  function ensureProgressTargets(screen){
    const segment=screen.querySelector('.prism-segments');
    if(!segment)return;
    segment.setAttribute('role','tablist');
    segment.setAttribute('aria-label','Progress views');
    const buttons=[...segment.querySelectorAll('button')];
    const targets=['strength','body','activity'];
    buttons.forEach((button,index)=>{
      if(!button.dataset.progressTarget)button.dataset.progressTarget=targets[index]||`progress-${index}`;
      button.setAttribute('role','tab');
      const active=button.getAttribute('aria-pressed')==='true'||button.classList.contains('active');
      button.setAttribute('aria-selected',String(active));
      button.tabIndex=active?0:-1;
    });
    if(!segment.__myliftcoachProgressTargets){
      segment.__myliftcoachProgressTargets=true;
      const activate=button=>{
        if(!button)return;
        button.click();
        buttons.forEach(item=>{
          const active=item===button;
          item.classList.toggle('active',active);
          item.setAttribute('aria-pressed',String(active));
          item.setAttribute('aria-selected',String(active));
          item.tabIndex=active?0:-1;
        });
      };
      segment.addEventListener('click',event=>{
        const button=event.target.closest?.('[data-progress-target]');if(!button)return;
        buttons.forEach(item=>{
          const active=item===button;
          item.classList.toggle('active',active);
          item.setAttribute('aria-selected',String(active));
          item.tabIndex=active?0:-1;
        });
      });
      segment.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        const current=buttons.indexOf(document.activeElement);if(current<0)return;
        event.preventDefault();
        let next=current;
        if(event.key==='ArrowRight')next=(current+1)%buttons.length;
        if(event.key==='ArrowLeft')next=(current-1+buttons.length)%buttons.length;
        if(event.key==='Home')next=0;
        if(event.key==='End')next=buttons.length-1;
        buttons[next]?.focus();activate(buttons[next]);
      });
    }
  }
  function decorate(){
    const screen=document.getElementById('overallProgressScreen');
    if(!screen)return;
    ensureStyles();ensureProgressTargets(screen);
    screen.classList.add('mlc-progress-ready');
    if(!screen.querySelector('.liftova-progress-hero')){
      const hero=document.createElement('div');
      hero.className='liftova-progress-hero';
      hero.innerHTML='<span class="eyebrow">YOUR TRAINING</span><strong>Progress at a glance.</strong><p>Strength, volume and consistency update as you train.</p>';
      const heading=screen.querySelector('h2');
      if(heading?.nextSibling)screen.insertBefore(hero,heading.nextSibling);
      else screen.prepend(hero);
    }
    screen.querySelectorAll('h3').forEach(h=>{
      const label=h.textContent.trim();
      if(label==='All-time insights')h.textContent='All-Time Performance';
      if(label==='Recent activity')h.textContent='Recent Workouts';
    });
    screen.querySelectorAll('.progress-links button,button.dashboard-link').forEach(button=>{
      if(!button.getAttribute('aria-label'))button.setAttribute('aria-label',(button.textContent||'Open progress detail').trim());
    });
    improveEmptyStates(screen);
  }
  const original=window.showOverallProgress;
  if(typeof original==='function'){
    window.showOverallProgress=function(){const out=original.apply(this,arguments);requestAnimationFrame(decorate);return out;};
  }
  let queued=false;
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});});
  function boot(){const screen=document.getElementById('overallProgressScreen');if(screen)observer.observe(screen,{subtree:true,childList:true});decorate();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
