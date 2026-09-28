// LIFTOVA quick logging: make normal sets one-tap and weight/reps fast to adjust.
(() => {
  'use strict';

  const SCREEN_ID = 'workoutScreen';
  const parseNumber = text => {
    const match = String(text || '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  };

  function parseKey(button){
    const source = button?.getAttribute('onclick') || '';
    const match = source.match(/openPicker\('([^']+)'\s*,\s*'(weight|reps)'\)/);
    return match ? {key: match[1], type: match[2]} : null;
  }

  function previousValues(block){
    const text = block.querySelector('.previous')?.textContent || '';
    const weight = text.match(/Previous:\s*(\d+(?:\.\d+)?)\s*lb/i);
    const reps = text.match(/×\s*(\d+)/) || text.match(/Previous:\s*(\d+)\s*reps/i);
    return {weight: weight ? Number(weight[1]) : null, reps: reps ? Number(reps[1]) : null};
  }

  function currentValue(button, type, previous){
    const direct = parseNumber(button?.textContent);
    if (Number.isFinite(direct)) return direct;
    if (Number.isFinite(previous?.[type])) return previous[type];
    return type === 'weight' ? 5 : 10;
  }

  function save(key, type, value){
    if (typeof window.saveSet !== 'function') return;
    const min = type === 'weight' ? 2.5 : 1;
    const max = type === 'weight' ? 500 : 50;
    const normalized = type === 'reps' ? Math.round(value) : Math.round(value * 2) / 2;
    window.saveSet(key, type, Math.max(min, Math.min(max, normalized)));
  }

  function adjust(block, type, amount){
    const button = block.querySelector(`.picker-button[onclick*="'${type}'"]`);
    const info = parseKey(button);
    if (!info) return;
    const previous = previousValues(block);
    save(info.key, type, currentValue(button, type, previous) + amount);
  }

  function usePrevious(block){
    const weightButton = block.querySelector(`.picker-button[onclick*="'weight'"]`);
    const repsButton = block.querySelector(`.picker-button[onclick*="'reps'"]`);
    const weightInfo = parseKey(weightButton);
    const repsInfo = parseKey(repsButton);
    const previous = previousValues(block);
    if (weightInfo && Number.isFinite(previous.weight)) save(weightInfo.key, 'weight', previous.weight);
    if (repsInfo && Number.isFinite(previous.reps)) save(repsInfo.key, 'reps', previous.reps);
  }

  function enhanceBlock(block){
    if (!block || block.dataset.liftovaQuickLog === '1') return;
    const row = block.querySelector('.set-row');
    const buttons = row?.querySelectorAll('.picker-button');
    if (!row || !buttons || buttons.length < 2) return;
    block.dataset.liftovaQuickLog = '1';

    const previous = previousValues(block);
    const quick = document.createElement('div');
    quick.className = 'liftova-quick-log';
    quick.innerHTML = `
      <div class="liftova-quick-field" data-quick-type="weight">
        <span>WEIGHT</span>
        <div><button type="button" data-quick="weight-minus" aria-label="Decrease weight by 5 pounds">−5</button><b>tap weight above to type</b><button type="button" data-quick="weight-plus" aria-label="Increase weight by 5 pounds">+5</button></div>
      </div>
      <div class="liftova-quick-field" data-quick-type="reps">
        <span>REPS</span>
        <div><button type="button" data-quick="reps-minus" aria-label="Decrease reps by 1">−1</button><b>tap reps above to type</b><button type="button" data-quick="reps-plus" aria-label="Increase reps by 1">+1</button></div>
      </div>
      ${Number.isFinite(previous.weight) || Number.isFinite(previous.reps) ? '<button type="button" class="liftova-use-last" data-quick="last">↺ USE LAST SET VALUES</button>' : ''}
    `;
    row.after(quick);

    const done = block.querySelector('.set-done');
    if (done) {
      done.classList.add('liftova-one-tap-done');
      done.textContent = done.getAttribute('aria-pressed') === 'true' ? '✓ SET LOGGED' : '✓ LOG SET';
    }
  }

  function enhance(){
    const screen = document.getElementById(SCREEN_ID);
    if (!screen || screen.classList.contains('hidden')) return;
    screen.querySelectorAll('.set-block').forEach(enhanceBlock);
  }

  function handleClick(event){
    const control = event.target.closest?.('[data-quick]');
    if (!control) return;
    const block = control.closest('.set-block');
    if (!block) return;
    event.preventDefault();
    const action = control.dataset.quick;
    if (action === 'weight-minus') adjust(block, 'weight', -5);
    if (action === 'weight-plus') adjust(block, 'weight', 5);
    if (action === 'reps-minus') adjust(block, 'reps', -1);
    if (action === 'reps-plus') adjust(block, 'reps', 1);
    if (action === 'last') usePrevious(block);
  }

  function boot(){
    if (!document.querySelector('link[data-liftova-quick-log]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'liftova-quick-log.css?v=1';
      link.dataset.liftovaQuickLog = 'true';
      document.head.appendChild(link);
    }
    const screen = document.getElementById(SCREEN_ID);
    if (!screen) return;
    screen.addEventListener('click', handleClick);
    new MutationObserver(() => requestAnimationFrame(enhance)).observe(screen, {subtree:true, childList:true});
    requestAnimationFrame(enhance);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
