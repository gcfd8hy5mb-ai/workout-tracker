/* PRISM Coach Recovery + Deload Intelligence v1.0 — recommendations only; requires user approval. */
(()=>{
 const KEY='prismCoachRecoveryPlansV1';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 function analyze(){
  const program=safe(()=>window.prismCoachProgramReview?.(),null);
  const fatigue=safe(()=>JSON.parse(localStorage.getItem('prismSessionFatigueV1')||'[]'),[])||[];
  const recent=fatigue.slice(0,12),high=recent.filter(x=>x.fatigue==='high'||x.fatigue==='recovery').length,moderate=recent.filter(x=>x.fatigue==='moderate').length;
  const plateau=Number(program?.plateau||0),tracked=Number(program?.items?.length||0);
  let score=0,reasons=[];
  if(plateau>=2){score+=2;reasons.push(`${plateau} exercises are showing weak-response patterns.`)}
  if(high>=2){score+=2;reasons.push(`${high} recent exercise decisions showed high fatigue or recovery-mode signals.`)}
  if(moderate>=3){score+=1;reasons.push('Repeated moderate performance drops are appearing across recent training.')}
  let state='normal';if(score>=4)state='deload_candidate';else if(score>=2)state='recovery_watch';
  const recommendation=state==='deload_candidate'?{type:'deload',durationWorkouts:1,loadReductionPct:10,volumeReductionPct:25,title:'Recovery week recommended',summary:'Temporarily reduce training stress, then reassess performance before returning to normal progression.'}:state==='recovery_watch'?{type:'recovery_hold',durationWorkouts:1,loadReductionPct:0,volumeReductionPct:10,title:'Recovery hold recommended',summary:'Pause aggressive progression and slightly reduce volume while Coach watches the next exposure.'}:null;
  return {state,score,reasons,plateau,tracked,highFatigue:high,moderateFatigue:moderate,recommendation,requiresApproval:true};
 }
 function propose(){const a=analyze();if(!a.recommendation)return null;const rows=safe(()=>JSON.parse(localStorage.getItem(KEY)||'[]'),[])||[];const p={id:`recovery-${Date.now()}`,at:new Date().toISOString(),status:'proposed',...a};rows.unshift(p);localStorage.setItem(KEY,JSON.stringify(rows.slice(0,20)));return p}
 function respond(id,status){if(!['accepted','declined'].includes(status))return null;const rows=safe(()=>JSON.parse(localStorage.getItem(KEY)||'[]'),[])||[],p=rows.find(x=>x.id===id);if(!p)return null;p.status=status;p.respondedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(rows));window.dispatchEvent(new CustomEvent('prism:recovery-plan-response',{detail:p}));return p}
 window.prismCoachRecoveryAnalyze=analyze;window.prismCoachRecoveryPropose=propose;window.prismCoachRecoveryRespond=respond;window.PRISM_COACH_RECOVERY_VERSION='1.0';
})();