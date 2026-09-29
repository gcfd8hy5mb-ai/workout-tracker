/* LIFTOVA App Feel V2 — UI shell only. Never reads/writes workout, Coach, auth, Supabase, or persistence state. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
 root.classList.toggle('liftova-standalone',standalone);
 const syncViewport=()=>{const vv=window.visualViewport;const h=vv?.height||window.innerHeight;root.style.setProperty('--liftova-vh',`${h*.01}px`);root.style.setProperty('--liftova-keyboard-offset',`${Math.max(0,window.innerHeight-h-(vv?.offsetTop||0))}px`)};
 syncViewport();
 window.visualViewport?.addEventListener('resize',syncViewport,{passive:true});
 window.visualViewport?.addEventListener('scroll',syncViewport,{passive:true});
 window.addEventListener('orientationchange',()=>setTimeout(syncViewport,80),{passive:true});
 let lastTap=0;
 document.addEventListener('touchend',event=>{const control=event.target.closest?.('button,[role="button"],a,.day-button,.action-button');if(!control)return;const now=Date.now();if(now-lastTap<280)event.preventDefault();lastTap=now},{passive:false});
 // Keep focused form controls visible when the iOS keyboard opens.
 document.addEventListener('focusin',event=>{const el=event.target;if(!el?.matches?.('input,textarea,select,[contenteditable="true"]'))return;setTimeout(()=>el.scrollIntoView?.({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}),120)});
 // Escape closes native dialogs where supported; existing custom modal logic remains untouched.
 document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const dialog=document.querySelector('dialog[open]');if(dialog?.close)dialog.close()});
 // Reflect existing aria-busy state visually without changing application state.
 const syncBusy=el=>el instanceof HTMLElement&&el.classList.toggle('liftova-busy',el.getAttribute('aria-busy')==='true');
 document.querySelectorAll('[aria-busy]').forEach(syncBusy);
 new MutationObserver(records=>records.forEach(r=>syncBusy(r.target))).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['aria-busy']});
 // Mark external web links so installed-mode CSS/UX can distinguish them later; no navigation interception.
 document.querySelectorAll('a[href]').forEach(a=>{try{const u=new URL(a.href,location.href);if(u.origin!==location.origin)a.dataset.liftovaExternal='true'}catch{}});
})();
