/* MYLIFTCOACH startup handoff. Owns launch presentation only. */
(() => {
  'use strict';

  const root=document.documentElement;
  root.classList.add('myliftcoach-starting');

  let revealed=false;
  let observer=null;

  function mount(){
    if(revealed||document.getElementById('myliftcoachStartupCover'))return;
    const cover=document.createElement('div');
    cover.id='myliftcoachStartupCover';
    cover.setAttribute('aria-hidden','true');
    cover.innerHTML='<div class="mlc-startup-mark"><img src="images/myliftcoach-icon.svg?v=22" alt=""><strong>MYLIFTCOACH</strong><span>TRAIN · TRACK · PROGRESS</span></div>';
    (document.body||document.documentElement).appendChild(cover);
  }

  function surfaceReady(){
    if(root.classList.contains('prism-account-booting'))return false;
    if(document.getElementById('liftovaAuthGate'))return true;
    const home=document.getElementById('home');
    if(home&&!home.classList.contains('hidden'))return !!home.querySelector('.liftova-home-shell[data-liftova-ready="true"]');
    return !!document.querySelector('#welcomeScreen:not(.hidden),#onboardingScreen:not(.hidden),#goalReviewScreen:not(.hidden),#setupScreen:not(.hidden),#workoutsScreen:not(.hidden),#workoutScreen:not(.hidden),#workoutDetailScreen:not(.hidden),#overallProgressScreen:not(.hidden),#profileScreen:not(.hidden)');
  }

  function finishReveal(){
    document.getElementById('myliftcoachStartupCover')?.remove();
    root.classList.remove('myliftcoach-starting','myliftcoach-ready');
    observer?.disconnect();
  }

  function reveal(force=false){
    if(revealed||(!force&&!surfaceReady()))return false;
    revealed=true;
    root.classList.add('myliftcoach-ready');
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)finishReveal();
    else setTimeout(finishReveal,220);
    return true;
  }

  function check(){
    if(revealed)return;
    mount();
    reveal(false);
  }

  function boot(){
    mount();
    observer=new MutationObserver(check);
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-liftova-ready']});
    check();
    // Safety valve for non-canonical/error states; normal Home launch reveals from home-ready.
    setTimeout(()=>reveal(true),1800);
  }

  if(document.body)boot();
  else document.addEventListener('DOMContentLoaded',boot,{once:true});

  document.addEventListener('myliftcoach:home-ready',()=>reveal(false));
})();
