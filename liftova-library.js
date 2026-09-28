// LIFTOVA exercise library presentation layer.
(() => {
  'use strict';

  const style = document.createElement('style');
  style.id = 'liftovaLibraryStyles';
  style.textContent = `
    #libraryScreen{max-width:760px;margin:0 auto;padding-bottom:105px;color:#f8f7ff}
    #libraryScreen>.back{color:#bca2ff!important;font-weight:760!important;margin-bottom:8px}
    #libraryScreen>h2{margin:0 0 4px!important;font-size:27px!important;letter-spacing:-.045em!important}
    #libraryScreen>h2:before{content:'EXERCISE LIBRARY';display:block;margin-bottom:6px;color:#9b62ff;font-size:9px;font-weight:850;letter-spacing:.18em}
    #libraryScreen>h2:after{content:'Find a movement and see exactly what it trains.';display:block;margin-top:5px;color:#918aa0;font-size:11px;font-weight:500;letter-spacing:0;line-height:1.4}
    #libraryScreen .liftova-library-tools{position:sticky;top:0;z-index:6;margin:12px -2px 10px;padding:7px 2px 8px;background:linear-gradient(180deg,#07050d 76%,rgba(7,5,13,0));backdrop-filter:blur(12px)}
    #libraryScreen .search,#libraryScreen select{background:#100d16!important;color:#fff!important;border:1px solid #302540!important;border-radius:12px!important;min-height:44px!important;box-shadow:none!important}
    #libraryScreen .search{margin:0 0 7px!important;padding-left:13px!important}
    #libraryScreen select{margin:0!important}
    #libraryScreen .liftova-library-count{margin:7px 3px 1px;color:#81798d;font-size:9px;font-weight:760;letter-spacing:.07em;text-transform:uppercase}
    #libraryScreen .library-item{position:relative;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:9px!important;padding:9px 10px!important;margin-bottom:7px!important;background:#0e0c13!important;border:1px solid #2c2237!important;border-radius:15px!important;box-shadow:none!important;overflow:hidden;min-width:0!important}
    #libraryScreen .library-item:active{background:#14101c!important;border-color:#493361!important}
    #libraryScreen .library-preview{display:grid!important;grid-template-columns:62px minmax(0,1fr)!important;gap:10px!important;align-items:center!important;min-width:0!important;overflow:hidden!important}
    #libraryScreen .library-preview>*{min-width:0!important}
    #libraryScreen .prism-library-thumb,#libraryScreen .exercise-mini-map{grid-column:1!important;width:62px!important;height:62px!important;min-width:62px!important;max-width:62px!important;border-radius:11px!important;object-fit:cover!important;background:radial-gradient(circle at 50% 35%,rgba(129,55,255,.14),#09090e 68%)!important;border:1px solid #30243f!important;padding:2px!important}
    #libraryScreen .exercise-mini-map .body-figure{width:55px!important;margin:auto!important}
    #libraryScreen .library-name{grid-column:2!important;min-width:0!important;font-size:14px!important;font-weight:790!important;letter-spacing:-.015em!important;color:#fff!important;line-height:1.22;white-space:normal!important;overflow-wrap:anywhere!important}
    #libraryScreen .library-preview .badge{grid-column:2!important;justify-self:start!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
    #libraryScreen .badge{display:inline-flex!important;margin-top:5px!important;padding:3px 7px!important;background:rgba(123,47,245,.1)!important;color:#bda1ee!important;border:1px solid rgba(151,86,255,.22)!important;border-radius:999px!important;font-size:8px!important;font-weight:750!important;line-height:1.15!important}
    #libraryScreen .add-small{position:relative!important;z-index:2!important;min-width:58px!important;flex:0 0 auto!important;border-radius:10px!important;border:1px solid #543286!important;background:#4d1e9b!important;color:#fff!important;font-size:10px!important;font-weight:800!important;padding:9px 8px!important;box-shadow:none!important}
    #libraryScreen .add-small:active{background:#6428c2!important}
    #libraryScreen .empty{background:#0e0e16!important;border:1px dashed #352842!important;border-radius:15px!important;color:#918aa0!important;padding:18px!important}
    #exerciseInfoScreen{color:#f8f7ff;padding-bottom:100px}
    #exerciseInfoScreen>.back{color:#bca2ff!important;font-weight:760!important}
    #prismExerciseInfo>h2{font-size:26px!important;margin-bottom:4px!important;letter-spacing:-.04em!important}
    #prismExerciseInfo>.small{color:#a49cad!important;font-size:11px!important}
    #prismExerciseInfo .prism-info-photo{display:block!important;width:100%!important;max-height:275px!important;object-fit:contain!important;margin:11px 0!important;padding:7px!important;border-radius:17px!important;background:radial-gradient(circle at 50% 45%,rgba(128,45,255,.13),#09090f 66%)!important;border:1px solid #30243f!important;box-shadow:none!important}
    #prismExerciseInfo .prism-info-map{padding:11px!important;margin:9px 0!important;border-radius:15px!important;background:#0e0c13!important;border:1px solid #30243f!important}
    #prismExerciseInfo .exercise-instructions,#prismExerciseInfo .card{background:#0e0c13!important;border:1px solid #30243f!important;border-radius:15px!important;color:#fff!important;padding:14px!important;box-shadow:none!important}
    #prismExerciseInfo .exercise-instructions h3,#prismExerciseInfo .card h3{font-size:14px!important;margin-bottom:7px!important}
    #prismExerciseInfo .exercise-instructions li,#prismExerciseInfo .exercise-instructions p{color:#aaa2b5!important;line-height:1.48!important;font-size:11px!important}
    @media(max-width:430px){
      #libraryScreen .library-item{grid-template-columns:minmax(0,1fr) 58px!important;gap:8px!important;padding:8px!important}
      #libraryScreen .library-preview{grid-template-columns:58px minmax(0,1fr)!important;gap:9px!important}
      #libraryScreen .prism-library-thumb,#libraryScreen .exercise-mini-map{width:58px!important;height:58px!important;min-width:58px!important;max-width:58px!important}
      #libraryScreen .exercise-mini-map .body-figure{width:51px!important}
      #libraryScreen .library-name{font-size:13px!important}
      #libraryScreen .add-small{width:58px!important;min-width:58px!important;padding:9px 5px!important}
    }
    @media(max-width:390px){
      #libraryScreen .library-item{grid-template-columns:minmax(0,1fr) 54px!important;gap:7px!important;padding:7px!important}
      #libraryScreen .library-preview{grid-template-columns:52px minmax(0,1fr)!important;gap:8px!important}
      #libraryScreen .prism-library-thumb,#libraryScreen .exercise-mini-map{width:52px!important;height:52px!important;min-width:52px!important;max-width:52px!important}
      #libraryScreen .exercise-mini-map .body-figure{width:46px!important}
      #libraryScreen .library-name{font-size:12px!important}
      #libraryScreen .add-small{width:54px!important;min-width:54px!important;font-size:9px!important}
      .container{padding-left:13px!important;padding-right:13px!important}
    }
  `;
  document.head.appendChild(style);

  function organizeTools(screen){
    const search=document.getElementById('librarySearch');
    if(search) search.placeholder='Search exercises, muscles, equipment';
    if(!search || search.closest('.liftova-library-tools')) return;
    const tools=document.createElement('div');
    tools.className='liftova-library-tools';
    search.before(tools);
    tools.appendChild(search);
    const select=[...screen.querySelectorAll('select')].find(el=>el.closest('#libraryScreen'));
    if(select) tools.appendChild(select);
    const count=document.createElement('div');
    count.className='liftova-library-count';
    tools.appendChild(count);
  }

  function refreshCount(screen){
    const count=screen.querySelector('.liftova-library-count');
    if(!count)return;
    const items=[...screen.querySelectorAll('.library-item')].filter(el=>getComputedStyle(el).display!=='none');
    const next=`${items.length} exercise${items.length===1?'':'s'}`;
    if(count.textContent!==next)count.textContent=next;
  }

  function decorateLibrary() {
    const screen = document.getElementById('libraryScreen');
    if (!screen) return;
    screen.dataset.liftova = 'library';
    organizeTools(screen);
    refreshCount(screen);
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

  function boot(){
    const screen=document.getElementById('libraryScreen');
    if(!screen)return;
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;decorateLibrary();});
    }).observe(screen,{subtree:true,childList:true});
    screen.addEventListener('input',()=>requestAnimationFrame(()=>refreshCount(screen)));
    screen.addEventListener('change',()=>requestAnimationFrame(()=>refreshCount(screen)));
    decorateLibrary();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
