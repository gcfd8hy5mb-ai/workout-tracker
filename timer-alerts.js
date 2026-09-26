/* PRISM Timer Alerts v1.0 — progressive enhancement for web/PWA timers. */
(()=>{
 const KEY='prismTimerAlertModeV1';
 const MODES=['haptic_sound','haptic','sound','off'];
 function mode(){const v=localStorage.getItem(KEY)||'haptic_sound';return MODES.includes(v)?v:'haptic_sound'}
 function setMode(v){if(!MODES.includes(v))return false;localStorage.setItem(KEY,v);window.dispatchEvent(new CustomEvent('prism:timer-alert-mode',{detail:v}));return true}
 function vibrate(){if(!navigator.vibrate)return false;try{return navigator.vibrate([180,90,180,90,320])!==false}catch{return false}}
 function sound(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;const ctx=new AC(),gain=ctx.createGain();gain.connect(ctx.destination);gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.18,ctx.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.85);[0,.22,.44].forEach((delay,i)=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=i===2?880:660;o.connect(gain);o.start(ctx.currentTime+delay);o.stop(ctx.currentTime+delay+.16)});setTimeout(()=>ctx.close(),1200);return true}catch{return false}}
 function alert(){const m=mode();if(m==='off')return {mode:m,haptic:false,sound:false};return {mode:m,haptic:m.includes('haptic')?vibrate():false,sound:m.includes('sound')?sound():false}}
 function labels(){return {haptic_sound:'Haptic + Sound',haptic:'Haptic',sound:'Sound',off:'Off'}}
 function installSettings(host){if(!host||host.querySelector('[data-prism-timer-alerts]'))return;const wrap=document.createElement('div');wrap.dataset.prismTimerAlerts='1';wrap.innerHTML=`<label style="display:block;font-weight:700;margin-bottom:6px">Timer Alert</label><select data-prism-timer-alert-select style="width:100%;min-height:44px;border:1px solid #d1d1d6;border-radius:12px;padding:0 12px;background:#fff;font:inherit"></select><p class="small" style="margin:7px 0 0">Haptics depend on device/browser support. Sound works while PRISM is active and audio is permitted.</p>`;const sel=wrap.querySelector('select'),map=labels();MODES.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=map[v];sel.appendChild(o)});sel.value=mode();sel.onchange=()=>setMode(sel.value);host.appendChild(wrap)}
 // Generic timer completion hook: existing timers can dispatch prism:timer-complete.
 window.addEventListener('prism:timer-complete',()=>alert());
 window.prismTimerAlerts={mode,setMode,alert,vibrate,sound,installSettings,labels,version:'1.0'};
})();