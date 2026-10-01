/* MYLIFTCOACH startup paint stabilizer. Keeps first launch frame intentional on iOS/PWA. */
(() => {
  'use strict';
  const root=document.documentElement;
  let revealed=false;

  function mount(){
    if(document.getElementById('myliftcoachStartupCover')) return;
    root.classList.add('myliftcoach-starting');
    const cover=document.createElement('div');
    cover.id='myliftcoachStartupCover';
    cover.setAttribute('aria-hidden','true');
    cover.innerHTML='<div class="mlc-startup-mark"><img src="images/myliftcoach-icon.svg?v=10" alt=""><strong>MYLIFTCOACH</strong></div>';
    (document.body||document.documentElement).appendChild(cover);

    // The legacy account boot state hides the full body and produces the black flash.
    // The startup cover now owns the visual handoff while state/layout settle.
    root.classList.remove('prism-account-booting');
  }

  function reveal(){
    if(revealed) return;
    revealed=true;
    const cover=document.getElementById('myliftcoachStartupCover');
    if(!cover){root.classList.remove('myliftcoach-starting');return;}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      setTimeout(()=>{
        root.classList.add('myliftcoach-ready');
        setTimeout(()=>{
          cover.remove();
          root.classList.remove('myliftcoach-starting','myliftcoach-ready');
        },170);
      },70);
    }));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();

  if(document.readyState==='complete') reveal();
  else window.addEventListener('load',reveal,{once:true});

  // iOS safety valve: never leave the app covered if a resource stalls.
  setTimeout(reveal,1600);
})();
