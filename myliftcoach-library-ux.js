// MYLIFTCOACH exercise-library UX polish. Presentation and interaction only.
(() => {
  'use strict';

  let lastLibraryFocus=null;

  function visibleItems(screen){
    return [...screen.querySelectorAll('.library-item')].filter(item=>getComputedStyle(item).display!=='none');
  }

  function updateCount(screen){
    const count=screen.querySelector('.liftova-library-count');
    if(!count)return;
    const total=visibleItems(screen).length;
    const label=`${total} exercise${total===1?'':'s'}`;
    if(count.textContent!==label)count.textContent=label;
    count.setAttribute('role','status');
    count.setAttribute('aria-live','polite');
  }

  function ensureClearButton(screen){
    const search=document.getElementById('librarySearch');
    const tools=search?.closest('.liftova-library-tools');
    if(!search||!tools||tools.querySelector('.mlc-library-clear'))return;
    const wrap=document.createElement('div');
    wrap.className='mlc-library-search-wrap';
    search.before(wrap);
    wrap.appendChild(search);
    const clear=document.createElement('button');
    clear.type='button';
    clear.className='mlc-library-clear';
    clear.setAttribute('aria-label','Clear exercise search');
    clear.textContent='×';
    clear.hidden=!search.value;
    wrap.appendChild(clear);
    const sync=()=>{clear.hidden=!search.value;updateCount(screen);};
    search.addEventListener('input',()=>requestAnimationFrame(sync));
    clear.addEventListener('click',()=>{
      search.value='';
      search.dispatchEvent(new Event('input',{bubbles:true}));
      search.focus({preventScroll:true});
      requestAnimationFrame(sync);
    });
  }

  function activateCard(item,event){
    if(event?.target?.closest?.('button,a,input,select,textarea'))return;
    const action=item.querySelector('button,a,[role="button"]');
    if(action){action.click();return;}
    item.click?.();
  }

  function decorateCards(screen){
    screen.querySelectorAll('.library-item').forEach(item=>{
      if(item.dataset.mlcLibraryUx==='1')return;
      item.dataset.mlcLibraryUx='1';
      item.tabIndex=0;
      item.setAttribute('role','button');
      const name=(item.querySelector('.library-name')?.textContent||'Exercise').trim();
      item.setAttribute('aria-label',`View ${name}`);
      item.addEventListener('click',()=>{lastLibraryFocus=item;});
      item.addEventListener('keydown',event=>{
        if(event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();
        lastLibraryFocus=item;
        activateCard(item,event);
      });
    });
  }

  function decorateDetail(){
    const detail=document.getElementById('exerciseInfoScreen');
    if(!detail)return;
    const back=detail.querySelector('.back');
    if(back&&!back.dataset.mlcLibraryBack){
      back.dataset.mlcLibraryBack='1';
      back.addEventListener('click',()=>setTimeout(()=>lastLibraryFocus?.focus?.({preventScroll:true}),0));
    }
    const heading=detail.querySelector('#prismExerciseInfo h2, h2');
    if(heading&&!heading.hasAttribute('tabindex'))heading.tabIndex=-1;
    detail.querySelectorAll('.exercise-instructions li').forEach((li,index)=>{
      if(!li.dataset.mlcStep){
        li.dataset.mlcStep='1';
        li.setAttribute('aria-label',`Step ${index+1}: ${(li.textContent||'').trim()}`);
      }
    });
  }

  function decorate(){
    const screen=document.getElementById('libraryScreen');
    if(!screen)return;
    screen.classList.add('mlc-library-ready');
    const heading=screen.querySelector('h2');
    if(heading&&!heading.id)heading.id='mlcLibraryTitle';
    screen.setAttribute('aria-labelledby',heading?.id||'mlcLibraryTitle');
    ensureClearButton(screen);
    decorateCards(screen);
    updateCount(screen);
    decorateDetail();
  }

  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;decorate();});
  };

  function boot(){
    decorate();
    const library=document.getElementById('libraryScreen');
    if(library)new MutationObserver(schedule).observe(library,{subtree:true,childList:true});
    const detail=document.getElementById('exerciseInfoScreen');
    if(detail)new MutationObserver(schedule).observe(detail,{subtree:true,childList:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
