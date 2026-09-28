// LIFTOVA presentation layer for active workouts and exercise detail screens.
(() => {
  'use strict';
  if (!document.querySelector('link[href="liftova-active-workout.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'liftova-active-workout.css';
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

  const polish = () => {
    const info = document.getElementById('prismExerciseInfo');
    const infoScreen = document.getElementById('exerciseInfoScreen');
    if (infoScreen && !infoScreen.classList.contains('hidden')) addKicker(info);

    const workout = document.getElementById('workoutScreen');
    if (workout && !workout.classList.contains('hidden')) {
      workout.querySelectorAll('.exercise').forEach(card => {
        card.classList.add('liftova-premium-exercise');
        const image = card.querySelector('.exercise-image');
        if (image) image.loading = 'lazy';
      });
    }
  };

  const observer = new MutationObserver(polish);
  observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class']});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', polish);
  else polish();
})();
