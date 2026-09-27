/* PRISM Coach Athlete Intelligence v1 — lightweight derived athlete state, no network calls. */
(()=>{
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 function state(snapshot){
  snapshot=snapshot||safe(()=>prismCoachSnapshot(),{})||{};
  const sessions=snapshot.sessions||[],recent=sessions.slice(0,8),ex=snapshot.exercises||[],plateaus=snapshot.plateaus||[],signal=snapshot.checkinSignal||null,actions=safe(()=>typeof prismCoachReadActions==='function'?prismCoachReadActions():{},{});
  const completed=recent.length,totalSets=ex.reduce((n,x)=>n+(Number(x.sets)||0),0),volume=ex.reduce((n,x)=>n+(Number(x.volume)||0),0);
  const decisions=Object.values(actions||{}),accepted=decisions.filter(x=>x?.status==='applied').length,kept=decisions.filter(x=>x?.status==='kept').length,dismissed=decisions.filter(x=>x?.status==='dismissed').length;
  let readiness='normal';if(signal?.load==='conservative')readiness='recover';else if(signal?.load==='progressive')readiness='push';
  const evidence=completed>=6?'strong':completed>=3?'building':'early';
  const momentum=plateaus.length>=2?'stalled':completed>=3?'building':'learning';
  const headline=readiness==='recover'?'Protect recovery and preserve performance':plateaus.length?'Break stalls before adding more work':evidence==='strong'?'Use your training trend to drive the next progression':'Keep logging so Coach can sharpen your targets';
  return {completed,totalSets,volume,plateauCount:plateaus.length,readiness,evidence,momentum,accepted,kept,dismissed,headline};
 }
 function context(snapshot){const s=state(snapshot),parts=[];parts.push(`${s.completed} recent workout${s.completed===1?'':'s'}`);if(s.totalSets)parts.push(`${s.totalSets} working sets tracked`);if(s.plateauCount)parts.push(`${s.plateauCount} plateau signal${s.plateauCount===1?'':'s'}`);parts.push(`${s.evidence} evidence`);return parts.join(' · ');}
 window.prismCoachAthleteState=state;window.prismCoachAthleteContext=context;
})();