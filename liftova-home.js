// Canonical LIFTOVA Home dashboard. Replaces the visible legacy Home presentation
// while preserving the existing workout/data engines and navigation actions.
(() => {
  'use strict';

  const addStyles = () => {
    if (document.querySelector('link[data-liftova-home]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'liftova-home.css?v=5';
    link.dataset.liftovaHome = 'true';
    document.head.appendChild(link);
  };

  const safeJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };

  const today = () => new Date();
  const dayLetters = ['S','M','T','W','T','F','S'];

  function visibleText(root, selector, fallback = '') {
    const el = root?.querySelector(selector);
    return (el?.textContent || '').trim() || fallback;
  }

  function legacySnapshot(home) {
    const text = (home?.innerText || '').replace(/\s+/g, ' ').trim();
    const workoutHeading = [...(home?.querySelectorAll('h2,h3,strong') || [])]
      .map(el => (el.textContent || '').trim())
      .find(value => /day\s*\d|upper body|lower body|push|pull|legs|full body/i.test(value)) || 'Your Next Workout';
    const detail = text.match(/\d+\s+exercises?\s*[·•-]\s*(?:about\s*)?\d+\s*min/i)?.[0] || '';
    const greeting = [...(home?.querySelectorAll('h1,h2,h3') || [])]
      .map(el => (el.textContent || '').trim())
      .find(value => /good (morning|afternoon|evening)|ready to train/i.test(value)) || '';
    return { workoutHeading, detail, greeting };
  }

  const profileName = legacy => {
    const fromGreeting = legacy.greeting.replace(/^(good (morning|afternoon|evening)|ready to train)[,\s]*/i, '').replace(/[?!]+$/,'').trim();
    if (fromGreeting) return fromGreeting;
    for (const key of ['prismLocalProfileV1','prismProfileV1']) {
      const profile = safeJson(key, {});
      const name = String(profile?.displayName || profile?.name || '').trim();
      if (name) return name;
    }
    return '';
  };

  const history = () => {
    for (const key of ['workoutHistoryV52','workoutHistory']) {
      const value = safeJson(key, null);
      if (Array.isArray(value)) return value;
    }
    return [];
  };

  const workoutCountThisWeek = () => {
    const items = history();
    const now = today();
    const start = new Date(now);
    start.setHours(0,0,0,0);
    start.setDate(now.getDate() - ((now.getDay()+6)%7));
    return items.filter(item => {
      const raw = item?.date || item?.completedAt || item?.day || item?.timestamp;
      const d = raw ? new Date(raw) : null;
      return d && Number.isFinite(d.getTime()) && d >= start && d <= now;
    }).length;
  };

  const completedSetCountThisWeek = () => {
    const now = today();
    const start = new Date(now);
    start.setHours(0,0,0,0);
    start.setDate(now.getDate() - ((now.getDay()+6)%7));
    let sets = 0;
    for (const session of history()) {
      const raw = session?.date || session?.completedAt || session?.day || session?.timestamp;
      const d = raw ? new Date(raw) : null;
      if (!d || !Number.isFinite(d.getTime()) || d < start || d > now) continue;
      for (const ex of session?.exercises || []) sets += (ex?.sets || []).filter(set => Number(set?.reps) > 0).length;
    }
    return sets;
  };

  const streak = () => {
    const days = new Set(history().map(item => {
      const raw = item?.date || item?.completedAt || item?.day || item?.timestamp;
      const d = raw ? new Date(raw) : null;
      return d && Number.isFinite(d.getTime()) ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null;
    }).filter(Boolean));
    if (!days.size) return 0;
    let count = 0;
    const d = today(); d.setHours(12,0,0,0);
    for (let i=0;i<366;i++) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!days.has(key)) {
        if (i === 0) { d.setDate(d.getDate()-1); continue; }
        break;
      }
      count++; d.setDate(d.getDate()-1);
    }
    return count;
  };

  const activeWorkout = () => {
    for (const key of ['prismActiveWorkoutV1','activeWorkout']) {
      const value = safeJson(key, null);
      if (value) return value;
    }
    return null;
  };

  const planDays = () => {
    for (const key of ['workoutGoalsV1','prismWorkoutGoalsV1']) {
      const goals = safeJson(key, {});
      const days = Number(goals?.days || goals?.trainingDays);
      if (Number.isFinite(days) && days > 0) return days;
    }
    return 4;
  };

  const weekMarkup = () => {
    const now = today();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay()+6)%7));
    return Array.from({length:7}, (_,i) => {
      const d = new Date(monday); d.setDate(monday.getDate()+i);
      const active = d.toDateString() === now.toDateString();
      const label = ['MON','TUE','WED','THU','FRI','SAT','SUN'][i];
      return `<div class="lh-day ${active?'active':''}"><strong>${label}</strong><span>${d.getDate()}</span><i aria-hidden="true">${dayLetters[d.getDay()]}</i></div>`;
    }).join('');
  };

  const clickExisting = patterns => {
    const buttons = [...document.querySelectorAll('button,a')].filter(el => !el.closest('.liftova-home-shell'));
    const target = buttons.find(el => patterns.some(rx => rx.test((el.textContent || '').trim())));
    if (target) { target.click(); return true; }
    return false;
  };

  function wire(shell) {
    shell.querySelector('#liftovaHomeStart')?.addEventListener('click', () => {
      if (!clickExisting([/resume workout/i,/start workout/i,/today'?s workout/i,/continue workout/i])) clickExisting([/^workouts$/i]);
    });
    shell.querySelector('[data-lh="workouts"]')?.addEventListener('click',()=>clickExisting([/^workouts$/i,/my workouts/i]));
    shell.querySelector('[data-lh="progress"]')?.addEventListener('click',()=>clickExisting([/^progress$/i,/overall progress/i]));
    shell.querySelector('[data-lh="library"]')?.addEventListener('click',()=>clickExisting([/exercise library/i,/^library$/i]));
  }

  function render() {
    const home = document.getElementById('home');
    if (!home) return;
    addStyles();
    const legacy = legacySnapshot(home);
    const name = profileName(legacy);
    const resume = !!activeWorkout();
    const days = planDays();
    const workouts = workoutCountThisWeek();
    const sets = completedSetCountThisWeek();
    const current = home.querySelector('.liftova-home-shell');
    const shell = current || document.createElement('div');
    shell.className = 'liftova-home-shell';
    shell.innerHTML = `
      <section class="lh-hero">
        <div class="lh-hero-brand">
          <img src="images/liftova-icon.svg" alt="LIFTOVA">
          <div><strong>LIFTOVA</strong><span>TRAIN · TRACK · PROGRESS</span></div>
        </div>
        ${name ? `<div class="lh-welcome">Welcome back, ${name}</div>` : ''}
      </section>
      <div class="lh-week">${weekMarkup()}</div>
      <section class="lh-workout">
        <div class="lh-workout-bg" aria-hidden="true"></div>
        <div class="lh-label">${resume?'WORKOUT IN PROGRESS':'TODAY’S WORKOUT'}</div>
        <h2>${resume?'RESUME WORKOUT':legacy.workoutHeading.toUpperCase()}</h2>
        <p>${legacy.detail || `${days} day training plan`}</p>
        <div class="lh-meta"><span>◷ 45–60 min</span><span>▥ ${days} days/week</span><span>◎ Hypertrophy</span></div>
        <button class="lh-start" id="liftovaHomeStart">▶ ${resume?'RESUME WORKOUT':'START WORKOUT'}</button>
      </section>
      <div class="lh-dashboard-grid">
        <section class="lh-panel"><header><b>WEEKLY PROGRESS</b></header><div class="lh-bars">${[55,38,70,48,76,34,24].map((n,i)=>`<i style="height:${Math.min(92,n + (workouts*4))}%" aria-label="day ${i+1}"></i>`).join('')}</div></section>
        <section class="lh-panel lh-streak"><header><b>WORKOUT STREAK</b></header><strong>${streak()}</strong><span>DAYS</span><div class="lh-ring"></div></section>
        <section class="lh-panel lh-performance"><header><b>THIS WEEK</b></header><div><span>Workouts completed</span><strong>${workouts}/${days}</strong></div><div><span>Total sets</span><strong>${sets}</strong></div><div><span>Plan</span><strong>${days} days</strong></div></section>
        <section class="lh-panel lh-coach"><header><b>LIFTOVA COACH</b></header><p>${workouts ? 'Keep building on this week’s work.' : 'Log your first workout and LIFTOVA will start learning from your training.'}</p></section>
      </div>
      <div class="lh-actions"><button data-lh="library"><span>✚</span><b>EXERCISE LIBRARY</b></button><button data-lh="workouts"><span>▣</span><b>MY PLAN</b></button><button data-lh="progress"><span>▥</span><b>PROGRESS</b></button></div>`;
    if (!current) home.prepend(shell);
    document.body.classList.add('liftova-ui');
    home.classList.add('liftova-home');
    wire(shell);
  }

  function boot() {
    render();
    const originalGoHome = window.goHome;
    if (typeof originalGoHome === 'function' && !originalGoHome.__liftovaWrapped) {
      const wrapped = function(...args) {
        const result = originalGoHome.apply(this,args);
        requestAnimationFrame(render);
        return result;
      };
      wrapped.__liftovaWrapped = true;
      window.goHome = wrapped;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
