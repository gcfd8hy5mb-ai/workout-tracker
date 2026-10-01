// MYLIFTCOACH presentation layer for active workouts and exercise detail screens.
(() => {
  'use strict';
  if (!document.querySelector('link[data-liftova-active-workout]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'liftova-active-workout.css?v=5';
    link.dataset.liftovaActiveWorkout = 'true';
    document.head.appendChild(link);
  }

  const addKicker = area => {
    if (!area || area.querySelector('.liftova-exercise-kicker')) return;
    const heading = area.querySelector('h2');
    if (!heading) return;
    const kicker = document.createElement('div');
    kicker.className = 'liftova-exercise-kicker';
    kicker.textContent = 'MYLIFTCOACH EXERCISE GUIDE';
    heading.before(kicker);
  };

  const cardState = card => {
    const done = card?.querySelectorAll('.set-done[aria-pressed="true"]').length || 0;
    const total = card?.querySelectorAll('.set-done').length || 0;
    return {done,total,complete:total>0&&done===total,started:done>0&&done<total};
  };

  const markExerciseState = card => {
    if (!card) return;
    card.classList.add('liftova-premium-exercise');
    const image = card.querySelector('.exercise-image');
    if (image) image.loading = 'lazy';
    const state=cardState(card);
    card.classList.toggle('liftova-exercise-complete', state.complete);
    card.classList.toggle('liftova-exercise-started', state.started);
    card.querySelectorAll('input').forEach(input => {
      if (/weight|rep|load/i.test(`${input.name} ${input.id} ${input.placeholder} ${input.getAttribute('aria-label')||''}`)) {
        input.inputMode = 'decimal';
        input.autocomplete = 'off';
        input.enterKeyHint = 'next';
      }
    });
  };

  const ensureSessionHud=workout=>{
    if(!workout)return null;
    let hud=workout.querySelector('.myliftcoach-session-hud');
    if(hud)return hud;
    hud=document.createElement('section');
    hud.className='myliftcoach-session-hud';
    hud.setAttribute('aria-live','polite');
    hud.innerHTML='<div class="msh-copy"><span>LIVE WORKOUT</span><strong>Ready to train</strong></div><div class="msh-progress"><b>0%</b><small>SESSION</small></div>';
    const heading=workout.querySelector(':scope > h2');
    if(heading?.nextSibling)workout.insertBefore(hud,heading.nextSibling); else workout.prepend(hud);
    return hud;
  };

  const updateSessionHud=workout=>{
    if(!workout)return;
    const hud=ensureSessionHud(workout);
    const cards=[...workout.querySelectorAll('.exercise')];
    const totalSets=cards.reduce((n,c)=>n+cardState(c).total,0);
    const doneSets=cards.reduce((n,c)=>n+cardState(c).done,0);
    const completeExercises=cards.filter(c=>cardState(c).complete).length;
    const next=cards.find(c=>!cardState(c).complete);
    const pct=totalSets?Math.round(doneSets/totalSets*100):0;
    const copy=hud.querySelector('.msh-copy strong');
    const percent=hud.querySelector('.msh-progress b');
    if(copy)copy.textContent=next ? `${completeExercises}/${cards.length} exercises · Up next: ${next.querySelector('.exercise-title')?.textContent?.trim()||'Exercise'}` : (cards.length?'Workout complete — finish when ready':'Ready to train');
    if(percent)percent.textContent=`${pct}%`;
    hud.style.setProperty('--session-progress',`${pct}%`);
    cards.forEach(card=>card.classList.toggle('myliftcoach-current-exercise',card===next));
  };

  const polish = () => {
    const info = document.getElementById('prismExerciseInfo');
    const infoScreen = document.getElementById('exerciseInfoScreen');
    if (infoScreen && !infoScreen.classList.contains('hidden')) addKicker(info);

    const workout = document.getElementById('workoutScreen');
    if (workout && !workout.classList.contains('hidden')) {
      workout.classList.add('liftova-live-session');
      workout.querySelectorAll('.exercise').forEach(markExerciseState);
      updateSessionHud(workout);
    }
  };

  const haptic = strength => {
    try {
      if (navigator.vibrate) navigator.vibrate(strength === 'success' ? [12,28,12] : 8);
    } catch (_) {}
  };

  const scrollNextIncomplete = from => {
    const workout=document.getElementById('workoutScreen');
    if(!workout)return;
    const cards=[...workout.querySelectorAll('.exercise')];
    const current=from.closest('.exercise');
    const start=Math.max(0,cards.indexOf(current));
    const next=cards.slice(start+1).find(card=>card.querySelector('.set-done:not([aria-pressed="true"])')) || cards.find(card=>card.querySelector('.set-done:not([aria-pressed="true"])'));
    if(next && next!==current) next.scrollIntoView({behavior:'smooth',block:'start'});
  };

  const installWorkoutInteractions = () => {
    const workout=document.getElementById('workoutScreen');
    if(!workout || workout.dataset.liftovaNativeWorkout==='true')return;
    workout.dataset.liftovaNativeWorkout='true';

    workout.addEventListener('click',event=>{
      const done=event.target.closest('.set-done');
      if(done){
        requestAnimationFrame(()=>{
          const card=done.closest('.exercise');
          markExerciseState(card);
          updateSessionHud(workout);
          if(done.getAttribute('aria-pressed')==='true'){
            haptic(card?.classList.contains('liftova-exercise-complete')?'success':'tap');
            const remaining=card?.querySelector('.set-done:not([aria-pressed="true"])');
            if(remaining) remaining.scrollIntoView({behavior:'smooth',block:'center'});
            else scrollNextIncomplete(done);
          }
        });
      }
      const finish=event.target.closest('.finish-workout');
      if(finish)haptic('success');
    });

    workout.addEventListener('focusin',event=>{
      const input=event.target.closest('input,select,textarea');
      if(!input)return;
      input.closest('.tracking,.exercise')?.classList.add('liftova-input-active');
      setTimeout(()=>input.scrollIntoView({behavior:'smooth',block:'center'}),180);
    });
    workout.addEventListener('focusout',event=>event.target.closest('.tracking,.exercise')?.classList.remove('liftova-input-active'));

    workout.addEventListener('keydown',event=>{
      if(event.key!=='Enter' || !event.target.matches('input'))return;
      const inputs=[...workout.querySelectorAll('input:not([disabled])')];
      const next=inputs[inputs.indexOf(event.target)+1];
      if(next){ event.preventDefault(); next.focus(); }
      else event.target.blur();
    });
  };

  let queued = false;
  const schedulePolish = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      polish();
    });
  };

  const observeScreen = id => {
    const screen = document.getElementById(id);
    if (!screen) return;
    new MutationObserver(schedulePolish).observe(screen, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class','aria-pressed']
    });
  };

  const boot = () => {
    observeScreen('workoutScreen');
    observeScreen('exerciseInfoScreen');
    installWorkoutInteractions();
    polish();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
