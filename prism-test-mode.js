/* PRISM Developer Test Mode v1.0 — isolated synthetic scenarios for feature verification. Never writes synthetic workouts into real history. */
(()=>{
 const KEY='prismDeveloperTestModeV1',SCENARIO='prismDeveloperScenarioV1';
 const scenarios={
  progression:{name:'Progression Ready',description:'Three synthetic exposures with improving performance and repeat top-range work.',exercise:{id:'test-chest-press',name:'Machine Chest Press'},sessions:[{weight:100,reps:10},{weight:100,reps:12},{weight:100,reps:12}]},
  plateau:{name:'Plateau',description:'Repeated sessions without meaningful improvement.',exercise:{id:'test-lateral-raise',name:'Lateral Raise'},sessions:[{weight:25,reps:10},{weight:25,reps:10},{weight:25,reps:9},{weight:25,reps:10}]},
  fatigue:{name:'Fatigue Drop',description:'Same load with a meaningful recent rep drop.',exercise:{id:'test-row',name:'Machine Row'},sessions:[{weight:120,reps:12},{weight:120,reps:11},{weight:120,reps:7}]},
  learning:{name:'Coach Learning',description:'Enough synthetic history for Coach-ready UI and recommendation testing.',exercise:{id:'test-press',name:'Chest Press'},sessions:[{weight:100,reps:9},{weight:100,reps:10},{weight:100,reps:11},{weight:100,reps:12}]}
 };
 function enabled(){return sessionStorage.getItem(KEY)==='1'}
 function enable(){sessionStorage.setItem(KEY,'1');if(!sessionStorage.getItem(SCENARIO))sessionStorage.setItem(SCENARIO,'progression');emit()}
 function disable(){sessionStorage.removeItem(KEY);sessionStorage.removeItem(SCENARIO);emit()}
 function setScenario(id){if(!scenarios[id])return false;sessionStorage.setItem(SCENARIO,id);enable();emit();return true}
 function current(){if(!enabled())return null;const id=sessionStorage.getItem(SCENARIO)||'progression';return {id,...scenarios[id],synthetic:true}}
 function emit(){window.dispatchEvent(new CustomEvent('prism:test-mode-change',{detail:current()}))}
 function banner(){let b=document.getElementById('prismTestModeBanner');if(!enabled()){b?.remove();return}if(!b){b=document.createElement('div');b.id='prismTestModeBanner';b.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(72px + env(safe-area-inset-bottom));z-index:99999;background:#111;color:#fff;border-radius:12px;padding:9px 12px;font:700 12px -apple-system,BlinkMacSystemFont,sans-serif;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.22)';document.body.appendChild(b)}const c=current();b.textContent=`TEST MODE · ${c?.name||'Synthetic data'} · Real history untouched`}
 function status(){return {enabled:enabled(),scenario:current(),available:Object.entries(scenarios).map(([id,x])=>({id,name:x.name,description:x.description}))}}
 window.prismTestMode={enable,disable,setScenario,current,status,isEnabled:enabled,version:'1.0'};
 window.addEventListener('prism:test-mode-change',banner);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',banner,{once:true});else banner();
})();