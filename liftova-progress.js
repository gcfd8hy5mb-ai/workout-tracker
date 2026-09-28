// LIFTOVA progress presentation layer. Leaves existing progress calculations intact.
(() => {
  'use strict';
  function ensureStyles(){
    if(document.querySelector('link[data-liftova-progress]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='liftova-progress.css';
    link.dataset.liftovaProgress='true';
    document.head.appendChild(link);
  }
  function decorate(){
    const screen=document.getElementById('overallProgressScreen');
    if(!screen)return;
    ensureStyles();
    if(!screen.querySelector('.liftova-progress-hero')){
      const hero=document.createElement('div');
      hero.className='liftova-progress-hero';
      hero.innerHTML='<span class="eyebrow">LIFTOVA PROGRESS</span><strong>See the work adding up.</strong><p>Strength, training volume and consistency — all in one place.</p>';
      const heading=screen.querySelector('h2');
      if(heading?.nextSibling)screen.insertBefore(hero,heading.nextSibling);
      else screen.prepend(hero);
    }
    screen.querySelectorAll('h3').forEach(h=>{
      if(h.textContent.trim()==='All-time insights')h.textContent='All-Time Performance';
    });
  }
  const original=window.showOverallProgress;
  if(typeof original==='function'){
    window.showOverallProgress=function(){
      const out=original.apply(this,arguments);
      requestAnimationFrame(decorate);
      return out;
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});
  else decorate();
})();
