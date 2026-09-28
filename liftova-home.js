// LIFTOVA branch-only home dashboard enhancement. Does not replace storage/workout engines.
(() => {
  'use strict';
  const today = new Date();
  const dayLetters = ['S','M','T','W','T','F','S'];
  const safeJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const firstName = () => {
    const profile = safeJson('prismLocalProfileV1', {});
    const name = String(profile.displayName || '').trim();
    return name ? name.split(/\s+/)[0] : '';
  };
  const workoutCountThisWeek = () => {
    const history = safeJson('workoutHistoryV52', []);
    if (!Array.isArray(history)) return 0;
    const now = new Date();
    const start = new Date(now); start.setHours(0,0,0,0); start.setDate(now.getDate() - ((now.getDay()+6)%7));
    return history.filter(item => {
      const raw = item?.date || item?.completedAt || item?.day || item?.timestamp;
      const d = raw ? new Date(raw) : null;
      return d && Number.isFinite(d.getTime()) && d >= start && d <= now;
    }).length;
  };
  const streak = () => {
    const history = safeJson('workoutHistoryV52', []);
    if (!Array.isArray(history) || !history.length) return 0;
    const days = new Set(history.map(item => {
      const raw = item?.date || item?.completedAt || item?.day || item?.timestamp;
      const d = raw ? new Date(raw) : null;
      return d && Number.isFinite(d.getTime()) ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null;
    }).filter(Boolean));
    let count = 0, d = new Date(); d.setHours(12,0,0,0);
    for (let i=0;i<366;i++) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!days.has(key)) { if (i===0) { d.setDate(d.getDate()-1); continue; } break; }
      count++; d.setDate(d.getDate()-1);
    }
    return count;
  };
  const clickExisting = patterns => {
    const home = document.getElementById('home');
    const buttons = [...document.querySelectorAll('button,a')].filter(el => !el.closest('.liftova-home-shell'));
    const target = buttons.find(el => patterns.some(rx => rx.test((el.textContent || '').trim())) && (!home || home.contains(el) || el.closest('nav,.side-menu')));
    if (target) { target.click(); return true; }
    return false;
  };
  const weekMarkup = () => {
    const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay()+6)%7));
    return Array.from({length:7}, (_,i) => {
      const d = new Date(monday); d.setDate(monday.getDate()+i);
      const active = d.toDateString() === today.toDateString();
      return `<div class="lh-day ${active?'active':''}"><strong>${dayLetters[d.getDay()]}</strong>${d.getDate()}</div>`;
    }).join('');
  };
  function mount() {
    const home = document.getElementById('home');
    if (!home || home.querySelector('.liftova-home-shell')) return;
    document.body.classList.add('liftova-ui');
    home.classList.add('liftova-home');
    const profile = safeJson('prismLocalProfileV1', {});
    const goals = safeJson('workoutGoalsV1', {});
    const active = safeJson('prismActiveWorkoutV1', null);
    const goalName = goals?.goal === 'strength' ? 'Strength' : goals?.goal === 'fat-loss' ? 'Fat Loss' : goals?.goal === 'consistency' ? 'General Fitness' : 'Build Muscle';
    const days = Number(goals?.days || 4);
    const isResume = !!active;
    const shell = document.createElement('div');
    shell.className = 'liftova-home-shell';
    shell.innerHTML = `
      <div class="lh-brandrow"><div><div class="lh-wordmark">LIFTOVA</div><div class="lh-kicker">TRAIN · TRACK · PROGRESS</div></div><div class="lh-avatar">${(firstName()[0]||'L').toUpperCase()}</div></div>
      <div class="lh-greeting"><h2>${firstName()?`Ready to train, ${firstName()}?`:'Ready to train?'}</h2><p>${today.toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'})} · ${goalName}</p></div>
      <div class="lh-week">${weekMarkup()}</div>
      <section class="lh-workout"><div class="lh-label">${isResume?'WORKOUT IN PROGRESS':'TODAY’S TRAINING'}</div><h3>${isResume?'Resume Workout':days===4?'Upper Body':'Your Next Workout'}</h3><div class="sub">Stay focused. Log every working set.</div><div class="lh-meta"><span><i></i>${days} days/week</span><span><i></i>Premium tracking</span><span><i></i>Coach ready</span></div><button class="lh-start" id="liftovaHomeStart">${isResume?'RESUME WORKOUT':'START WORKOUT'} →</button></section>
      <div class="lh-stats"><div class="lh-stat"><strong>${workoutCountThisWeek()}</strong><span>THIS WEEK</span><em>workouts</em></div><div class="lh-stat"><strong>${streak()}</strong><span>STREAK</span><em>days</em></div><div class="lh-stat"><strong>${days}</strong><span>PLAN</span><em>days/week</em></div></div>
      <div class="lh-section-title"><strong>Quick access</strong><span>Your training hub</span></div>
      <div class="lh-actions"><button class="lh-action" data-lh="workouts"><span class="lh-icon">→</span><b>Workouts</b><small>Plan & sessions</small></button><button class="lh-action" data-lh="progress"><span class="lh-icon">↗</span><b>Progress</b><small>History & trends</small></button><button class="lh-action" data-lh="library"><span class="lh-icon">＋</span><b>Exercise Library</b><small>Movements & form</small></button><button class="lh-action" data-lh="profile"><span class="lh-icon">⌁</span><b>Profile</b><small>Goals & settings</small></button></div>`;
    home.prepend(shell);
    shell.querySelector('#liftovaHomeStart').addEventListener('click', () => {
      if (!clickExisting([/resume workout/i,/start workout/i,/today'?s workout/i,/continue workout/i])) clickExisting([/workouts/i]);
    });
    shell.querySelector('[data-lh="workouts"]').addEventListener('click',()=>clickExisting([/^workouts$/i,/my workouts/i]));
    shell.querySelector('[data-lh="progress"]').addEventListener('click',()=>clickExisting([/^progress$/i,/overall progress/i,/history/i]));
    shell.querySelector('[data-lh="library"]').addEventListener('click',()=>clickExisting([/exercise library/i,/^library$/i]));
    shell.querySelector('[data-lh="profile"]').addEventListener('click',()=>clickExisting([/^profile$/i,/settings/i]));
  }
  const boot = () => {
    mount();
    const observer = new MutationObserver(() => mount());
    observer.observe(document.body,{childList:true,subtree:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
