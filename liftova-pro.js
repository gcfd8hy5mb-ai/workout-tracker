// LIFTOVA Pro / Coach visual layer. Preserves existing Pro entitlements and decision logic.
(() => {
  'use strict';

  const css = document.createElement('style');
  css.id = 'liftovaProStyles';
  css.textContent = `
    #prismProScreen{color:#f6f2ff;background:
      radial-gradient(circle at 50% -10%,rgba(139,67,255,.28),transparent 34%),
      linear-gradient(180deg,#08070d 0%,#0b0812 55%,#07070b 100%);
      min-height:100dvh;margin:-20px -16px -36px;padding:calc(20px + env(safe-area-inset-top)) 16px calc(36px + env(safe-area-inset-bottom));}
    #prismProScreen .pro-back{border:1px solid rgba(174,118,255,.28)!important;background:rgba(18,13,28,.85)!important;color:#d8c7ff!important;border-radius:14px!important;min-height:44px;padding:0 14px!important;margin-bottom:14px;}
    #prismProPageContent{max-width:760px;margin:auto;}
    .liftova-pro-hero{position:relative;overflow:hidden;border:1px solid rgba(170,103,255,.48);border-radius:28px;padding:28px 22px 24px;margin:2px 0 18px;background:
      radial-gradient(circle at 85% 10%,rgba(173,108,255,.32),transparent 34%),
      linear-gradient(145deg,rgba(29,18,45,.98),rgba(12,10,18,.98));box-shadow:0 22px 70px rgba(73,23,135,.25),inset 0 0 0 1px rgba(255,255,255,.025);}
    .liftova-pro-orbit{position:absolute;width:180px;height:180px;border-radius:50%;right:-70px;top:-74px;border:1px solid rgba(191,145,255,.25);box-shadow:0 0 60px rgba(139,67,255,.22) inset;}
    .liftova-pro-kicker{display:flex;align-items:center;gap:8px;color:#b985ff;font-size:11px;font-weight:850;letter-spacing:.18em;text-transform:uppercase;margin-bottom:10px;}
    .liftova-pro-kicker:before{content:'✦';font-size:13px;filter:drop-shadow(0 0 8px #9652ff)}
    .liftova-pro-hero h1{margin:0;font-size:34px;line-height:1.02;letter-spacing:-.035em;color:#fff;}
    .liftova-pro-hero h1 span{display:block;background:linear-gradient(100deg,#fff,#c79cff 60%,#8d45ff);-webkit-background-clip:text;background-clip:text;color:transparent;}
    .liftova-pro-hero p{max-width:560px;margin:12px 0 0;color:#bbb2c9;font-size:15px;line-height:1.55;}
    .liftova-pro-status{display:inline-flex;align-items:center;gap:7px;margin-top:17px;padding:8px 11px;border-radius:999px;background:rgba(134,62,246,.15);border:1px solid rgba(159,92,255,.32);color:#d7c0ff;font-size:11px;font-weight:750;letter-spacing:.05em;}
    .liftova-pro-status i{width:7px;height:7px;border-radius:50%;background:#9a55ff;box-shadow:0 0 10px #9a55ff;}
    .liftova-intelligence-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 18px;}
    .liftova-intelligence-card{min-height:138px;border-radius:20px;padding:16px;background:linear-gradient(150deg,rgba(23,18,32,.97),rgba(12,11,17,.97));border:1px solid rgba(151,99,216,.24);box-shadow:0 10px 32px rgba(0,0,0,.22);}
    .liftova-intelligence-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;margin-bottom:12px;background:linear-gradient(145deg,#6e2bd7,#9f59ff);box-shadow:0 6px 18px rgba(130,54,246,.28);font-size:16px;}
    .liftova-intelligence-card strong{display:block;color:#f7f2ff;font-size:14px;margin-bottom:5px;}
    .liftova-intelligence-card span{display:block;color:#9f98ab;font-size:12px;line-height:1.42;}
    #prismProPageContent > :not(.liftova-pro-hero):not(.liftova-intelligence-grid){border-color:rgba(150,99,215,.28)!important;}
    #prismProPageContent .card,#prismProPageContent .prism-pro-card,#prismProPageContent .pro-card{background:linear-gradient(150deg,#17121f,#0f0d14)!important;color:#f6f2ff!important;border:1px solid rgba(150,99,215,.28)!important;box-shadow:0 12px 38px rgba(0,0,0,.24)!important;border-radius:20px!important;}
    #prismProPageContent :is(h2,h3,strong){color:#f8f4ff!important;}
    #prismProPageContent :is(p,.small,small){color:#a9a1b3!important;}
    #prismProPageContent :is(button,.prism-primary){border-radius:14px!important;}
    #prismProPageContent .prism-primary,#prismProPageContent button.primary{background:linear-gradient(135deg,#6c25db,#a251ff)!important;border-color:#a35aff!important;color:white!important;box-shadow:0 8px 24px rgba(126,48,234,.28)!important;}
    #prismProPageContent .prism-pro-badge{background:rgba(133,58,238,.16)!important;color:#d7baff!important;border:1px solid rgba(166,96,255,.36)!important;}
    @media(max-width:430px){.liftova-pro-hero h1{font-size:30px}.liftova-intelligence-grid{grid-template-columns:1fr 1fr}.liftova-intelligence-card{min-height:148px;padding:14px}}
  `;
  document.head.appendChild(css);

  const intro = () => `
    <div class="liftova-pro-hero" id="liftovaProHero">
      <div class="liftova-pro-orbit" aria-hidden="true"></div>
      <div class="liftova-pro-kicker">LIFTOVA COACH · PRO</div>
      <h1>Your training.<span>Now it adapts to you.</span></h1>
      <p>Free gives you a premium workout experience. Pro adds the intelligence layer — learning from what you log and helping decide what should change next.</p>
      <div class="liftova-pro-status"><i></i> ADAPTIVE INTELLIGENCE</div>
    </div>
    <div class="liftova-intelligence-grid" id="liftovaIntelligenceGrid">
      <div class="liftova-intelligence-card"><div class="liftova-intelligence-icon">↗</div><strong>Smart Progression</strong><span>Uses your recent performance to guide the next weight and rep target.</span></div>
      <div class="liftova-intelligence-card"><div class="liftova-intelligence-icon">◈</div><strong>Recovery Awareness</strong><span>Factors in readiness and recent training before pushing progression.</span></div>
      <div class="liftova-intelligence-card"><div class="liftova-intelligence-icon">⌁</div><strong>Plateau Detection</strong><span>Surfaces stalled patterns so training can change before progress goes flat.</span></div>
      <div class="liftova-intelligence-card"><div class="liftova-intelligence-icon">◎</div><strong>Deeper Analytics</strong><span>Turns logged workouts into longer-term strength, volume and consistency signals.</span></div>
    </div>`;

  function rebrandProContent() {
    const screen = document.getElementById('prismProScreen');
    const content = document.getElementById('prismProPageContent');
    if (!screen || !content) return;

    if (!document.getElementById('liftovaProHero')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = intro();
      while (wrapper.firstChild) content.insertBefore(wrapper.firstChild, content.firstChild);
    }

    // Presentation-only rename. Existing PRISM-prefixed internal APIs and storage keys stay untouched.
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (node.parentElement?.closest('#liftovaProHero,#liftovaIntelligenceGrid')) continue;
      if (/PRISM/.test(node.nodeValue || '')) node.nodeValue = node.nodeValue.replaceAll('PRISM', 'LIFTOVA');
    }
    screen.setAttribute('aria-label','LIFTOVA Pro');
  }

  const observer = new MutationObserver(() => rebrandProContent());
  const boot = () => {
    const content = document.getElementById('prismProPageContent');
    if (!content) return setTimeout(boot, 120);
    observer.observe(content,{childList:true,subtree:true});
    rebrandProContent();
  };
  boot();
})();
