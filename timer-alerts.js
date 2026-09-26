/* PRISM Timer Alerts v1.2 — configurable rest-timer sound/haptic alerts for web/PWA. */
(()=>{
 const KEY='prismTimerAlertModeV1',MODES=['haptic_sound','haptic','sound','off'];
 let audioCtx=null,lastAlert=0,lastGeneric='',lastRest='';
 const nativeVibrate=typeof navigator.vibrate==='function'?navigator.vibrate.bind(navigator):null;
 const labels=()=>({haptic_sound:'Haptic + Sound',haptic:'Haptic',sound:'Sound',off:'Off'});
 function mode(){const v=localStorage.getItem(KEY)||'haptic_sound';return MODES.includes(v)?v:'haptic_sound'}
 function setMode(v){if(!MODES.includes(v))return false;localStorage.setItem(KEY,v);syncSelects();primeAudio();return true}
 function primeAudio(){if(!mode().includes('sound'))return false;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')audioCtx.resume();return true}catch{return false}}
 function haptic(pattern=[180,90,180,90,320]){if(!nativeVibrate||!mode().includes('haptic'))return false;try{return nativeVibrate(pattern)!==false}catch{return false}}
 function sound(){if(!mode().includes('sound'))return false;try{if(!primeAudio()||!audioCtx)return false;const now=audioCtx.currentTime,g=audioCtx.createGain();g.connect(audioCtx.destination);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.22,now+.02);g.gain.exponentialRampToValueAtTime(.0001,now+.9);[0,.24,.48].forEach((delay,i)=>{const o=audioCtx.createOscillator();o.type='sine';o.frequency.value=i===2?880:660;o.connect(g);o.start(now+delay);o.stop(now+delay+.17)});return true}catch{return false}}
 function alert({includeHaptic=true}={}){const m=mode(),now=Date.now();if(m==='off'||now-lastAlert<900)return {mode:m,haptic:false,sound:false};lastAlert=now;return {mode:m,haptic:includeHaptic&&m.includes('haptic')?haptic():false,sound:m.includes('sound')?sound():false}}
 function selectMarkup(){const map=labels();return `<label style="display:block;font-weight:700;margin:10px 0 6px">Timer alert</label><select data-prism-timer-alert-select aria-label="Timer alert" style="width:100%;min-height:44px;border:1px solid #d1d1d6;border-radius:12px;padding:0 12px;background:#fff;font:inherit">${MODES.map(v=>`<option value="${v}">${map[v]}</option>`).join('')}</select><p class="small" style="margin:7px 0 0">Sound is the most reliable alert in the web app. Haptic vibration works only on devices and browsers that support it.</p>`}
 function install(host){if(!host||host.querySelector('[data-prism-timer-alerts]'))return;const wrap=document.createElement('div');wrap.dataset.prismTimerAlerts='1';wrap.style.marginTop='12px';wrap.innerHTML=selectMarkup();host.appendChild(wrap);const s=wrap.querySelector('select');s.value=mode();s.onchange=()=>setMode(s.value)}
 function syncSelects(){document.querySelectorAll('[data-prism-timer-alert-select]').forEach(s=>s.value=mode())}
 function mount(){document.querySelectorAll('.timer-card').forEach(install);const strip=document.querySelector('.rest-strip');if(strip)install(strip)}
 function watch(){mount();const generic=document.querySelector('[data-timer-display]')?.textContent?.trim()||'',rest=document.getElementById('workoutRestStatus')?.textContent?.trim()||'';if(generic==='0:00'&&lastGeneric!=='0:00')alert({includeHaptic:false});if(/rest complete/i.test(rest)&&!(/rest complete/i.test(lastRest)))alert({includeHaptic:false});lastGeneric=generic;lastRest=rest}
 // Existing PRISM timers already call navigator.vibrate at completion. Route those calls through the user's selected mode so Sound/Off do not vibrate and Haptic modes do.
 if(nativeVibrate){try{navigator.vibrate=pattern=>mode().includes('haptic')?nativeVibrate(pattern):false}catch{}}
 document.addEventListener('click',e=>{if(e.target.closest('.timer-start,.timer-button,#workoutRestPresets,.set-block button'))primeAudio()},true);
 window.addEventListener('prism:timer-complete',()=>alert());
 const observer=new MutationObserver(()=>setTimeout(watch,0));
 function start(){mount();watch();observer.observe(document.body,{subtree:true,childList:true,characterData:true})}
 window.prismTimerAlerts={mode,setMode,alert,haptic,sound,installSettings:install,labels,primeAudio,version:'1.2'};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();