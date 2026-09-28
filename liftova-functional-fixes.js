// Runtime compatibility fixes for legacy completion rendering.
(() => {
  'use strict';
  function patchWorkoutSummary() {
    const original = window.showWorkoutSummary;
    if (typeof original !== 'function' || original.__liftovaFunctionalFix) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      document.querySelectorAll('#completionContent .summary-exercise span').forEach(el => {
        el.textContent = el.textContent.replace(/\s*·\s*Next:\s*(?:undefined|NaN)\s*lb\s*×\s*8[–-]10/g, '');
      });
      return result;
    };
    wrapped.__liftovaFunctionalFix = true;
    window.showWorkoutSummary = wrapped;
  }
  patchWorkoutSummary();
  setTimeout(patchWorkoutSummary, 0);
  setTimeout(patchWorkoutSummary, 750);
})();
