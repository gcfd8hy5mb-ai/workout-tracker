/* MYLIFTCOACH onboarding bridge: restyles and rebrands existing onboarding without changing stored data semantics. */
(() => {
  'use strict';
  const ACTIVE='prism-onboarding-active';

  function activeShell(){
    return [document.getElementById('welcomeScreen'),document.getElementById('onboardingScreen'),document.getElementById('goalReviewScreen')]
      .find(shell=>shell&&!shell.classList.contains('hidden'))||document.getElementById('onboardingScreen');
  }

  function brandJourney(){
    for(const shell of [document.getElementById('welcomeScreen'),document.getElementById('onboardingScreen'),document.getElementById('goalReviewScreen')]){
      if(!shell)continue;
      shell.querySelectorAll('.journey-brand strong').forEach(el=>{el.textContent='MYLIFTCOACH'});
      shell.querySelectorAll('.journey-brand small').forEach(el=>{el.textContent='Train · Track · Progress'});
      shell.querySelectorAll('.journey-brand img').forEach(el=>{el.alt='MYLIFTCOACH logo'});
    }
    const area=document.getElementById('prismJourneyContent');
    if(area){
      const replaceText=(from,to)=>{
        const walker=document.createTreeWalker(area,NodeFilter.SHOW_TEXT);
        const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
        nodes.forEach(node=>{if(node.nodeValue&&node.nodeValue.includes(from))node.nodeValue=node.nodeValue.split(from).join(to)});
      };
      replaceText('PRISM','MYLIFTCOACH');
      replaceText('LIFTOVA','MYLIFTCOACH');
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

  function decorateProgress(){
    const shell=activeShell();
    const progress=shell?.querySelector('.journey-progress');
    if(!progress)return;
    const dots=[...progress.querySelectorAll('span')];
    const completed=dots.filter(dot=>dot.classList.contains('done')).length;
    progress.setAttribute('role','progressbar');
    progress.setAttribute('aria-label','Onboarding progress');
    progress.setAttribute('aria-valuemin','0');
    progress.setAttribute('aria-valuemax',String(dots.length));
    progress.setAttribute('aria-valuenow',String(completed));
    progress.setAttribute('aria-valuetext',`Step ${Math.min(completed+1,dots.length)} of ${dots.length}`);
  }

  function decorateOptions(){
    const shell=activeShell();
    if(!shell)return;
    shell.querySelectorAll('.journey-option').forEach(option=>{
      option.setAttribute('role','button');
      if(!option.hasAttribute('aria-pressed'))option.setAttribute('aria-pressed','false');
      option.setAttribute('tabindex','0');
    });
    shell.querySelectorAll('.journey-actions button,.journey-primary,.journey-secondary').forEach(button=>{
      button.classList.add('myliftcoach-touch-target');
    });
  }

  function focusHeading(){
    const shell=activeShell();
    const heading=shell?.querySelector('#prismJourneyContent h2,#prismGoalReviewContent h2,h2');
    if(!heading)return;
    heading.setAttribute('tabindex','-1');
    if(!shell.dataset.myliftcoachStepFocus){
      shell.dataset.myliftcoachStepFocus='1';
      requestAnimationFrame(()=>heading.focus({preventScroll:true}));
    }
  }

  function sync(){
    brandJourney();
    decorateProgress();
    decorateOptions();
    focusHeading();
    document.body.classList.toggle('myliftcoach-onboarding-ready',document.body.classList.contains(ACTIVE));
  }

  function bindInteractions(){
    document.addEventListener('click',event=>{
      const option=event.target.closest?.('.journey-option');
      if(option){
        const group=option.closest('.journey-card,#prismJourneyContent,#prismGoalReviewContent')||option.parentElement;
        group?.querySelectorAll('.journey-option').forEach(item=>item.setAttribute('aria-pressed',String(item===option)));
        option.classList.add('myliftcoach-option-tapped');
        setTimeout(()=>option.classList.remove('myliftcoach-option-tapped'),140);
      }
      const nav=event.target.closest?.('.journey-actions button,.journey-primary,.journey-secondary');
      if(nav)setTimeout(()=>{document.querySelectorAll('[data-myliftcoach-step-focus]').forEach(el=>delete el.dataset.myliftcoachStepFocus);sync();},0);
    });
    document.addEventListener('keydown',event=>{
      const option=event.target.closest?.('.journey-option');
      if(option&&(event.key==='Enter'||event.key===' ')){
        event.preventDefault();
        option.click();
      }
    });
  }

  function loadStyle(){
    if(document.querySelector('link[data-liftova-onboarding]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='liftova-onboarding.css?v=2';link.dataset.liftovaOnboarding='1';document.head.appendChild(link);
  }

  loadStyle();
  bindInteractions();
  sync();
  const target=document.getElementById('prismJourneyContent')||document.body;
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;sync();});
  });
  observer.observe(target,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','aria-pressed']});
})();
