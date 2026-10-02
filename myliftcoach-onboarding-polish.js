/* MYLIFTCOACH pre-beta onboarding polish.
   Presentation/navigation guard only. The canonical onboarding data model stays in onboarding.js. */
(() => {
  'use strict';
  const ACCOUNT_COPY = 'Your setup is saved to your MYLIFTCOACH account and stays with you on supported devices.';
  const GUEST_COPY = 'Your setup is saved on this device.';
  const owner = () => window.PRISMDeviceStore?.owner || null;

  function syncJourneyMode() {
    if (!owner()) return;
    try {
      const raw = localStorage.getItem('prismJourneyV1');
      const journey = raw ? JSON.parse(raw) : null;
      if (journey && journey.status !== 'complete' && journey.mode !== 'account') {
        journey.mode = 'account';
        localStorage.setItem('prismJourneyV1', JSON.stringify(journey));
      }
    } catch {}
  }

  function polish() {
    const active = document.body.classList.contains('prism-onboarding-active');
    if (!active) return;
    const content = document.getElementById('prismJourneyContent');
    if (!content) return;

    const eyebrow = content.querySelector('.journey-eyebrow');
    const match = eyebrow?.textContent?.match(/STEP\s+(\d+)\s+OF\s+7/i);
    const step = match ? Number(match[1]) : null;
    if (step) document.body.dataset.mlcOnboardingStep = String(step);

    if (step === 1) {
      const intro = content.querySelector(':scope > p');
      if (intro) intro.textContent = owner() ? ACCOUNT_COPY : GUEST_COPY;
      if (owner()) {
        const back = content.querySelector('.journey-actions .journey-secondary');
        if (back) back.hidden = true;
      }
    }

    content.querySelectorAll('input,select,button').forEach(control => {
      if (control.tagName !== 'BUTTON' && Number.parseFloat(getComputedStyle(control).fontSize) < 16) {
        control.style.fontSize = '16px';
      }
    });

    const error = content.querySelector('#journeyError');
    if (error && !error.dataset.mlcObserved) {
      error.dataset.mlcObserved = '1';
      new MutationObserver(() => {
        if (error.textContent.trim()) {
          error.setAttribute('tabindex', '-1');
          error.focus({preventScroll:true});
          error.scrollIntoView({block:'nearest',behavior:'smooth'});
        }
      }).observe(error, {childList:true,subtree:true,characterData:true});
    }
  }

  function handoffNewAccount() {
    if (!owner()) return false;
    const welcome = document.getElementById('welcomeScreen');
    if (!welcome || welcome.classList.contains('hidden') || typeof window.startPrismGuest !== 'function') return false;
    syncJourneyMode();
    window.startPrismGuest();
    syncJourneyMode();
    polish();
    return true;
  }

  function ready() {
    let attempts = 0;
    const settle = () => {
      attempts += 1;
      if (!handoffNewAccount()) polish();
      if (attempts < 40 && typeof window.startPrismGuest !== 'function') requestAnimationFrame(settle);
    };
    settle();

    new MutationObserver(() => {
      if (!handoffNewAccount()) polish();
    }).observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true});
  else ready();
})();
