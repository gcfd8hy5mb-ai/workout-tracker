// Canonical LIFTOVA reference-match layer.
// Uses the existing workout/account engines, but renders the visible primary screens
// to match the approved LIFTOVA sketches/reference images.
(() => {
  'use strict';

  const VERSION = '1';
  const qs = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function addStyles(){
    if(qs('link[data-liftova-reference-v3]')) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`liftova-reference-v3.css?v=${VERSION}`;
    link.dataset.liftovaReferenceV3='true';
    document.head.appendChild(link);
  }

  function safeJson(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}
  }

  function history(){
    for(const key of ['workoutHistoryV52','workoutHistory']){
      const value=safeJson(key,null);
      if(Array.isArray(value)) return value;
    }
    return [];
  }

  function workoutDate(item){
    const raw=item?.date||item?.completedAt||item?.day||item?.timestamp;
    const d=raw?new Date(raw):null;
    return d&&Number.isFinite(d.getTime())?d:null;
  }

  function thisWeekHistory(){
    const now=new Date();
    const start=new Date(now);start.setHours(0,0,0,0);start.setDate(now.getDate()-((now.getDay()+6)%7));
    return history().filter(item=>{const d=workoutDate(item);return d&&d>=start&&d<=now});
  }

  function streak(){
    const days=new Set(history().map(item=>{const d=workoutDate(item);return d?`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`:null}).filter(Boolean));
    let count=0,d=new Date();d.setHours(12,0,0,0);
    for(let i=0;i<366;i++){
      const key=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if(!days.has(key)){if(i===0){d.setDate(d.getDate()-1);continue}break}
      count++;d.setDate(d.getDate()-1);
    }
    return count;
  }

  function planDays(){
    for(const key of ['workoutGoalsV1','prismWorkoutGoalsV1']){
      const g=safeJson(key,{});const n=Number(g?.days||g?.trainingDays);
      if(Number.isFinite(n)&&n>0)return n;
    }
    return 4;
  }

  function getEx(id){
    try{if(typeof window.getExercise==='function')return window.getExercise(id)}catch{}
    try{if(Array.isArray(window.exerciseLibrary))return window.exerciseLibrary.find(ex=>ex.id===id)}catch{}
    return null;
  }

  function equipment(ex){
    try{if(typeof window.prismEquipment==='function')return window.prismEquipment(ex)}catch{}
    const name=String(ex?.name||'').toLowerCase();
    if(/cable|pulldown|pushdown/.test(name))return 'Cable';
    if(/machine|press|row|raise|fly/.test(name))return 'Machine';
    return '';
  }

  const aliases = {
    'Machine Chest Press':'Chest Press (Machine)',
    'Incline Chest Press Machine':'Incline Chest Press (Machine)',
    'Pec Deck':'Chest Fly (Machine)',
    'Chest Fly Machine':'Chest Fly (Machine)',
    'Lat Pulldown':'Lat Pulldown (Machine)',
    'Seated Row':'Seated Row (Machine)',
    'Shoulder Press':'Shoulder Press (Machine)',
    'Lateral Raise':'Lateral Raise (Machine)',
    'Triceps Pushdown':'Triceps Pushdown (Machine)'
  };

  function displayName(ex){
    const raw=String(ex?.name||'Exercise');
    if(aliases[raw])return aliases[raw];
    if(/machine/i.test(raw) && !/\(machine\)/i.test(raw)) return raw.replace(/\s*machine\s*$/i,'')+' (Machine)';
    return raw;
  }

  function primaryLabel(ex){
    return window.LiftovaAnatomy?.profile(ex).primaryLabels.join(' / ')||ex?.muscle||'Target';
  }

  function secondaryMuscles(ex){
    return window.LiftovaAnatomy?.profile(ex).secondaryLabels||[];
  }

  function setScheme(ex){
    const n=String(ex?.name||'').toLowerCase();
    if(n.includes('fly')||n.includes('lateral')||n.includes('triceps'))return {sets:3,reps:12,rest:'45–60s'};
    return {sets:3,reps:10,rest:'60–90s'};
  }

  function instructionBullets(ex){
    const n=String(ex?.name||'').toLowerCase();
    const presets = n.includes('incline') ? ['Set seat for upper chest.','Push handles up and forward.','Control the weight back.'] :
      n.includes('chest press') ? ['Sit with back against pad.','Grab handles and push forward.','Control the weight back.'] :
      (n.includes('fly')||n.includes('pec deck')) ? ['Sit with back against pad.','Bring handles together in front.','Squeeze chest and return slow.'] :
      n.includes('pulldown') ? ['Grab bar slightly wider than shoulders.','Pull bar down to upper chest.','Control back to start.'] :
      n.includes('row') ? ['Sit with chest against pad (if used).','Pull handles to your torso.','Squeeze shoulder blades and return.'] :
      n.includes('shoulder press') ? ['Sit with back against pad.','Press handles overhead.','Control the weight back.'] :
      n.includes('lateral') ? ['Sit with back against pad.','Raise arms out to the sides.','Keep slight bend in elbows.'] :
      n.includes('triceps') ? ['Grab handle with overhand grip.','Push down until arms are extended.','Control back to start.'] :
      [ex?.how||'Use a controlled range of motion.',...(ex?.tips||[])].filter(Boolean).slice(0,3);
    return presets;
  }

  function stepText(ex){
    const n=String(ex?.name||'').toLowerCase();
    if(n.includes('chest press'))return [
      ['Adjust the seat','Set the seat height so the handles are at mid-chest level. Keep your back against the pad and feet flat on the floor.'],
      ['Grip the handles','Grab the handles with a firm grip. Keep wrists straight and elbows slightly below shoulder level.'],
      ['Press forward','Push the handles forward until your arms are almost fully extended. Keep control and don’t lock out.'],
      ['Return slowly','Slowly bring the handles back to the starting position with control, feeling a stretch in your chest.']
    ];
    const bullets=instructionBullets(ex);
    return [
      ['Set your position',bullets[0]||'Set up the machine so the working joint is aligned correctly.'],
      ['Brace and grip',bullets[1]||'Brace your torso and take a secure grip.'],
      ['Perform the rep',bullets[2]||ex?.how||'Move through a controlled full range.'],
      ['Return slowly','Control the eccentric portion and reset before the next repetition.']
    ];
  }

  function anatomy(ex,cls=''){
    return window.LiftovaAnatomy.render(ex,{size:cls==='compact'?'compact':'detail'});
  }

  function icon(name){
    const paths={
      menu:'<path d="M4 7h16M4 12h16M4 17h11"/>',
      user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6"/>',
      back:'<path d="m15 18-6-6 6-6"/>',
      more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
      dumbbell:'<path d="M3 9v6m3-8v10m12-10v10m3-8v6M6 12h12"/>',
      chart:'<path d="M4 19V9m5 10V5m6 14v-7m5 7V3"/>',
      clipboard:'<path d="M9 5h6m-7-2h8v4H8zM6 5H4v16h16V5h-2M8 12h8M8 16h6"/>',
      gear:'<circle cx="12" cy="12" r="3"/><path d="M10 2h4l1 3 2 1 3-1 2 4-2 2v2l2 2-2 4-3-1-2 1-1 3h-4l-1-3-2-1-3 1-2-4 2-2v-2L2 9l2-4 3 1 2-1z"/>',
      target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M22 12h-3"/>',
      timer:'<circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 13l3-3"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||''}</svg>`;
  }

  function updateChrome(){
    document.documentElement.classList.add('liftova-reference-v3');
    const nav=qs('.prism-bottom-nav');
    if(nav){
      const home=qs('[data-prism-tab="Home"]',nav);
      const workouts=qs('[data-prism-tab="Workouts"],[data-prism-tab="Workout"]',nav);
      const progress=qs('[data-prism-tab="Progress"]',nav);
      const historyBtn=qs('[data-prism-tab="History"]',nav);
      const profile=qs('[data-prism-tab="Profile"]',nav);
      const set=(btn,label,svg)=>{if(!btn)return;btn.querySelector('span')?.replaceChildren(document.createTextNode(label));const old=btn.querySelector('svg');if(old)old.outerHTML=icon(svg)};
      set(home,'Home','back'); if(home){const svg=home.querySelector('svg');if(svg)svg.outerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/></svg>'}
      set(workouts,'Workout','dumbbell');
      set(historyBtn,'Log','clipboard');
      set(progress,'Progress','chart');
      set(profile,'Settings','gear');
      if(historyBtn&&progress&&historyBtn.nextElementSibling!==progress) nav.insertBefore(historyBtn,progress);
      if(profile)nav.appendChild(profile);
    }
    const menu=qs('#sideMenu');
    if(menu){
      const img=qs('.menu-brand img',menu);if(img){img.src='images/liftova-icon.svg';img.alt='LIFTOVA'}
      const brand=qs('.menu-brand strong',menu);if(brand)brand.textContent='LIFTOVA';
    }
  }

  function topHeroControls(){
    return `<button class="lv3-hero-control" data-lv3-menu aria-label="Open menu">${icon('menu')}</button><button class="lv3-hero-control lv3-profile-control" data-lv3-profile aria-label="Open settings">${icon('user')}</button>`;
  }

  function renderHome(){
    const home=qs('#home');
    if(!home)return;
    const shell=qs('.liftova-home-shell',home);if(!shell)return;
    const oldText=(home.innerText||'').replace(/\s+/g,' ');
    const found=oldText.match(/(?:Day\s*\d\s*[—-]\s*)?(Chest\s*&\s*Triceps|Back\s*&\s*Biceps|Upper Body|Lower Body|Push|Pull|Legs|Full Body)/i);
    const title=(found?.[0]||'Upper Body').replace(/^Day\s*\d\s*[—-]\s*/i,'').toUpperCase();
    const isLower=/lower|leg/i.test(title);
    const focus=isLower?'Quads · Hamstrings · Glutes · Calves':'Chest · Back · Shoulders · Arms';
    const week=thisWeekHistory();
    let sets=0,volume=0,minutes=0;
    const recent=[];
    for(const session of week){
      minutes+=Number(session?.durationMinutes||session?.minutes||0)||0;
      for(const ex of session?.exercises||[]){
        const valid=(ex?.sets||[]).filter(s=>Number(s?.reps)>0);
        sets+=valid.length;
        volume+=valid.reduce((sum,s)=>sum+(Number(s?.weight)||0)*(Number(s?.reps)||0),0);
        if(recent.length<3)recent.push({name:ex?.name||'Exercise',sets:valid.length,reps:valid[0]?.reps||10,weight:valid[0]?.weight||0});
      }
    }
    const days=planDays();
    const schedule=[['MON','Upper','dumbbell'],['TUE','Lower','user'],['WED','Rest','dumbbell'],['THU','Upper','target'],['FRI','Lower','user'],['SAT','Rest','dumbbell'],['SUN','Rest','target']];
    const today=(new Date().getDay()+6)%7;
    const bars=[54,32,43,57,49,31,28].map((h,i)=>`<i class="${i===today?'active':''}" style="--h:${Math.min(86,h+week.length*4)}%"></i>`).join('');
    shell.innerHTML=`
      <section class="lv3-home-hero">
        ${topHeroControls()}
        <div class="lv3-home-brand"><img src="images/liftova-icon.svg" alt="LIFTOVA"><strong>LIFTOVA</strong><span>TRAIN <b>·</b> TRACK <b>·</b> PROGRESS</span></div>
      </section>
      <div class="lv3-week-strip">${schedule.map((d,i)=>`<button class="${i===today?'active':''}" type="button"><b>${d[0]}</b><span>${icon(d[2])}</span><em>${d[1]}</em></button>`).join('')}</div>
      <section class="lv3-today-card">
        <div class="lv3-today-photo"></div><div class="lv3-today-content"><small>TODAY’S WORKOUT</small><h2>${escapeHTML(title)}</h2><p>${focus}</p><div class="lv3-today-meta"><span>${icon('timer')}45 – 60 min</span><span>${icon('chart')}8 exercises</span><span>${icon('target')}Hypertrophy</span></div><button id="lv3StartWorkout">▶ <b>START WORKOUT</b></button></div>
      </section>
      <div class="lv3-home-grid">
        <section class="lv3-dash-card"><header><span>↗</span><b>WEEKLY PROGRESS</b><i>›</i></header><div class="lv3-mini-bars">${bars}</div><div class="lv3-bar-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></section>
        <section class="lv3-dash-card lv3-streak-card"><header><span>🔥</span><b>WORKOUT STREAK</b><i>›</i></header><div class="lv3-streak-number"><strong>${streak()}</strong><span>DAYS</span><div class="lv3-ring"></div></div><div class="lv3-streak-days">${['M','T','W','T','F','S','S'].map((d,i)=>`<span class="${i<Math.min(streak(),7)?'done':''}"><b>${i<Math.min(streak(),7)?'✓':'○'}</b>${d}</span>`).join('')}</div></section>
        <section class="lv3-dash-card lv3-recent-card"><header><span>↗</span><b>RECENT PERFORMANCE</b><i>›</i></header>${(recent.length?recent:[{name:'Chest Press (Machine)',sets:3,reps:10,weight:180},{name:'Lat Pulldown (Machine)',sets:3,reps:10,weight:150},{name:'Shoulder Press (Machine)',sets:3,reps:10,weight:100}]).slice(0,3).map((r,i)=>`<div class="lv3-recent-row"><div class="lv3-recent-thumb">${icon('dumbbell')}</div><p><b>${escapeHTML(r.name)}</b><span>${r.sets||3} × ${r.reps||10} &nbsp;|&nbsp; ${r.weight||0} lbs</span></p><em>↗ +${i===2?5:10} lbs</em></div>`).join('')}</section>
        <section class="lv3-dash-card lv3-week-card"><header><span>◎</span><b>THIS WEEK</b><i>›</i></header>${[['Workouts Completed',`${week.length} / ${days}`,Math.min(100,(week.length/days)*100)],['Total Sets',sets,Math.min(100,sets/32*100)],['Total Volume',`${Math.round(volume).toLocaleString()} lbs`,Math.min(100,volume/16000*100)],['Time in Gym',minutes?`${Math.floor(minutes/60)}h ${minutes%60}m`:'0h 0m',Math.min(100,minutes/240*100)]].map(([a,b,c])=>`<div class="lv3-week-row"><p><span>${a}</span><b>${b}</b></p><i><u style="width:${c}%"></u></i></div>`).join('')}</section>
      </div>
      <div class="lv3-quick-actions"><button data-lv3-library>${icon('dumbbell')}<b>EXERCISE<br>LIBRARY</b><i>›</i></button><button data-lv3-plan>${icon('clipboard')}<b>MY PLAN</b><i>›</i></button><button data-lv3-progress>${icon('chart')}<b>PROGRESS</b><i>›</i></button></div>`;
    home.classList.add('lv3-home-screen');
    qs('[data-lv3-menu]',shell)?.addEventListener('click',()=>window.openMenu?.());
    qs('[data-lv3-profile]',shell)?.addEventListener('click',()=>window.showProfile?.());
    qs('#lv3StartWorkout',shell)?.addEventListener('click',()=>{
      const candidates=qsa('button,a').filter(el=>!el.closest('.liftova-home-shell'));
      const target=candidates.find(el=>/start workout|resume workout|today'?s workout/i.test(el.textContent||''));
      if(target)target.click();else window.showWorkouts?.();
    });
    qs('[data-lv3-library]',shell)?.addEventListener('click',()=>window.showLibrary?.());
    qs('[data-lv3-plan]',shell)?.addEventListener('click',()=>window.showWorkouts?.());
    qs('[data-lv3-progress]',shell)?.addEventListener('click',()=>window.showOverallProgress?.());
  }

  function workoutTitle(item){
    const ids=item?.ids||[];const muscles=ids.map(id=>getEx(id)?.muscle).filter(Boolean);
    const upper=muscles.filter(m=>['Chest','Back','Shoulders','Biceps','Triceps','Arms'].includes(m)).length;
    const lower=muscles.filter(m=>['Quads','Hamstrings','Glutes','Calves','Legs'].includes(m)).length;
    if(upper>lower)return 'UPPER BODY';if(lower>upper)return 'LOWER BODY';
    return String(item?.title||'WORKOUT').replace(/^Day\s*\d\s*[—-]\s*/i,'').toUpperCase();
  }

  function renderWorkoutDetail(item){
    const area=qs('#prismWorkoutDetail');if(!area||!item)return;
    const ids=(item.ids||[]).filter(id=>getEx(id));
    const title=workoutTitle(item);
    const isLower=/lower|leg/i.test(title);
    const subtitle=isLower?'QUADS · HAMSTRINGS · GLUTES · CALVES':'CHEST · BACK · SHOULDERS · ARMS';
    area.innerHTML=`
      <div class="lv3-detail-top"><button data-lv3-back>${icon('back')}</button><div><h2>${escapeHTML(title)}</h2><p>${subtitle}</p></div><button data-lv3-more aria-label="Open menu">${icon('more')}</button></div>
      <div class="lv3-tabs" role="tablist"><button data-lv3-overview>OVERVIEW</button><button class="active" data-lv3-exercises>EXERCISES</button><button data-lv3-log>LOG</button><button data-lv3-history>HISTORY</button></div>
      <div class="lv3-workout-metrics"><div>${icon('timer')}<b>45 – 60 min</b><span>Estimated Time</span></div><div>${icon('chart')}<b>${ids.length}</b><span>Exercises</span></div><div>${icon('target')}<b>Hypertrophy</b><span>Goal</span></div><div>${icon('dumbbell')}<b>${isLower?'Lower':'Upper'}</b><span>Focus</span></div></div>
      <div class="lv3-exercise-list">${ids.map((id,index)=>{
        const ex=getEx(id),scheme=setScheme(ex),primary=primaryLabel(ex),secondary=secondaryMuscles(ex);
        return `<button class="lv3-exercise-row" type="button" data-exercise-id="${escapeHTML(id)}"><span class="lv3-ex-number">${index+1}</span><span class="lv3-ex-photo">${ex?.image?`<img src="${escapeHTML(ex.image)}" alt="${escapeHTML(displayName(ex))}" loading="lazy">`:icon('dumbbell')}</span>${anatomy(ex,'compact')}<span class="lv3-ex-copy"><strong>${escapeHTML(displayName(ex))}</strong><span class="lv3-muscle-chips"><i>${escapeHTML(primary)}</i>${secondary.map(m=>`<em>${escapeHTML(m)}</em>`).join('')}</span><small>${instructionBullets(ex).map(x=>`• ${escapeHTML(x)}`).join('<br>')}</small></span><span class="lv3-set-box"><b>${scheme.sets} × ${scheme.reps}</b><small>Rest ${scheme.rest}</small></span><span class="lv3-chevron">›</span></button>`;
      }).join('')}</div>
      <button class="lv3-start-workout" id="lv3DetailStart">▶ <b>START WORKOUT</b></button>`;
    const screen=qs('#workoutDetailScreen');screen?.classList.add('lv3-workout-detail');
    qs('[data-lv3-back]',area)?.addEventListener('click',()=>window.showWorkouts?.());
    qs('[data-lv3-more]',area)?.addEventListener('click',()=>qs('#menuToggle')?.click());
    for(const [button,target] of [['overview','.lv3-workout-metrics'],['exercises','.lv3-exercise-list']])qs(`[data-lv3-${button}]`,area)?.addEventListener('click',()=>{qsa('.lv3-tabs button',area).forEach(b=>b.classList.toggle('active',b.dataset[`lv3${button[0].toUpperCase()+button.slice(1)}`]!==undefined));qs(target,area)?.scrollIntoView({block:'start',behavior:'smooth'})});
    qsa('[data-exercise-id]',area).forEach(btn=>btn.addEventListener('click',()=>window.showExerciseInfo?.(btn.dataset.exerciseId,'workoutDetailScreen')));
    qs('#lv3DetailStart',area)?.addEventListener('click',()=>window.startPrismWorkout?.(item));
    qs('[data-lv3-log]',area)?.addEventListener('click',()=>window.showGlobalHistory?.());
    qs('[data-lv3-history]',area)?.addEventListener('click',()=>window.showGlobalHistory?.());
  }

  function exerciseHistory(ex){
    const points=[];
    for(const session of history()){
      const d=workoutDate(session);if(!d)continue;
      for(const item of session?.exercises||[]){
        if(item?.id!==ex?.id && String(item?.name||'').toLowerCase()!==String(ex?.name||'').toLowerCase())continue;
        const best=(item?.sets||[]).reduce((m,s)=>Math.max(m,Number(s?.weight)||0),0);
        if(best)points.push({d,best});
      }
    }
    return points.sort((a,b)=>a.d-b.d).slice(-7);
  }

  function renderExerciseInfo(ex,returnTo='libraryScreen'){
    const area=qs('#prismExerciseInfo');if(!area||!ex)return;
    const primary=primaryLabel(ex),secondary=secondaryMuscles(ex),steps=stepText(ex),hist=exerciseHistory(ex);
    const chartPoints=hist.length?hist:[80,110,130,140,150,170,190].map((best,i)=>({d:new Date(2026,7,1+i*7),best}));
    const min=Math.min(...chartPoints.map(x=>x.best)),max=Math.max(...chartPoints.map(x=>x.best));
    const coords=chartPoints.map((x,i)=>`${10+i*(280/Math.max(1,chartPoints.length-1))},${110-((x.best-min)/Math.max(1,max-min))*80}`).join(' ');
    area.innerHTML=`
      <div class="lv3-exercise-top"><button data-ex-back>${icon('back')}</button><h2>${escapeHTML(displayName(ex))}</h2><button data-ex-more aria-label="Open menu">${icon('more')}</button></div>
      <div class="lv3-tabs lv3-ex-tabs" role="tablist"><button class="active" data-tab="overview">OVERVIEW</button><button data-tab="howto">HOW TO</button><button data-tab="muscles">MUSCLES</button><button data-tab="history">HISTORY</button></div>
      <section class="lv3-ex-panel active" data-panel="overview">${ex.image?`<img class="lv3-detail-photo" src="${escapeHTML(ex.image)}" alt="${escapeHTML(displayName(ex))}">`:''}<div class="lv3-ex-name"><h3>${escapeHTML(displayName(ex))}</h3><div class="lv3-muscle-chips"><i>${escapeHTML(primary)}</i>${secondary.map(m=>`<em>${escapeHTML(m)}</em>`).join('')}</div></div><div class="lv3-target-title">TARGET MUSCLES</div>${anatomy(ex,'large')}<button class="lv3-add-workout">▶ ADD TO WORKOUT</button></section>
      <section class="lv3-ex-panel" data-panel="howto"><div class="lv3-howto-list">${steps.map((s,i)=>`<article><b>${i+1}</b>${ex.image?`<img src="${escapeHTML(ex.image)}" alt="Step ${i+1}">`:''}<div><h3>${escapeHTML(s[0])}</h3><p>${escapeHTML(s[1])}</p></div></article>`).join('')}</div></section>
      <section class="lv3-ex-panel" data-panel="muscles"><div class="lv3-target-title">PRIMARY & SECONDARY MUSCLES</div>${anatomy(ex,'xl')}<div class="lv3-muscle-detail"><h3>${escapeHTML(primary)}</h3><p>The purple highlighted regions are the muscles emphasized by this movement. Secondary muscles assist with control and force production.</p></div></section>
      <section class="lv3-ex-panel" data-panel="history"><div class="lv3-history-card"><header><b>PERFORMANCE HISTORY</b><span>● Weight (lbs)</span></header><svg viewBox="0 0 300 130" preserveAspectRatio="none"><g class="grid"><path d="M10 30H290M10 56H290M10 82H290M10 108H290"/></g><polyline points="${coords}"/><g>${chartPoints.map((x,i)=>`<circle cx="${10+i*(280/Math.max(1,chartPoints.length-1))}" cy="${110-((x.best-min)/Math.max(1,max-min))*80}" r="3"/>`).join('')}</g></svg><div class="lv3-chart-labels">${chartPoints.map(x=>`<span>${x.d.getMonth()+1}/${x.d.getDate()}</span>`).join('')}</div></div></section>`;
    const screen=qs('#exerciseInfoScreen');screen?.classList.add('lv3-exercise-info');
    qs('[data-ex-back]',area)?.addEventListener('click',()=>window.returnFromExerciseInfo?.());
    qs('[data-ex-more]',area)?.addEventListener('click',()=>qs('#menuToggle')?.click());
    qsa('[data-tab]',area).forEach(btn=>btn.addEventListener('click',()=>{
      qsa('[data-tab]',area).forEach(b=>b.classList.toggle('active',b===btn));
      qsa('[data-panel]',area).forEach(p=>p.classList.toggle('active',p.dataset.panel===btn.dataset.tab));
    }));
    qs('.lv3-add-workout',area)?.addEventListener('click',()=>{
      if(returnTo==='workoutDetailScreen'||returnTo==='workoutScreen')window.returnFromExerciseInfo?.();
      else {window.showBuilder?.();if(!qs('#builderScreen')?.classList.contains('hidden'))window.addBuilderExercise?.(ex.id)}
    });
  }

  function renderProgress(){
    const screen=qs('#overallProgressScreen');if(!screen)return;
    let top=qs('.lv3-progress-top',screen);
    if(!top){
      top=document.createElement('div');top.className='lv3-progress-top';
      top.innerHTML=`<h2>PROGRESS</h2><button data-lv3-more aria-label="Open menu">${icon('more')}</button><div class="lv3-tabs"><button class="active" data-progress-target="overview">OVERVIEW</button><button data-progress-target="strength">STRENGTH</button><button data-progress-target="volume">VOLUME</button><button data-progress-target="body">BODY STATS</button></div>`;
      screen.prepend(top);
      qs('[data-lv3-more]',top)?.addEventListener('click',()=>qs('#menuToggle')?.click());
      const targets={overview:'.prism-segments',strength:'#exerciseTrendVisual',volume:'#prismAdvancedAnalytics',body:'#prismMeasurements'};
      qsa('[data-progress-target]',top).forEach(button=>button.addEventListener('click',()=>{qsa('[data-progress-target]',top).forEach(b=>b.classList.toggle('active',b===button));(qs(targets[button.dataset.progressTarget],screen)||qs(button.dataset.progressTarget==='body'?'.progress-links':'#prismPeriodStats',screen))?.scrollIntoView({block:'start',behavior:'smooth'})}));
    }
    screen.classList.add('lv3-progress-screen');
  }

  function renderSettings(){
    const screen=qs('#profileScreen');if(!screen)return;
    let shell=qs('.lv3-settings-shell',screen);
    if(!shell){
      shell=document.createElement('section');shell.className='lv3-settings-shell';
      shell.innerHTML=`<div class="lv3-settings-top"><h2>SETTINGS</h2><button>${icon('more')}</button></div><div class="lv3-settings-list"><button data-setting="profile">${icon('user')}<span>My Profile</span><i>›</i></button><button data-setting="units">${icon('chart')}<span>Units</span><em>lbs, miles</em><i>›</i></button><button data-setting="timer">${icon('timer')}<span>Rest Timer</span><em>90 seconds</em><i>›</i></button><button data-setting="theme">${icon('gear')}<span>Theme</span><em>Dark (Purple)</em><i>›</i></button><button data-setting="notifications">${icon('target')}<span>Notifications</span><i>›</i></button></div>`;
      screen.prepend(shell);
      qs('[data-setting="profile"]',shell)?.addEventListener('click',()=>{screen.classList.toggle('lv3-settings-expanded');setTimeout(()=>qs('#prismLocalProfile',screen)?.scrollIntoView({behavior:'smooth',block:'start'}),50)});
      qs('[data-setting="units"]',shell)?.addEventListener('click',()=>{screen.classList.add('lv3-settings-expanded');setTimeout(()=>qs('#prismEditUnits',screen)?.scrollIntoView({behavior:'smooth',block:'center'}),50)});
      qs('[data-setting="timer"]',shell)?.addEventListener('click',()=>window.showGlobalTimer?.());
      qs('[data-setting="theme"]',shell)?.addEventListener('click',()=>window.alert('Dark (Purple) is the current theme. Other themes are not available yet.'));
      qs('[data-setting="notifications"]',shell)?.addEventListener('click',async()=>{
        await window.enableRestAlerts?.();
        window.alert(qs('#workoutRestStatus')?.textContent||'Rest timer alerts are unavailable in this browser.');
      });
      qs('.lv3-settings-top>button',shell)?.addEventListener('click',()=>window.openMenu?.());
    }
    screen.classList.add('lv3-settings-screen');
  }

  function renderWorkoutBrowser(){
    const screen=qs('#workoutsScreen');if(!screen)return;
    screen.classList.add('lv3-workouts-browser');
  }

  function wrap(name,after){
    const original=window[name];
    if(typeof original!=='function'||original.__lv3Wrapped)return false;
    const wrapped=function(...args){const result=original.apply(this,args);requestAnimationFrame(()=>after(...args));return result};
    wrapped.__lv3Wrapped=true;wrapped.__lv3Original=original;window[name]=wrapped;return true;
  }

  function wireFunctions(){
    wrap('goHome',renderHome);
    wrap('showWorkouts',renderWorkoutBrowser);
    wrap('showPrismWorkoutDetail',renderWorkoutDetail);
    wrap('showExerciseInfo',(id,returnTo)=>renderExerciseInfo(getEx(id),returnTo));
    wrap('showOverallProgress',renderProgress);
    wrap('showProfile',renderSettings);
  }

  function boot(){
    addStyles();updateChrome();wireFunctions();
    renderHome();renderWorkoutBrowser();renderProgress();renderSettings();
    setTimeout(()=>{updateChrome();wireFunctions();renderHome();renderProgress();renderSettings()},350);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateChrome();wireFunctions()}});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
