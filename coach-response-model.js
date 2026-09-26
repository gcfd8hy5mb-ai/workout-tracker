/* PRISM Beta 40 — Personalized Athlete Response Model v1.0
   Learns which coaching approaches work for this athlete by exercise,
   intervention kind and context. Local-only; no cloud dependency. */
const PRISM_RESPONSE_MODEL_VERSION='1.0';

function prismResponseSafe(fn,fallback=null){try{const v=fn();return v==null?fallback:v}catch{return fallback}}
function prismResponseRows(){return prismResponseSafe(()=>typeof prismInterventionRows==='function'?prismInterventionRows():JSON.parse(localStorage.getItem('prismCoachInterventionsV1')||'[]'),[])||[]}
function prismResponseNorm(v){return String(v==null?'':v).trim().toLowerCase()}
function prismResponseContext(row){
  const p=row?.policy||{},t=row?.target||{},d=row?.outcome?.details||{};
  return {
    exerciseId:row?.exerciseId||null,
    kind:prismResponseNorm(row?.kind||'coach'),
    policyBias:prismResponseNorm(p.loadBias||p.bias||''),
    response:prismResponseNorm(row?.response?.value||''),
    targetMode:prismResponseNorm(t.mode||t.action||t.type||''),
    recovery:prismResponseNorm(d.recovery||d.readiness||''),
    outcome:prismResponseNorm(row?.outcome?.value||'')
  };
}
function prismResponseOutcomeScore(row){const v=row?.outcome?.value;return v==='better'?1:v==='same'?.5:0}
function prismResponseWeight(row){
  const at=new Date(row?.outcome?.at||row?.response?.at||row?.at||0).getTime();
  const ageDays=Math.max(0,(Date.now()-at)/86400000);
  const recency=Math.max(.25,Math.exp(-ageDays/60));
  const adherence=row?.response?.value==='followed'?1:row?.response?.value==='modified'?.7:.35;
  return recency*adherence;
}
function prismResponseGroupKey(row){const c=prismResponseContext(row);return `${c.exerciseId||'all'}|${c.kind||'coach'}|${c.targetMode||'general'}`}
function prismResponseSummarize(rows){
  const completed=rows.filter(x=>x?.outcome?.value);
  const weight=completed.reduce((s,x)=>s+prismResponseWeight(x),0);
  const weightedScore=weight?completed.reduce((s,x)=>s+prismResponseWeight(x)*prismResponseOutcomeScore(x),0)/weight:.5;
  const effectiveSamples=weight;
  const confidence=Math.max(0,Math.min(1,effectiveSamples/6));
  return {
    count:completed.length,effectiveSamples:Number(effectiveSamples.toFixed(2)),
    better:completed.filter(x=>x.outcome.value==='better').length,
    same:completed.filter(x=>x.outcome.value==='same').length,
    worse:completed.filter(x=>x.outcome.value==='worse').length,
    weightedScore:Number(weightedScore.toFixed(3)),confidence:Number(confidence.toFixed(3)),
    confidenceLabel:confidence>=.75?'HIGH':confidence>=.4?'MEDIUM':'LOW'
  };
}
function prismAthleteResponsePatterns(){
  const rows=prismResponseRows().filter(x=>x?.outcome?.value).slice(0,120),groups=new Map();
  rows.forEach(row=>{const key=prismResponseGroupKey(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)});
  return [...groups.entries()].map(([key,list])=>{
    const c=prismResponseContext(list[0]),s=prismResponseSummarize(list);
    let signal='learning';
    if(s.effectiveSamples>=2){if(s.weightedScore>=.68)signal='works';else if(s.weightedScore<=.35)signal='poor';else signal='mixed'}
    return {key,exerciseId:c.exerciseId,kind:c.kind,targetMode:c.targetMode,signal,...s};
  }).sort((a,b)=>(b.confidence*b.effectiveSamples)-(a.confidence*a.effectiveSamples));
}
function prismAthleteResponseProfile(exerciseId=null,kind=null,targetMode=null){
  const rows=prismResponseRows().filter(row=>{
    if(!row?.outcome?.value)return false;const c=prismResponseContext(row);
    if(exerciseId&&c.exerciseId!==exerciseId)return false;
    if(kind&&c.kind!==prismResponseNorm(kind))return false;
    if(targetMode&&c.targetMode!==prismResponseNorm(targetMode))return false;
    return true;
  }).slice(0,60);
  const s=prismResponseSummarize(rows);
  let signal='learning',factor=1;
  if(s.effectiveSamples>=2){
    if(s.weightedScore>=.68){signal='works';factor=1+(.1*s.confidence)}
    else if(s.weightedScore<=.35){signal='poor';factor=1-(.35*s.confidence)}
    else{signal='mixed';factor=1-(.08*s.confidence)}
  }
  const message=signal==='works'?`This approach has worked well for this athlete (${Math.round(s.weightedScore*100)}% weighted outcome score, ${s.confidenceLabel.toLowerCase()} confidence).`:signal==='poor'?`This approach has produced weak outcomes for this athlete (${Math.round(s.weightedScore*100)}% weighted outcome score, ${s.confidenceLabel.toLowerCase()} confidence).`:signal==='mixed'?`This athlete's outcomes with this approach are mixed, so PRISM should avoid aggressive changes until the pattern is clearer.`:`PRISM is still learning how this athlete responds to this coaching approach.`;
  return {version:PRISM_RESPONSE_MODEL_VERSION,exerciseId,kind:kind||null,targetMode:targetMode||null,signal,factor:Number(factor.toFixed(3)),message,...s};
}
function prismAthleteResponseRecommendation(exerciseId,kind,targetMode){
  const specific=prismAthleteResponseProfile(exerciseId,kind,targetMode);
  const exercise=prismAthleteResponseProfile(exerciseId,kind,null);
  const global=prismAthleteResponseProfile(null,kind,targetMode);
  const candidates=[specific,exercise,global].filter(x=>x.effectiveSamples>=1).sort((a,b)=>(b.confidence*b.effectiveSamples)-(a.confidence*a.effectiveSamples));
  const best=candidates[0]||specific;
  return {factor:best.factor,signal:best.signal,confidence:best.confidence,confidenceLabel:best.confidenceLabel,reason:best.message,evidence:best.count,scope:best===specific?'exercise+approach':best===exercise?'exercise':'athlete'};
}
function prismAthleteResponseDecision(){
  const patterns=prismAthleteResponsePatterns().filter(x=>x.effectiveSamples>=2);
  if(!patterns.length)return null;
  const strongest=patterns[0];
  const exName=prismResponseSafe(()=>typeof getExercise==='function'&&strongest.exerciseId?getExercise(strongest.exerciseId)?.name:null,null);
  const subject=exName||'your training';
  const title=strongest.signal==='works'?`Coach learned what works for ${subject}`:strongest.signal==='poor'?`Coach found an approach to reconsider for ${subject}`:`Coach is refining ${subject}`;
  const action=strongest.signal==='works'?'Favor this approach when current performance and recovery also support it.':strongest.signal==='poor'?'Reduce confidence in repeating this approach and favor a more conservative alternative.':'Keep testing this approach without making large automatic changes.';
  return {id:'athlete-response-pattern',priority:strongest.signal==='poor'?94:strongest.signal==='works'?78:62,title,action,why:`${strongest.count} measured outcomes · ${Math.round(strongest.weightedScore*100)}% weighted outcome score · ${strongest.confidenceLabel.toLowerCase()} confidence.`,confidence:Math.max(.6,strongest.confidence),source:'athlete_response_model',meta:strongest};
}

window.prismAthleteResponsePatterns=prismAthleteResponsePatterns;
window.prismAthleteResponseProfile=prismAthleteResponseProfile;
window.prismAthleteResponseRecommendation=prismAthleteResponseRecommendation;
window.prismAthleteResponseDecision=prismAthleteResponseDecision;
