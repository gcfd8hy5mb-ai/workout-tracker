// LIFTOVA progress presentation layer. Leaves existing progress calculations intact.
(() => {
  'use strict';
  function ensureStyles(){
    if(document.querySelector('link[data-liftova-progress]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='liftova-progress.css?v=6';
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
        box.innerHTML='<strong>Your progress starts here</strong><span>Finish a workout and Liftova will begin building your strength, volume and consistency trends.</span>';
        existing.replaceWith(box);
      }
    });
  }
  function decorate(){
    const screen=document.getElementById('overallProgressScreen');
    if(!screen)return;
    ensureStyles();
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
    improveEmptyStates(screen);
  }
  const original=window.showOverallProgress;
  if(typeof original==='function'){
    window.showOverallProgress=function(){
      const out=original.apply(this,arguments);
      requestAnimationFrame(decorate);
      return out;
    };
  }
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;decorate();});
  });
  function boot(){
    const screen=document.getElementById('overallProgressScreen');
    if(screen)observer.observe(screen,{subtree:true,childList:true});
    decorate();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
