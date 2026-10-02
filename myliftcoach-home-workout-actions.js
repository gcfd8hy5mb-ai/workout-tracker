/* Canonical MYLIFTCOACH Home workout action bridge + targeted Oct 2 UI fixes. */
(()=>{
'use strict';
const ACTIVE_KEY='prismActiveWorkoutV1';
const rawActive=()=>{try{const value=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');return value&&typeof value.key==='string'&&value.key&&Array.isArray(value.ids)&&value.ids.length?value:null}catch{return null}};
const hasCompletedWork=value=>{if(!value)return false;try{const sets=JSON.parse(localStorage.getItem('setHistoryV5')||'{}')||{};return Object.entries(sets).some(([key,set])=>key.startsWith(value.key+'-')&&set?.done===true)}catch{return false}};
/* Resume means the athlete has actually completed work in this unfinished session.
   Merely opening a workout creates prismActiveWorkoutV1, so that alone must not
   turn the Home CTA into Resume. */
const safeActive=()=>{const value=rawActive();return value&&hasCompletedWork(value)?value:null};
const home=()=>document.getElementById('home');
const shell=()=>home()?.querySelector('.liftova-home-shell');
const hiddenWorkoutAction=()=>[...(home()?.querySelectorAll('button')||[])].find(button=>!button.closest('.liftova-home-shell')&&/^(?:Start Workout|Explore Workouts|Resume Workout)$/i.test((button.textContent||'').trim()));
function wireGlobalSafeArea(){if(document.querySelector('link[data-myliftcoach-safe-area]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='ui-hotfix-oct02.css?v=3';link.dataset.myliftcoachSafeArea='true';document.head.appendChild(link)}
function injectStyle(){if(document.querySelector('style[data-myliftcoach-home-workout-action]'))return;const style=document.createElement('style');style.dataset.myliftcoachHomeWorkoutAction='true';style.textContent=`
.liftova-home-shell .myliftcoach-home-workout-action{width:100%;min-height:54px;margin:16px 0 0;border:1px solid #cf91ff;border-radius:15px;background:linear-gradient(145deg,#b56cff,#7023ef);color:#fff;font:760 15px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;letter-spacing:.025em;box-shadow:0 8px 22px rgba(112,35,239,.22);touch-action:manipulation}
.liftova-home-shell .myliftcoach-home-workout-action:active{opacity:.86;transform:none}
.liftova-home-shell .myliftcoach-home-workout-action[data-mode="browse"]{background:#18121f;border-color:#49305d;box-shadow:none}
.myliftcoach-detail-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 20px}
.myliftcoach-detail-actions button{min-height:48px;border:1px solid #49305d;border-radius:13px;background:#18121f;color:#f9f7ff;font:700 14px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif}
`;document.head.appendChild(style)}
function actionMode(){
 if(safeActive())return {mode:'resume',label:'Resume Workout'};
 const legacy=hiddenWorkoutAction(),label=(legacy?.textContent||'').trim();
 if(/explore workouts/i.test(label))return {mode:'browse',label:'Explore Workouts',legacy};
 const rest=/\brest\s*day\b/i.test(shell()?.querySelector('.lh-workout h2')?.textContent||'');
 return {mode:rest?'browse':'start',label:rest?'Browse Workouts':'Start Workout',legacy};
}
function runAction(){
 const progressed=safeActive();
 if(progressed&&typeof window.resumePrismWorkout==='function'){window.resumePrismWorkout();return}
 const saved=rawActive();
 /* An opened-but-unworked session is still the correct workout target; opening
    it from a Start CTA is a fresh start semantically, not a Resume state. */
 if(saved&&typeof window.resumePrismWorkout==='function'){window.resumePrismWorkout();return}
 const legacy=hiddenWorkoutAction(),label=(legacy?.textContent||'').trim();
 if(legacy&&!/resume workout/i.test(label)){legacy.click();return}
 if(typeof window.showWorkouts==='function')window.showWorkouts();
}
function syncDetailActions(){
 const screen=document.getElementById('workoutDetailScreen'),area=document.getElementById('prismWorkoutDetail');
 if(!screen||screen.classList.contains('hidden')||!area||area.querySelector('.myliftcoach-detail-actions'))return;
 const hero=area.querySelector('.prism-detail-hero');if(!hero)return;
 const actions=document.createElement('div');actions.className='myliftcoach-detail-actions';
 const history=document.createElement('button');history.type='button';history.textContent='History';history.setAttribute('aria-label','Workout history');history.onclick=()=>{if(typeof window.showGlobalHistory==='function')window.showGlobalHistory()};
 const progression=document.createElement('button');progression.type='button';progression.textContent='Progression';progression.setAttribute('aria-label','Workout progression');progression.onclick=()=>{if(typeof window.showOverallProgress==='function')window.showOverallProgress()};
 actions.append(history,progression);hero.insertAdjacentElement('afterend',actions);
}
let syncing=false;
function sync(){
 if(syncing)return;syncing=true;requestAnimationFrame(()=>{
  syncing=false;wireGlobalSafeArea();injectStyle();syncDetailActions();const root=shell(),card=root?.querySelector('.lh-workout');if(!card)return;
  let button=card.querySelector('.myliftcoach-home-workout-action');if(!button){button=document.createElement('button');button.type='button';button.className='myliftcoach-home-workout-action';button.addEventListener('click',runAction);card.appendChild(button)}
  const state=actionMode();if(button.textContent!==state.label)button.textContent=state.label;if(button.dataset.mode!==state.mode)button.dataset.mode=state.mode;if(button.getAttribute('aria-label')!==state.label)button.setAttribute('aria-label',state.label);
 });
}
function boot(){wireGlobalSafeArea();sync();new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});window.addEventListener('pageshow',sync,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});window.addEventListener('storage',event=>{if(event.key===ACTIVE_KEY||event.key==='setHistoryV5')sync()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
