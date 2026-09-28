// LIFTOVA presentation layer for active workouts and exercise detail screens.
(() => {
  'use strict';
  if (!document.querySelector('link[data-liftova-active-workout]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'liftova-active-workout.css?v=3';
    link.dataset.liftovaActiveWorkout = 'true';
    document.head.appendChild(link);
  }

  const addKicker = area => {
    if (!area || area.querySelector('.liftova-exercise-kicker')) return;
    const heading = area.querySelector('h2');
    if (!heading) return;
    const kicker = document.createElement('div');
    kicker.className = 'liftova-exercise-kicker';
    kicker.textContent = 'LIFTOVA EXERCISE GUIDE';
    heading.before(kicker);
  };

  const markExerciseState = card => {
    if (!card) return;
    card.classList.add('liftova-premium-exercise');
    const image = card.querySelector('.exercise-image');
    if (image) image.loading = 'lazy';
    const done = card.querySelectorAll('.set-done[aria-pressed="true"]').length;
    const total = card.querySelectorAll('.set-done').length;
    card.classList.toggle('liftova-exercise-complete', total > 0 && done === total);
    card.classList.toggle('liftova-exercise-started', done > 0 && done < total);
  };

  const polish = () => {
    const info = document.getElementById('prismExerciseInfo');
    const infoScreen = document.getElementById('exerciseInfoScreen');
    if (infoScreen && !infoScreen.classList.contains('hidden')) addKicker(info);

    const workout = document.getElementById('workoutScreen');
    if (workout && !workout.classList.contains('hidden')) {
      workout.classList.add('liftova-live-session');
      workout.querySelectorAll('.exercise').forEach(markExerciseState);
    }
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
    polish();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
