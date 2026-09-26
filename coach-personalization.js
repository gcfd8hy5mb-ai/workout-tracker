/* PRISM Beta 40 — Coach Personalization Bridge v1.0
   Connects learned athlete-response patterns to Coach recommendations without
   replacing the existing Coach engine. Must load after coach-engine.js and
   coach-response-model.js. */
const PRISM_COACH_PERSONALIZATION_VERSION='1.0';

function prismPersonalSafe(fn,fallback=null){try{const v=fn();return v==null?fallback:v}catch{return fallback}}
function prismPersonalTargetMode(decision){
  const action=String(decision?.meta?.action||'').toLowerCase();
  if(action)return action;
  if(/^progress-/.test(decision?.id||''))return 'progress';
  if(/hold/.test(decision?.id||''))return 'hold';
  if(decision?.source==='plateau_detection')return 'plateau';
  return 'general';
}
function prismPersonalKind(decision){
  if(decision?.source==='smart_progression')return 'progression';
  if(decision?.source==='plateau_detection')return 'plateau';
  if(decision?.source==='coach_checkin')return 'recovery';
  return decision?.source||'coach';
}
function prismPersonalizeDecision(decision){
  if(!decision||typeof prismAthleteResponseRecommendation!=='function')return decision;
  const exerciseId=decision.meta?.exerciseId||null;
  if(!exerciseId)return decision;
  const learned=prismPersonalSafe(()=>prismAthleteResponseRecommendation(exerciseId,prismPersonalKind(decision),prismPersonalTargetMode(decision)),null);
  if(!learned||!learned.evidence)return decision;
  const enough=learned.evidence>=2||learned.confidence>=.35;
  if(!enough)return {...decision,meta:{...(decision.meta||{}),athleteLearning:learned}};
  let priority=Number(decision.priority)||0,confidence=Number(decision.confidence)||.65,action=decision.action,why=decision.why;
  if(learned.signal==='works'){
    priority+=Math.round(8*learned.confidence);
    confidence=Math.min(.97,confidence+(0.08*learned.confidence));
    why=`${why} Athlete-specific evidence also supports this approach: ${learned.reason}`;
  }else if(learned.signal==='poor'){
    priority-=Math.round(12*learned.confidence);
    confidence=Math.max(.5,confidence-(0.18*learned.confidence));
    action=`Use a conservative version of this recommendation rather than repeating the same aggressive approach automatically. ${action}`;
    why=`${why} PRISM has learned that similar recommendations have produced weaker outcomes for you: ${learned.reason}`;
  }else if(learned.signal==='mixed'){
    priority-=Math.round(4*learned.confidence);
    confidence=Math.max(.55,confidence-(0.07*learned.confidence));
    why=`${why} Your personal response history is mixed, so Coach is lowering certainty instead of overreacting: ${learned.reason}`;
  }
  return {...decision,priority,confidence:Number(confidence.toFixed(3)),action,why,meta:{...(decision.meta||{}),athleteLearning:learned,personalized:true}};
}
function prismPersonalizeCoachResult(result){
  if(!result||!Array.isArray(result.decisions))return result;
  let decisions=result.decisions.map(prismPersonalizeDecision);
  const patternDecision=prismPersonalSafe(()=>typeof prismAthleteResponseDecision==='function'?prismAthleteResponseDecision():null,null);
  if(patternDecision)decisions.push(patternDecision);
  const seen=new Set();
  decisions=decisions.filter(d=>{const key=`${d.source}:${d.meta?.exerciseId||d.id}`;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>b.priority-a.priority).slice(0,5);
  return {...result,decisions,personalization:{version:PRISM_COACH_PERSONALIZATION_VERSION,active:decisions.some(d=>d.meta?.personalized),patternDecision:!!patternDecision}};
}
function prismInstallCoachPersonalization(){
  if(typeof window.prismCoachAnalyze!=='function'||window.prismCoachAnalyze.__prismBeta40)return false;
  const original=window.prismCoachAnalyze;
  const wrapped=function(){return prismPersonalizeCoachResult(original());};
  wrapped.__prismBeta40=true;wrapped.__original=original;
  window.prismCoachAnalyze=wrapped;
  try{if(typeof prismCoachAnalyze==='function')prismCoachAnalyze=wrapped}catch{}
  return true;
}
function prismCoachPersonalizationStatus(){
  const patterns=prismPersonalSafe(()=>typeof prismAthleteResponsePatterns==='function'?prismAthleteResponsePatterns():[],[])||[];
  const learned=patterns.filter(x=>x.effectiveSamples>=2);
  return {version:PRISM_COACH_PERSONALIZATION_VERSION,installed:!!window.prismCoachAnalyze?.__prismBeta40,patterns:patterns.length,learnedPatterns:learned.length,strongest:learned[0]||null};
}
window.prismPersonalizeDecision=prismPersonalizeDecision;
window.prismPersonalizeCoachResult=prismPersonalizeCoachResult;
window.prismInstallCoachPersonalization=prismInstallCoachPersonalization;
window.prismCoachPersonalizationStatus=prismCoachPersonalizationStatus;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(prismInstallCoachPersonalization,0),{once:true});else setTimeout(prismInstallCoachPersonalization,0);
