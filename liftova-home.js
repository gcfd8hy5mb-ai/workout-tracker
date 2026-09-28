// Canonical LIFTOVA Home dashboard. Presentation only; existing workout/data engines stay intact.
(() => {
'use strict';
const addStyles=()=>{if(document.querySelector('link[data-liftova-home]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='liftova-home.css?v=8';l.dataset.liftovaHome='true';document.head.appendChild(l)};
const safeJson=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const today=()=>new Date();
function legacySnapshot(home){const text=(home?.innerText||'').replace(/\s+/g,' ').trim();const workoutHeading=[...(home?.querySelectorAll('h2,h3,strong')||[])].map(e=>(e.textContent||'').trim()).find(v=>/day\s*\d|upper body|lower body|push|pull|legs|full body/i.test(v))||'Upper Body';const detail=text.match(/\d+\s+exercises?\s*[·•-]\s*(?:about\s*)?\d+\s*min/i)?.[0]||'';return{workoutHeading,detail}}
const history=()=>{for(const k of['workoutHistoryV52','workoutHistory']){const v=safeJson(k,null);if(Array.isArray(v))return v}return[]};
const weekStart=()=>{const n=today(),s=new Date(n);s.setHours(0,0,0,0);s.setDate(n.getDate()-((n.getDay()+6)%7));return s};
const workoutCountThisWeek=()=>{const s=weekStart(),n=today();return history().filter(i=>{const r=i?.date||i?.completedAt||i?.day||i?.timestamp,d=r?new Date(r):null;return d&&Number.isFinite(d.getTime())&&d>=s&&d<=n}).length};
const streak=()=>{const days=new Set(history().map(i=>{const r=i?.date||i?.completedAt||i?.day||i?.timestamp,d=r?new Date(r):null;return d&&Number.isFinite(d.getTime())?`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`:null}).filter(Boolean));if(!days.size)return 0;let c=0;const d=today();d.setHours(12,0,0,0);for(let i=0;i<366;i++){const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;if(!days.has(k)){if(i===0){d.setDate(d.getDate()-1);continue}break}c++;d.setDate(d.getDate()-1)}return c};
const planDays=()=>{for(const k of['workoutGoalsV1','prismWorkoutGoalsV1']){const g=safeJson(k,{}),d=Number(g?.days||g?.trainingDays);if(Number.isFinite(d)&&d>0)return d}return 4};
const weekLabels=['Upper','Lower','Rest','Upper','Lower','Rest','Rest'];
const weekIcons=['⌁','♙','⌁','◎','♙','⌁','◎'];
const weekMarkup=()=>{const n=today();return ['MON','TUE','WED','THU','FRI','SAT','SUN'].map((label,i)=>{const dayIndex=(n.getDay()+6)%7,a=i===dayIndex;return `<div class="lh-day ${a?'active':''}"><strong>${label}</strong><b>${weekIcons[i]}</b><span>${weekLabels[i]}</span></div>`}).join('')};
const workoutMuscles=name=>/lower|leg/i.test(name)?'Quads · Hamstrings · Glutes · Calves':/push/i.test(name)?'Chest · Shoulders · Triceps':/pull/i.test(name)?'Back · Biceps · Rear Delts':'Chest · Back · Shoulders · Arms';
const chartBars=()=>[46,18,30,64,40,14,28].map((h,i)=>`<i style="height:${h}%"><span>${['M','T','W','T','F','S','S'][i]}</span></i>`).join('');
function render(){const home=document.getElementById('home');if(!home)return;addStyles();const legacy=legacySnapshot(home),days=planDays(),workouts=workoutCountThisWeek(),name=legacy.workoutHeading.toUpperCase(),current=home.querySelector('.liftova-home-shell'),shell=current||document.createElement('div');shell.className='liftova-home-shell';shell.innerHTML=`
<section class="lh-hero"><div class="lh-hero-mark"><img src="images/liftova-icon.svg" alt="LIFTOVA"></div><strong>LIFTOVA</strong><span>TRAIN <i>•</i> TRACK <i>•</i> PROGRESS</span></section>
<div class="lh-week">${weekMarkup()}</div>
<section class="lh-workout"><div class="lh-label">TODAY’S WORKOUT</div><h2>${name}</h2><p>${workoutMuscles(name)}</p><div class="lh-meta"><span><b>◴</b>45 – 60 min<small>EST. TIME</small></span><span><b>▥</b>8 exercises<small>TOTAL</small></span><span><b>◎</b>Hypertrophy<small>FOCUS</small></span></div><div class="lh-overview"><strong>WORKOUT OVERVIEW</strong><ul><li>Chest: 2 exercises</li><li>Back: 2 exercises</li><li>Shoulders: 2 exercises</li><li>Arms: 2 exercises</li></ul></div></section>
<div class="lh-insights"><section class="lh-progress"><header><b>↗</b><strong>WEEKLY PROGRESS</strong><span>›</span></header><div class="lh-chart">${chartBars()}</div></section><section class="lh-streak"><header><b>🔥</b><strong>WORKOUT STREAK</strong><span>›</span></header><div class="lh-streak-body"><div><strong>${streak()}</strong><small>DAYS</small></div><div class="lh-ring" style="--pct:${Math.min(100,(workouts/Math.max(days,1))*100)}%"></div></div></section></div>`;if(!current)home.prepend(shell);document.body.classList.add('liftova-ui');home.classList.add('liftova-home')}
function boot(){render();const originalGoHome=window.goHome;if(typeof originalGoHome==='function'&&!originalGoHome.__liftovaWrapped){const wrapped=function(...args){const result=originalGoHome.apply(this,args);requestAnimationFrame(render);return result};wrapped.__liftovaWrapped=true;window.goHome=wrapped}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
