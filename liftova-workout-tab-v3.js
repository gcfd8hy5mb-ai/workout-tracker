// Canonical Workout-tab entry for the approved LIFTOVA reference design.
// Keeps the legacy workout browser/data engine available internally, but the visible
// bottom Workout tab opens the full Upper Body session shown in the approved sketches.
(() => {
  'use strict';

  const CANONICAL_IDS = [
    'machine-chest-press',
    'incline-chest-press',
    'pec-deck',
    'lat-pulldown',
    'seated-row',
    'shoulder-press',
    'lateral-raise',
    'triceps-pushdown'
  ];

  let installed = false;

  function canonicalItem(){
    const ids = CANONICAL_IDS.filter(id => {
      try { return typeof getExercise === 'function' && !!getExercise(id); }
      catch { return false; }
    });
    return {
      kind: 'liftova-reference',
      key: 'upper-body',
      title: 'Upper Body',
      ids,
      workoutKey: 'liftova-reference-upper-body'
    };
  }

  function openCanonicalWorkout(){
    const item = canonicalItem();
    if (!item.ids.length) return false;
    if (typeof showPrismWorkoutDetail === 'function') {
      showPrismWorkoutDetail(item);
      return true;
    }
    return false;
  }

  function startCanonicalWorkout(item){
    try {
      activeWorkoutKey = 'liftova-reference-upper-body';
      activeWorkoutTitle = 'Upper Body';
      activeWorkoutExerciseIds = [...item.ids];
      activeCustomIndex = null;
      lastWorkoutContext = {type:'liftova-reference', title:item.title, ids:[...item.ids]};
      openWorkout(item.title, item.ids, false);
      return true;
    } catch (error) {
      console.error('LIFTOVA canonical workout could not start', error);
      return false;
    }
  }

  function install(){
    if (installed) return;
    if (typeof showPrismWorkoutDetail !== 'function' || typeof showWorkouts !== 'function') {
      setTimeout(install, 60);
      return;
    }
    installed = true;

    const legacyShowWorkouts = window.showWorkouts;
    const legacyStartPrismWorkout = window.startPrismWorkout;

    window.showWorkouts = function(){
      if (openCanonicalWorkout()) return;
      return legacyShowWorkouts?.apply(this, arguments);
    };
    window.showWorkouts.__liftovaCanonicalWorkout = true;
    window.showWorkouts.__legacyShowWorkouts = legacyShowWorkouts;

    window.startPrismWorkout = function(item){
      if (item?.kind === 'liftova-reference' && startCanonicalWorkout(item)) return;
      return legacyStartPrismWorkout?.apply(this, arguments);
    };

    // The reference Home start button previously searched the hidden legacy Home DOM
    // and could launch the old 3-exercise preset. Capture it first and send it to the
    // same canonical 8-exercise screen used by the Workout tab.
    document.addEventListener('click', event => {
      const start = event.target.closest?.('#lv3StartWorkout');
      if (start) {
        event.preventDefault();
        event.stopImmediatePropagation();
        startCanonicalWorkout(canonicalItem());
        return;
      }
      const back = event.target.closest?.('[data-lv3-back]');
      if (back && back.closest('#prismWorkoutDetail')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof goHome === 'function') goHome();
      }
    }, true);

    // If Safari restores the legacy Workouts browser after an update, replace it on
    // the next frame instead of leaving the old list visible.
    requestAnimationFrame(() => {
      const browser = document.getElementById('workoutsScreen');
      if (browser && !browser.classList.contains('hidden')) openCanonicalWorkout();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
