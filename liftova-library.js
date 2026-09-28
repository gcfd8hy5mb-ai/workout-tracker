// LIFTOVA exercise library presentation layer.
(() => {
  'use strict';

  const style = document.createElement('style');
  style.id = 'liftovaLibraryStyles';
  style.textContent = `
    #libraryScreen{max-width:760px;margin:0 auto;padding-bottom:28px;color:#f8f7ff}
    #libraryScreen>.back{color:#bca2ff!important;font-weight:760!important;margin-bottom:10px}
    #libraryScreen>h2{margin:0 0 5px!important;font-size:30px!important;letter-spacing:-.045em!important}
    #libraryScreen>h2:before{content:'EXERCISE LIBRARY';display:block;margin-bottom:7px;color:#9b62ff;font-size:10px;font-weight:850;letter-spacing:.18em}
    #libraryScreen>h2:after{content:'Find the right movement. See exactly what it trains.';display:block;margin-top:6px;color:#918aa0;font-size:14px;font-weight:500;letter-spacing:0;line-height:1.45}
    #libraryScreen .search,#libraryScreen select{background:linear-gradient(180deg,#11111b,#0b0b12)!important;color:#fff!important;border:1px solid #2c2440!important;border-radius:15px!important;min-height:52px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
    #libraryScreen .search{margin:18px 0 10px!important;padding-left:16px!important}
    #libraryScreen select{margin-bottom:16px!important}
    #libraryScreen .library-item{position:relative;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:13px!important;padding:12px!important;margin-bottom:11px!important;background:linear-gradient(145deg,rgba(20,17,29,.98),rgba(10,10,16,.98))!important;border:1px solid #2d2540!important;border-radius:20px!important;box-shadow:0 15px 34px rgba(0,0,0,.22)!important;overflow:hidden}
    #libraryScreen .library-item:after{content:'';position:absolute;inset:auto 10% 0 10%;height:1px;background:linear-gradient(90deg,transparent,#7e35ee,transparent);opacity:.45}
    #libraryScreen .library-preview{display:grid!important;grid-template-columns:86px minmax(0,1fr)!important;gap:13px!important;align-items:center!important}
    #libraryScreen .prism-library-thumb,#libraryScreen .exercise-mini-map{width:86px!important;height:86px!important;max-width:86px!important;border-radius:15px!important;object-fit:cover!important;background:radial-gradient(circle at 50% 35%,rgba(129,55,255,.18),#0a0a10 68%)!important;border:1px solid #34274c!important;padding:3px!important}
    #libraryScreen .exercise-mini-map .body-figure{width:76px!important;margin:auto!important}
    #libraryScreen .library-name{font-size:16px!important;font-weight:790!important;letter-spacing:-.015em!important;color:#fff!important;line-height:1.25}
    #libraryScreen .badge{display:inline-flex!important;margin-top:7px!important;padding:5px 9px!important;background:rgba(123,47,245,.12)!important;color:#c8adff!important;border:1px solid rgba(151,86,255,.28)!important;border-radius:999px!important;font-size:10px!important;font-weight:750!important;line-height:1.15!important}
    #libraryScreen .add-small{min-width:59px!important;border-radius:12px!important;border:1px solid #58309a!important;background:linear-gradient(145deg,#5522a9,#7b31e9)!important;color:#fff!important;font-size:12px!important;font-weight:800!important;padding:11px 12px!important;box-shadow:0 8px 22px rgba(105,41,208,.2)!important}
    #libraryScreen .add-small:active{background:#6428c2!important}
    #libraryScreen .empty{background:#0e0e16!important;border:1px solid #2d2540!important;border-radius:18px!important;color:#918aa0!important}
    #exerciseInfoScreen{color:#f8f7ff}
    #exerciseInfoScreen>.back{color:#bca2ff!important;font-weight:760!important}
    #prismExerciseInfo>h2{font-size:29px!important;margin-bottom:5px!important;letter-spacing:-.04em!important}
    #prismExerciseInfo>.small{color:#a49cad!important;font-size:13px!important}
    #prismExerciseInfo .prism-info-photo{display:block!important;width:100%!important;max-height:350px!important;object-fit:contain!important;margin:16px 0!important;padding:8px!important;border-radius:23px!important;background:radial-gradient(circle at 50% 45%,rgba(128,45,255,.16),#09090f 66%)!important;border:1px solid #34274c!important;box-shadow:0 18px 45px rgba(0,0,0,.3)!important}
    #prismExerciseInfo .prism-info-map{padding:15px!important;margin:13px 0!important;border-radius:21px!important;background:linear-gradient(145deg,#15121f,#0c0c13)!important;border:1px solid #34274c!important}
    #prismExerciseInfo .exercise-instructions,#prismExerciseInfo .card{background:linear-gradient(145deg,#15121f,#0c0c13)!important;border:1px solid #34274c!important;border-radius:20px!important;color:#fff!important;padding:18px!important}
    #prismExerciseInfo .exercise-instructions li,#prismExerciseInfo .exercise-instructions p{color:#bbb3c7!important;line-height:1.55!important}
    @media(max-width:390px){#libraryScreen .library-preview{grid-template-columns:74px minmax(0,1fr)!important}#libraryScreen .prism-library-thumb,#libraryScreen .exercise-mini-map{width:74px!important;height:74px!important}.container{padding-left:13px!important;padding-right:13px!important}}
  `;
  document.head.appendChild(style);

  function decorateLibrary() {
    const screen = document.getElementById('libraryScreen');
    if (!screen) return;
    screen.dataset.liftova = 'library';
    const search = document.getElementById('librarySearch');
    if (search) search.placeholder = 'Search exercises, muscles, equipment';
  }

  const originalShowLibrary = window.showLibrary;
  if (typeof originalShowLibrary === 'function') {
    window.showLibrary = function(...args) {
      const result = originalShowLibrary.apply(this,args);
      requestAnimationFrame(decorateLibrary);
      return result;
    };
  }

  const originalRenderLibrary = window.renderLibrary;
  if (typeof originalRenderLibrary === 'function') {
    window.renderLibrary = function(...args) {
      const result = originalRenderLibrary.apply(this,args);
      requestAnimationFrame(decorateLibrary);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', decorateLibrary, {once:true});
})();
