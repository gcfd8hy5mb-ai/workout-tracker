/* LIFTOVA onboarding bridge: restyles and rebrands existing onboarding without changing stored data semantics. */
(() => {
  'use strict';
  function brandJourney(){
    for(const shell of [document.getElementById('welcomeScreen'),document.getElementById('onboardingScreen'),document.getElementById('goalReviewScreen')]){
      if(!shell)continue;
      shell.querySelectorAll('.journey-brand strong').forEach(el=>{el.textContent='LIFTOVA'});
      shell.querySelectorAll('.journey-brand small').forEach(el=>{el.textContent='Train · Track · Progress'});
      shell.querySelectorAll('.journey-brand img').forEach(el=>{el.alt='LIFTOVA logo'});
    }
    const area=document.getElementById('prismJourneyContent');
    if(area){
      const replaceText=(from,to)=>{
        const walker=document.createTreeWalker(area,NodeFilter.SHOW_TEXT);
        const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
        nodes.forEach(node=>{if(node.nodeValue&&node.nodeValue.includes(from))node.nodeValue=node.nodeValue.split(from).join(to)});
      };
      replaceText('PRISM','LIFTOVA');
      const h2=area.querySelector('h2');
      if(h2){
        const t=h2.textContent.trim();
        if(t==='What are you training for?')h2.textContent="WHAT'S YOUR GOAL?";
        if(t==='What best describes your current body goal?')h2.textContent='WHAT DO YOU WANT TO CHANGE?';
        if(t==='How long do you want to follow this goal?')h2.textContent='HOW LONG DO YOU WANT TO COMMIT?';
        if(t==='Set a starting calorie target')h2.textContent='SET YOUR STARTING TARGET';
        if(t==='Set up your training')h2.textContent='BUILD YOUR TRAINING SETUP';
      }
    }
  }
  function loadStyle(){
    if(document.querySelector('link[data-liftova-onboarding]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='liftova-onboarding.css';link.dataset.liftovaOnboarding='1';document.head.appendChild(link);
  }
  loadStyle();
  brandJourney();
  const target=document.getElementById('prismJourneyContent')||document.body;
  const observer=new MutationObserver(()=>brandJourney());
  observer.observe(target,{childList:true,subtree:true,characterData:true});
})();
