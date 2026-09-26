/* PRISM Beta 40 — Athlete Teaching Model v1.0
   Learns when the athlete modifies a Coach recommendation and that modification
   produces a better outcome. This lets PRISM learn from the athlete's choices. */
const PRISM_ATHLETE_TEACHING_VERSION='1.0';

function prismTeachingSafe(fn,fallback=null){try{const v=fn();return v==null?fallback:v}catch{return fallback}}
function prismTeachingRows(){return prismTeachingSafe(()=>typeof prismInterventionRows==='function'?prismInterventionRows():JSON.parse(localStorage.getItem('prismCoachInterventionsV1')||'[]'),[])||[]}
function prismTeachingNumber(v){const n=Number(v);return Number.isFinite(n)?n:null}
function prismTeachingActual(row){const a=row?.response?.actual;if(!a||typeof a!=='object')return null;return {weight:prismTeachingNumber(a.weight),reps:prismTeachingNumber(a.reps),sets:prismTeachingNumber(a.sets),action:String(a.action||a.mode||'').toLowerCase()}}
function prismTeachingTarget(row){const t=row?.target;if(!t||typeof t!=='object')return null;return {weight:prismTeachingNumber(t.weight),repsMin:prismTeachingNumber(t.repsMin),repsMax:prismTeachingNumber(t.repsMax),sets:prismTeachingNumber(t.sets),action:String(t.action||t.mode||'').toLowerCase()}}
function prismTeachingDelta(row){
  const actual=prismTeachingActual(row),target=prismTeachingTarget(row);if(!actual||!target)return null;
  const weightDelta=actual.weight!=null&&target.weight!=null?actual.weight-target.weight:null;
  const repMid=target.repsMin!=null&&target.repsMax!=null?(target.repsMin+target.repsMax)/2:target.repsMax??target.repsMin;
  const repsDelta=actual.reps!=null&&repMid!=null?actual.reps-repMid:null;
  const setsDelta=actual.sets!=null&&target.sets!=null?actual.sets-target.sets:null;
  let style='changed';
  if(weightDelta!=null&&weightDelta<0)style='lighter';else if(weightDelta!=null&&weightDelta>0)style='heavier';else if(repsDelta!=null&&repsDelta>0)style='more_reps';else if(repsDelta!=null&&repsDelta<0)style='fewer_reps';else if(setsDelta!=null&&setsDelta<0)style='less_volume';else if(setsDelta!=null&&setsDelta>0)style='more_volume';else if(actual.action)style=actual.action;
  return {style,weightDelta,repsDelta,setsDelta,actual,target};
}
function prismTeachingWeight(row){const at=new Date(row?.outcome?.at||row?.at||0).getTime(),days=Math.max(0,(Date.now()-at)/86400000);return Math.max(.3,Math.exp(-days/75))}
function prismAthleteTeachingExamples(exerciseId=null){
  return prismTeachingRows().filter(row=>row?.response?.value==='modified'&&row?.outcome?.value&&(!exerciseId||row.exerciseId===exerciseId)).map(row=>({row,delta:prismTeachingDelta(row)})).filter(x=>x.delta).slice(0,80);
}
function prismAthleteTeachingPatterns(exerciseId=null){
  const examples=prismAthleteTeachingExamples(exerciseId),groups=new Map();
  examples.forEach(x=>{const key=`${x.row.exerciseId||'all'}|${x.row.kind||'coach'}|${x.delta.style}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x)});
  return [...groups.entries()].map(([key,items])=>{
    const total=items.reduce((s,x)=>s+prismTeachingWeight(x.row),0),positive=items.reduce((s,x)=>s+prismTeachingWeight(x.row)*(x.row.outcome.value==='better'?1:x.row.outcome.value==='same'?.5:0),0),score=total?positive/total:.5,confidence=Math.min(1,total/5),first=items[0];
    const avg=(field)=>{const vals=items.map(x=>x.delta[field]).filter(v=>v!=null);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null};
    let signal='learning';if(total>=1.5){if(score>=.7)signal='athlete_knows';else if(score<=.35)signal='modification_poor';else signal='mixed'}
    return {key,exerciseId:first.row.exerciseId||null,kind:first.row.kind||'coach',style:first.delta.style,count:items.length,effectiveSamples:Number(total.toFixed(2)),score:Number(score.toFixed(3)),confidence:Number(confidence.toFixed(3)),signal,avgWeightDelta:avg('weightDelta'),avgRepsDelta:avg('repsDelta'),avgSetsDelta:avg('setsDelta')};
  }).sort((a,b)=>(b.confidence*b.effectiveSamples)-(a.confidence*a.effectiveSamples));
}
function prismAthleteTeachingAdvice(exerciseId,kind=null){
  const patterns=prismAthleteTeachingPatterns(exerciseId).filter(p=>(!kind||p.kind===kind)&&p.effectiveSamples>=1.5),best=patterns[0];
  if(!best)return {signal:'learning',confidence:0,factor:1,message:'PRISM does not yet have enough successful athlete modifications to change this recommendation.'};
  if(best.signal==='athlete_knows'){
    const detail=best.style==='lighter'&&best.avgWeightDelta!=null?`using about ${Math.abs(Math.round(best.avgWeightDelta))} lb less`:best.style==='heavier'&&best.avgWeightDelta!=null?`using about ${Math.abs(Math.round(best.avgWeightDelta))} lb more`:best.style==='more_reps'?'doing more reps':best.style==='fewer_reps'?'doing fewer reps':best.style==='less_volume'?'using less volume':best.style==='more_volume'?'using more volume':`using a ${best.style.replaceAll('_',' ')} adjustment`;
    return {signal:best.signal,confidence:best.confidence,factor:Number((1-(.18*best.confidence)).toFixed(3)),pattern:best,message:`When you modified Coach by ${detail}, your measured outcomes were usually better. PRISM should start closer to the adjustment you have taught it.`};
  }
  if(best.signal==='modification_poor')return {signal:best.signal,confidence:best.confidence,factor:Number((1+(.05*best.confidence)).toFixed(3)),pattern:best,message:'Your recent modifications to this type of recommendation have not improved outcomes, so PRISM should not copy that adjustment yet.'};
  return {signal:'mixed',confidence:best.confidence,factor:1,pattern:best,message:'Your modifications have produced mixed outcomes, so PRISM will keep learning without automatically copying them.'};
}
function prismApplyAthleteTeaching(decision){
  if(!decision?.meta?.exerciseId)return decision;const advice=prismAthleteTeachingAdvice(decision.meta.exerciseId,decision.source==='smart_progression'?'progression':decision.source);
  if(!advice?.pattern||advice.confidence<.3)return decision;
  let d={...decision,meta:{...(decision.meta||{}),athleteTeaching:advice}},priority:Number(decision.priority)||0,confidence:Number(decision.confidence)||.65;
  if(advice.signal==='athlete_knows'){
    d.priority+=Math.round(5*advice.confidence);d.confidence=Math.min(.97,d.confidence+(.06*advice.confidence));d.why=`${d.why} ${advice.message}`;
    const p=advice.pattern,target=Number(d.meta.targetWeight);
    if(target>0&&p.style==='lighter'&&p.avgWeightDelta<0){const taught=Math.max(0,Math.round(target+p.avgWeightDelta));if(taught>0){d.meta.originalTargetWeight=target;d.meta.targetWeight=taught;d.action=`Based on what has worked when you adjusted Coach before, start around ${taught} lb rather than ${target} lb, then use performance to decide whether to progress.`;}}
    else if(target>0&&p.style==='heavier'&&p.avgWeightDelta>0&&advice.confidence>=.6){const taught=Math.round(target+p.avgWeightDelta);d.meta.originalTargetWeight=target;d.meta.targetWeight=taught;d.action=`Your successful modifications suggest you may tolerate about ${taught} lb here. Treat it as a learned option, not an automatic increase, and only use it if today's performance supports it.`;}
  }else if(advice.signal==='modification_poor'){d.why=`${d.why} ${advice.message}`;d.confidence=Math.min(.97,d.confidence+(.02*advice.confidence));}
  else{d.confidence=Math.max(.55,d.confidence-(.03*advice.confidence));d.why=`${d.why} ${advice.message}`;}
  return d;
}
function prismInstallAthleteTeaching(){
  if(typeof window.prismCoachAnalyze!=='function'||window.prismCoachAnalyze.__prismTeaching)return false;
  const original=window.prismCoachAnalyze;
  const wrapped=function(){const result=original();if(!result||!Array.isArray(result.decisions))return result;const decisions=result.decisions.map(prismApplyAthleteTeaching).sort((a,b)=>b.priority-a.priority).slice(0,5);return {...result,decisions,athleteTeaching:{version:PRISM_ATHLETE_TEACHING_VERSION,active:decisions.some(d=>d.meta?.athleteTeaching)}}};
  wrapped.__prismTeaching=true;wrapped.__original=original;window.prismCoachAnalyze=wrapped;try{if(typeof prismCoachAnalyze==='function')prismCoachAnalyze=wrapped}catch{}return true;
}
window.prismAthleteTeachingExamples=prismAthleteTeachingExamples;
window.prismAthleteTeachingPatterns=prismAthleteTeachingPatterns;
window.prismAthleteTeachingAdvice=prismAthleteTeachingAdvice;
window.prismApplyAthleteTeaching=prismApplyAthleteTeaching;
window.prismInstallAthleteTeaching=prismInstallAthleteTeaching;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(prismInstallAthleteTeaching,20),{once:true});else setTimeout(prismInstallAthleteTeaching,20);
