// LIFTOVA workout-browser presentation layer. Does not replace workout data or actions.
(() => {
  'use strict';
  const addStyles = () => {
    if (document.querySelector('link[data-liftova-workouts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'liftova-workouts.css?v=2';
    link.dataset.liftovaWorkouts = 'true';
    document.head.appendChild(link);
  };
  const enhance = () => {
    const screen = document.getElementById('workoutsScreen');
    if (!screen) return;
    addStyles();
    let hero = screen.querySelector('.liftova-workouts-hero');
    if (!hero) {
      hero = document.createElement('div');
      hero.className = 'liftova-workouts-hero';
      hero.innerHTML = '<small>LIFTOVA TRAINING</small><h3>Your workouts. Built to progress.</h3><p>Choose a session, review the target muscles and exercises, then start when you are ready.</p>';
      const search = screen.querySelector('#workoutBrowserSearch');
      const head = screen.querySelector('.prism-section-head');
      (search || head?.nextSibling || screen.firstChild)?.parentNode?.insertBefore(hero, search || head?.nextSibling || screen.firstChild);
    }
    screen.querySelectorAll('.prism-eyebrow').forEach(el => { if (el.textContent.includes('YOUR TRAINING')) el.textContent = 'LIFTOVA TRAINING'; });
  };

  const originalShowWorkouts = window.showWorkouts;
  if (typeof originalShowWorkouts === 'function') {
    window.showWorkouts = function(...args) {
      const result = originalShowWorkouts.apply(this, args);
      requestAnimationFrame(enhance);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', enhance, {once:true});
  if (document.readyState !== 'loading') enhance();
})();
