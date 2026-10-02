/* Canonical MYLIFTCOACH Home workout action bridge.
   Keeps the calendar Home as the only visible Home while delegating start/resume
   to the existing workout engine and its authoritative custom-plan precedence. */
(()=>{
'use strict';
const ACTIVE_KEY='prismActiveWorkoutV1';
const safeActive=()=>{try{const value=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');return value&&typeof value.key==='string'&&value.key&&Array.isArray(value.ids)&&value.ids.length>0&&Number.isFinite(Number(value.startedAt))&&Number(value.startedAt)>0?value:null}catch{return null}};
const home=()=>document.getElementById('home');
const shell=()=>home()?.querySelector('.liftova-home-shell');
const hiddenWorkoutAction=()=>[...(home()?.querySelectorAll('button')||[])].find(button=>!button.closest('.liftova-home-shell')&&/^(?:Start Workout|Explore Workouts|Resume Workout)$/i.test((button.textContent||'').trim()));
function wireGlobalSafeArea(){if(document.querySelector('link[data-myliftcoach-safe-area]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='ui-hotfix-oct02.css?v=2';link.dataset.myliftcoachSafeArea='true';document.head.appendChild(link)}
function injectStyle(){if(document.querySelector('style[data-myliftcoach-home-workout-action]'))return;const style=document.createElement('style');style.dataset.myliftcoachHomeWorkoutAction='true';style.textContent=`
.liftova-home-shell .myliftcoach-home-workout-action{width:100%;min-height:54px;margin:16px 0 0;border:1px solid #cf91ff;border-radius:15px;background:linear-gradient(145deg,#b56cff,#7023ef);color:#fff;font:760 15px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;letter-spacing:.025em;box-shadow:0 8px 22px rgba(112,35,239,.22);touch-action:manipulation}
.liftova-home-shell .myliftcoach-home-workout-action:active{opacity:.86;transform:none}
.liftova-home-shell .myliftcoach-home-workout-action[data-mode="browse"]{background:#18121f;border-color:#49305d;box-shadow:none}
`;document.head.appendChild(style)}
function actionMode(){
 if(safeActive())return {mode:'resume',label:'Resume Workout'};
 const legacy=hiddenWorkoutAction(),label=(legacy?.textContent||'').trim();
 if(/start workout/i.test(label))return {mode:'start',label:'Start Workout',legacy};
 if(/explore workouts/i.test(label))return {mode:'browse',label:'Explore Workouts',legacy};
 const rest=/\brest\s*day\b/i.test(shell()?.querySelector('.lh-workout h2')?.textContent||'');
 return {mode:rest?'browse':'start',label:rest?'Browse Workouts':'Start Workout',legacy:null};
}
function runAction(){
 const active=safeActive();
 if(active&&typeof window.resumePrismWorkout==='function'){window.resumePrismWorkout();return}
 const legacy=hiddenWorkoutAction();
 if(legacy){legacy.click();return}
 if(typeof window.showWorkouts==='function')window.showWorkouts();
}
let syncing=false;
function sync(){
 if(syncing)return;syncing=true;requestAnimationFrame(()=>{
  syncing=false;wireGlobalSafeArea();injectStyle();const root=shell(),card=root?.querySelector('.lh-workout');if(!card)return;
  let button=card.querySelector('.myliftcoach-home-workout-action');if(!button){button=document.createElement('button');button.type='button';button.className='myliftcoach-home-workout-action';button.addEventListener('click',runAction);card.appendChild(button)}
  const state=actionMode();if(button.textContent!==state.label)button.textContent=state.label;if(button.dataset.mode!==state.mode)button.dataset.mode=state.mode;if(button.getAttribute('aria-label')!==state.label)button.setAttribute('aria-label',state.label);
 });
}
function boot(){wireGlobalSafeArea();sync();const target=home();if(target)new MutationObserver(sync).observe(target,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});window.addEventListener('pageshow',sync,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});window.addEventListener('storage',event=>{if(event.key===ACTIVE_KEY)sync()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
