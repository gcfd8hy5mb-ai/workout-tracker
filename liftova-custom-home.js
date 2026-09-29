// Keep the canonical LIFTOVA Home dashboard in sync with the user's custom workouts.
(() => {
  'use strict';

  const CUSTOM_KEY = 'customWorkoutsV5';
  const HISTORY_KEY = 'workoutHistoryV52';

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function customPlans() {
    const stored = readJson(CUSTOM_KEY, []);
    if (!Array.isArray(stored)) return [];
    return stored.filter(workout => workout && workout.id != null && typeof workout.name === 'string' && Array.isArray(workout.exercises) && workout.exercises.length)
      .map((workout, index) => ({
        index,
        workoutKey: `custom-${workout.id}`,
        title: workout.name,
        ids: workout.exercises.filter(Boolean)
      }));
  }

  function nextCustomPlan() {
    const plans = customPlans();
    if (!plans.length) return null;
    const history = readJson(HISTORY_KEY, []);
    const sessions = Array.isArray(history) ? history : [];
    const last = sessions.find(session => plans.some(plan => plan.workoutKey === session?.workoutKey));
    const lastIndex = plans.findIndex(plan => plan.workoutKey === last?.workoutKey);
    return plans[(lastIndex + 1) % plans.length] || plans[0];
  }

  function exerciseInfo(id) {
    try {
      if (typeof getExercise === 'function') {
        const exercise = getExercise(id);
        if (exercise) return { name: exercise.name || id, muscle: exercise.muscle || '' };
      }
    } catch {}
    try {
      if (typeof exerciseLibrary !== 'undefined' && Array.isArray(exerciseLibrary)) {
        const exercise = exerciseLibrary.find(item => item.id === id);
        if (exercise) return { name: exercise.name || id, muscle: exercise.muscle || '' };
      }
    } catch {}
    return { name: id, muscle: '' };
  }

  function applyCustomHome() {
    const plan = nextCustomPlan();
    const home = document.getElementById('home');
    const card = home?.querySelector('.liftova-home-shell .lh-workout');
    if (!plan || !card) return;

    const rows = plan.ids.map(exerciseInfo);
    const groups = {};
    rows.forEach(row => {
      String(row.muscle || '').split(/[·,\/]/).map(value => value.trim()).filter(Boolean)
        .forEach(muscle => { groups[muscle] = (groups[muscle] || 0) + 1; });
    });
    const muscles = Object.keys(groups).slice(0, 4);
    const fingerprint = `${plan.workoutKey}:${plan.ids.join(',')}`;
    if (card.dataset.customHomeFingerprint === fingerprint) return;

    const heading = card.querySelector('h2');
    const muscleLine = card.querySelector(':scope > p');
    const meta = card.querySelectorAll('.lh-meta > span');
    const overview = card.querySelector('.lh-overview ul');

    if (heading) heading.textContent = plan.title.toUpperCase();
    if (muscleLine) muscleLine.textContent = muscles.join(' · ') || 'Custom workout';
    if (meta[0]) meta[0].childNodes[1].textContent = `${Math.max(30, rows.length * 6)} min`;
    if (meta[1]) meta[1].childNodes[1].textContent = `${rows.length} exercises`;
    if (overview) {
      overview.replaceChildren();
      const entries = Object.entries(groups).slice(0, 5);
      if (entries.length) entries.forEach(([muscle, count]) => {
        const li = document.createElement('li');
        li.textContent = `${muscle}: ${count} exercise${count === 1 ? '' : 's'}`;
        overview.appendChild(li);
      });
      else rows.slice(0, 5).forEach(row => {
        const li = document.createElement('li');
        li.textContent = row.name;
        overview.appendChild(li);
      });
    }

    card.dataset.customHomeFingerprint = fingerprint;
    card.dataset.customWorkoutIndex = String(plan.index);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open ${plan.title}`);
  }

  function openDisplayedCustom(event) {
    const card = event.target.closest?.('.liftova-home-shell .lh-workout[data-custom-workout-index]');
    if (!card) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    if (event.type === 'keydown') event.preventDefault();
    const index = Number(card.dataset.customWorkoutIndex);
    if (!Number.isInteger(index)) return;
    try {
      if (typeof openCustomWorkout === 'function') openCustomWorkout(index);
    } catch (error) {
      console.error('LIFTOVA could not open custom workout from Home', error);
    }
  }

  let queued = false;
  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyCustomHome();
    });
  }

  document.addEventListener('click', openDisplayedCustom);
  document.addEventListener('keydown', openDisplayedCustom);
  window.addEventListener('storage', event => {
    if (event.key === CUSTOM_KEY || event.key === HISTORY_KEY) queueApply();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) queueApply(); });

  function install() {
    const home = document.getElementById('home');
    if (!home) { setTimeout(install, 100); return; }
    const observer = new MutationObserver(queueApply);
    observer.observe(home, { childList: true, subtree: true });
    queueApply();
    setTimeout(queueApply, 200);
    setTimeout(queueApply, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
