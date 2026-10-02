// Canonical MYLIFTCOACH Home dashboard. Presentation only; existing workout/data engines stay intact.
(() => {
'use strict';

const addStyles=()=>{if(document.querySelector('link[data-liftova-home]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='liftova-home.css?v=13';l.dataset.liftovaHome='true';document.head.appendChild(l)};
const safeJson=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date();
const history=()=>{for(const k of['workoutHistoryV52','workoutHistory']){const v=safeJson(k,null);if(Array.isArray(v))return v}return[]};
const customWorkouts=()=>{const v=safeJson('customWorkoutsV5',[]);return Array.isArray(v)?v.filter(w=>w&&w.name&&Array.isArray(w.exercises)&&w.exercises.length):[]};
const weekStart=()=>{const n=today(),s=new Date(n);s.setHours(0,0,0,0);s.setDate(n.getDate()-((n.getDay()+6)%7));return s};
const weekHistory=()=>{const s=weekStart(),n=today();return history().filter(i=>{const r=i?.date||i?.completedAt||i?.day||i?.timestamp,d=r?new Date(r):null;return d&&Number.isFinite(d.getTime())&&d>=s&&d<=n})};
const workoutCountThisWeek=()=>weekHistory().length;
const streak=()=>{const days=new Set(history().map(i=>{const r=i?.date||i?.completedAt||i?.day||i?.timestamp,d=r?new Date(r):null;return d&&Number.isFinite(d.getTime())?`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`:null}).filter(Boolean));if(!days.size)return 0;let c=0;const d=today();d.setHours(12,0,0,0);for(let i=0;i<366;i++){const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;if(!days.has(k)){if(i===0){d.setDate(d.getDate()-1);continue}break}c++;d.setDate(d.getDate()-1)}return c};
const planDays=()=>{for(const k of['workoutGoalsV1','prismWorkoutGoalsV1']){const g=safeJson(k,{}),d=Number(g?.days||g?.trainingDays);if(Number.isFinite(d)&&d>0)return d}return 4};

function rowsFromIds(ids){
  if(typeof exerciseLibrary==='undefined')return [];
  return (ids||[]).map(id=>{const ex=exerciseLibrary.find(item=>String(item.id)===String(id));return ex?{title:ex.name||id,muscle:ex.muscle||''}:{title:String(id),muscle:''}});
}

function nextCustomWorkout(){
  const customs=customWorkouts();
  if(!customs.length)return null;
  const appHistory=typeof workoutHistory!=='undefined'&&Array.isArray(workoutHistory)?workoutHistory:history();
  const keys=new Set(customs.map(w=>'custom-'+w.id));
  const last=appHistory.find(session=>keys.has(session?.workoutKey));
  const lastIndex=customs.findIndex(w=>'custom-'+w.id===last?.workoutKey);
  const next=customs[(lastIndex+1)%customs.length]||customs[0];
  const rows=rowsFromIds(next.exercises);
  return rows.length?{name:next.name,rows,workoutKey:'custom-'+next.id,kind:'custom'}:null;
}

function nextPlanWorkout(){
  try{
    if(typeof presetWorkouts==='undefined'||typeof exerciseLibrary==='undefined')return null;
    let plans=[];
    if(typeof workoutGoals!=='undefined'&&workoutGoals&&!workoutGoals.skipped){
      if(workoutGoals.basic){
        plans=Object.entries(presetWorkouts).map(([key,day])=>({workoutKey:'preset-'+key,title:day.title,ids:day.exercises}));
      }else if(typeof suggestedWorkouts==='function'){
        plans=suggestedWorkouts(workoutGoals).map((day,index)=>({workoutKey:typeof suggestedWorkoutKey==='function'?suggestedWorkoutKey(index):'suggested-'+index,title:day.title,ids:day.exercises}));
      }
    }
    if(!plans.length)return null;
    const appHistory=typeof workoutHistory!=='undefined'&&Array.isArray(workoutHistory)?workoutHistory:history();
    const last=appHistory.find(session=>plans.some(plan=>plan.workoutKey===session?.workoutKey));
    const lastIndex=plans.findIndex(plan=>plan.workoutKey===last?.workoutKey);
    const next=plans[(lastIndex+1)%plans.length]||plans[0];
    const rows=rowsFromIds(next.ids);
    return rows.length?{name:next.title,rows,workoutKey:next.workoutKey,kind:'plan'}:null;
  }catch{return null}
}

function scheduledToday(){
  // User-created workouts are authoritative. Presets/suggested plans are only a fallback.
  return nextCustomWorkout()||nextPlanWorkout();
}

function legacySnapshot(home){
  const text=(home?.innerText||'').replace(/\s+/g,' ').trim();
  const workoutHeading=[...(home?.querySelectorAll('h2,h3,strong')||[])]
    .filter(e=>!e.closest('.liftova-home-shell'))
    .map(e=>(e.textContent||'').trim())
    .find(v=>/day\s*\d|upper body|lower body|push|pull|legs|full body|rest day/i.test(v))||'Today’s Workout';
  const detail=text.match(/\d+\s+exercises?\s*[·•-]\s*(?:about\s*)?\d+\s*min/i)?.[0]||'';
  return{workoutHeading,detail};
}

function actualToday(home){
  const scheduled=scheduledToday();
  if(scheduled)return scheduled;
  const candidates=[];
  const add=(name,root)=>{
    if(!root||root.closest?.('.liftova-home-shell'))return;
    const exercises=[...root.querySelectorAll?.('.exercise,.builder-exercise,[data-exercise-id],.workout-exercise')||[]];
    if(!exercises.length)return;
    const rows=exercises.map(el=>({
      title:(el.querySelector('.exercise-title,.library-name,strong,h3,h4')?.textContent||el.dataset?.exerciseName||'').trim(),
      muscle:(el.querySelector('.muscle,.badge,[data-muscle]')?.textContent||el.dataset?.muscle||'').trim()
    })).filter(x=>x.title);
    if(rows.length)candidates.push({name,rows,kind:'legacy'});
  };
  [...home.children].forEach(el=>{if(el.classList?.contains('liftova-home-shell'))return;const name=(el.querySelector?.('h2,h3,.workout-title,.day-title')?.textContent||'').trim();add(name,el)});
  return candidates[0]||null;
}

function workoutSnapshot(home){
  const actual=actualToday(home),legacy=legacySnapshot(home);
  if(actual){
    const groups={};
    actual.rows.forEach(row=>String(row.muscle||'').split(/[·,\/]/).map(s=>s.trim()).filter(Boolean).forEach(s=>groups[s]=(groups[s]||0)+1));
    return{name:actual.name||legacy.workoutHeading,exercises:actual.rows.length,muscles:Object.keys(groups).slice(0,4).join(' · '),overview:Object.entries(groups).slice(0,5),kind:actual.kind||'workout'};
  }
  const isRest=/\brest\s*day\b/i.test(legacy.workoutHeading);
  if(isRest)return{name:'Rest Day',exercises:0,minutes:0,muscles:'Recovery · No workout scheduled',overview:[],kind:'rest'};
  const detail=legacy.detail.match(/(\d+)\s+exercises?.*?(\d+)\s*min/i);
  return{name:legacy.workoutHeading,exercises:Number(detail?.[1])||0,minutes:Number(detail?.[2])||0,muscles:'',overview:[],kind:'legacy'};
}

const defaultWeekLabels=['Upper','Lower','Rest','Upper','Lower','Rest','Rest'];
const weekIcons=['⌁','♙','⌁','◎','♙','⌁','◎'];
function weekMarkup(){
  const n=today(),customs=customWorkouts();
  return ['MON','TUE','WED','THU','FRI','SAT','SUN'].map((label,i)=>{
    const active=i===(n.getDay()+6)%7;
    let dayLabel=defaultWeekLabels[i];
    if(customs.length){
      if(active){const next=nextCustomWorkout();dayLabel=next?.name||'Custom'}
      else dayLabel='Custom';
    }
    return `<div class="lh-day ${active?'active':''}"><strong>${label}</strong><b>${weekIcons[i]}</b><span>${esc(dayLabel)}</span></div>`;
  }).join('');
}

const workoutMuscles=name=>/lower|leg/i.test(name)?'Quads · Hamstrings · Glutes · Calves':/push/i.test(name)?'Chest · Shoulders · Triceps':/pull/i.test(name)?'Back · Biceps · Rear Delts':'Chest · Back · Shoulders · Arms';
const chartBars=()=>[46,18,30,64,40,14,28].map((h,i)=>`<i style="height:${h}%"><span>${['M','T','W','T','F','S','S'][i]}</span></i>`).join('');

function lowerDashboard(days,workouts){
  const week=weekHistory();let sets=0,volume=0,minutes=0;const recent=[];
  for(const session of week){minutes+=Number(session?.durationMinutes||session?.minutes||0)||0;for(const ex of session?.exercises||[]){const valid=(ex?.sets||[]).filter(s=>Number(s?.reps)>0);sets+=valid.length;volume+=valid.reduce((sum,s)=>sum+(Number(s?.weight)||0)*(Number(s?.reps)||0),0);if(recent.length<3)recent.push({name:ex?.name||'Exercise',sets:valid.length,reps:valid[0]?.reps||10,weight:valid[0]?.weight||0})}}
  const recentRows=(recent.length?recent:[{name:'No workouts logged yet',sets:0,reps:0,weight:0}]).map(r=>`<div class="lh-recent-row"><span class="lh-recent-icon">▥</span><p><b>${esc(r.name)}</b><small>${r.sets?`${r.sets} sets · ${r.reps} reps${r.weight?` · ${r.weight} lb`:''}`:'Complete a workout to see performance'}</small></p>${r.weight?'<em>↗</em>':''}</div>`).join('');
  const pct=Math.min(100,Math.round(workouts/Math.max(days,1)*100));
  return `<div class="lh-lower-grid"><section class="lh-lower-card" data-lh-action="analytics" role="button" tabindex="0"><header><b>↗</b><strong>RECENT PERFORMANCE</strong><span>›</span></header>${recentRows}</section><section class="lh-lower-card" data-lh-action="analytics" role="button" tabindex="0"><header><b>◴</b><strong>THIS WEEK</strong><span>›</span></header><div class="lh-week-stat"><p><span>Workouts</span><b>${workouts} / ${days}</b></p><i><u style="width:${pct}%"></u></i></div><div class="lh-week-stat"><p><span>Sets</span><b>${sets}</b></p><i><u style="width:${Math.min(100,sets/Math.max(days*15,1)*100)}%"></u></i></div><div class="lh-week-stat"><p><span>Volume</span><b>${Math.round(volume).toLocaleString()} lb</b></p><i><u style="width:${Math.min(100,volume/30000*100)}%"></u></i></div><div class="lh-week-stat"><p><span>Time</span><b>${minutes} min</b></p><i><u style="width:${Math.min(100,minutes/240*100)}%"></u></i></div></section></div><div class="lh-shortcuts"><button data-lh-action="library"><b>▥</b><span>EXERCISE<br>LIBRARY</span><i>›</i></button><button data-lh-action="plan"><b>▣</b><span>MY PLAN</span><i>›</i></button><button data-lh-action="progress"><b>↗</b><span>PROGRESS</span><i>›</i></button></div>`;
}

const legacyHeaders=new Map();
function syncHomeChrome(){const home=document.getElementById('home'),visible=home&&!home.classList.contains('hidden');document.body.classList.toggle('liftova-home-visible',!!visible);document.querySelectorAll('header').forEach(header=>{if(header.closest('.liftova-home-shell'))return;const isLegacyChrome=header.matches('.app-header,.prism-header,[data-prism-header]')||header.querySelector('.menu-toggle,.header-today')||/THIS\s+WEEK/i.test(header.textContent||'');if(!isLegacyChrome)return;if(!legacyHeaders.has(header))legacyHeaders.set(header,header.style.display||'');if(visible){header.style.setProperty('display','none','important');header.setAttribute('aria-hidden','true')}else{const prior=legacyHeaders.get(header);header.style.removeProperty('display');if(prior)header.style.display=prior;header.setAttribute('aria-hidden','false')}})}
function openLegacyMenu(){if(typeof window.openMenu==='function'){window.openMenu();return}const toggle=document.querySelector('.menu-toggle,#menuToggle,[aria-label*="menu" i]:not(.lh-hero-menu)');if(toggle){toggle.click();return}const menu=document.getElementById('sideMenu'),scrim=document.getElementById('menuScrim');if(menu){menu.classList.add('open','active');menu.setAttribute('aria-hidden','false');menu.style.transform='translateX(0)'}if(scrim){scrim.classList.add('show','active');scrim.hidden=false}}
function openAnalytics(){if(typeof window.showOverallProgress==='function'){window.showOverallProgress();return}const progress=document.querySelector('[data-prism-tab="Progress"]');if(progress){progress.click();return}if(typeof window.showScreen==='function')window.showScreen('overallProgressScreen')}
function bindActions(shell){shell.querySelector('[data-lh-action="menu"]')?.addEventListener('click',openLegacyMenu);shell.querySelector('[data-lh-action="profile"]')?.addEventListener('click',()=>{if(typeof window.showProfile==='function')window.showProfile();else document.querySelector('[data-prism-tab="Settings"]')?.click()});shell.querySelector('[data-lh-action="library"]')?.addEventListener('click',()=>{if(typeof window.showExerciseLibrary==='function')window.showExerciseLibrary();else if(typeof window.showLibrary==='function')window.showLibrary()});shell.querySelector('[data-lh-action="plan"]')?.addEventListener('click',()=>document.querySelector('[data-prism-tab="Workout"],[data-prism-tab="Workouts"]')?.click());shell.querySelector('[data-lh-action="progress"]')?.addEventListener('click',openAnalytics);shell.querySelectorAll('[data-lh-action="analytics"]').forEach(card=>{card.addEventListener('click',openAnalytics);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openAnalytics()}})})}

function render(){
  const home=document.getElementById('home');if(!home)return;
  addStyles();
  const data=workoutSnapshot(home),days=planDays(),workouts=workoutCountThisWeek();
  const isRest=data.kind==='rest';
  const name=String(data.name||'Today’s Workout').toUpperCase();
  const count=isRest?0:(data.exercises||0);
  const muscles=isRest?'Recovery · No workout scheduled':(data.muscles||workoutMuscles(name));
  const minutes=isRest?0:(data.minutes||Math.max(30,count*6));
  const overview=isRest?'':(data.overview.length?data.overview.map(([m,n])=>`<li>${esc(m)}: ${n} exercise${n===1?'':'s'}</li>`).join(''):muscles.split(' · ').filter(Boolean).map(m=>`<li>${esc(m)}</li>`).join(''));
  const current=home.querySelector('.liftova-home-shell'),shell=current||document.createElement('div');
  shell.className='liftova-home-shell';
  shell.innerHTML=`<section class="lh-hero"><button class="lh-hero-menu" data-lh-action="menu" aria-label="Open menu"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h11"/></svg></button><button class="lh-hero-profile" data-lh-action="profile" aria-label="Open profile"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 21c.7-4 3-6 7-6s6.3 2 7 6"/></svg></button><div class="lh-hero-mark"><img src="images/myliftcoach-icon.svg?v=22" alt="MYLIFTCOACH"></div><strong>MYLIFTCOACH</strong><span>TRAIN <i>•</i> TRACK <i>•</i> PROGRESS</span></section><div class="lh-week">${weekMarkup()}</div><section class="lh-workout"><div class="lh-label">TODAY’S WORKOUT</div><h2>${esc(name)}</h2><p>${esc(muscles)}</p>${isRest?'':`<div class="lh-meta"><span><b>◴</b>${minutes} min<small>EST. TIME</small></span><span><b>▥</b>${count||'—'} exercises<small>TOTAL</small></span><span><b>◎</b>Hypertrophy<small>FOCUS</small></span></div><div class="lh-overview"><strong>WORKOUT OVERVIEW</strong><ul>${overview}</ul></div>`}</section><div class="lh-insights"><section class="lh-progress" data-lh-action="analytics" role="button" tabindex="0"><header><b>↗</b><strong>WEEKLY PROGRESS</strong><span>›</span></header><div class="lh-chart">${chartBars()}</div></section><section class="lh-streak" data-lh-action="analytics" role="button" tabindex="0"><header><b>🔥</b><strong>WORKOUT STREAK</strong><span>›</span></header><div class="lh-streak-body"><div><strong>${streak()}</strong><small>DAYS</small></div><div class="lh-ring" style="--pct:${Math.min(100,(workouts/Math.max(days,1))*100)}%"></div></div></section></div>${lowerDashboard(days,workouts)}`;
  if(!current)home.prepend(shell);
  bindActions(shell);
  document.body.classList.add('liftova-ui');home.classList.add('liftova-home');syncHomeChrome();
}

function refreshHome(){render();syncHomeChrome()}
function settleHome(){refreshHome();setTimeout(syncHomeChrome,150);setTimeout(syncHomeChrome,600)}
function loadProfileBranding(){if(document.querySelector('script[data-liftova-profile-branding]'))return;const s=document.createElement('script');s.src='liftova-profile-branding.js?v=1';s.dataset.liftovaProfileBranding='true';document.body.appendChild(s)}
function boot(){settleHome();loadProfileBranding();const home=document.getElementById('home');if(home)new MutationObserver(syncHomeChrome).observe(home,{attributes:true,attributeFilter:['class']});const originalGoHome=window.goHome;if(typeof originalGoHome==='function'&&!originalGoHome.__liftovaWrapped){const wrapped=function(...args){const result=originalGoHome.apply(this,args);requestAnimationFrame(settleHome);return result};wrapped.__liftovaWrapped=true;window.goHome=wrapped}const originalShowScreen=window.showScreen;if(typeof originalShowScreen==='function'&&!originalShowScreen.__liftovaHomeChrome){const wrapped=function(...args){const result=originalShowScreen.apply(this,args);requestAnimationFrame(()=>{syncHomeChrome();if(args[0]==='home')settleHome()});return result};wrapped.__liftovaHomeChrome=true;window.showScreen=wrapped}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();