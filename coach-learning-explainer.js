/* PRISM Beta 40 — Explainable Learning v1.0
   Turns internal learning evidence into concise user-facing explanations so
   Coach can say what it learned, why confidence changed, and what is uncertain. */
const PRISM_EXPLAINER_VERSION='1.0';

function prismExplainSafe(fn,fallback=null){try{const v=fn();return v==null?fallback:v}catch{return fallback}}
function prismExplainPct(v){return `${Math.round(Math.max(0,Math.min(1,Number(v)||0))*100)}%`}
function prismExplainExercise(id){return prismExplainSafe(()=>id&&typeof getExercise==='function'?getExercise(id)?.name:null,null)||'this exercise'}
function prismExplainDecision(decision){
  if(!decision)return null;const meta=decision.meta||{},name=prismExplainExercise(meta.exerciseId),r=meta.unifiedReasoning||{},memory=meta.athleteMemory||{},relearn=meta.relearning||null,context=meta.contextLearning||null,teaching=meta.athleteTeaching||null,response=meta.athleteLearning||null;
  const learned=[],caution=[],unknown=[];
  if(r.verdict==='supported')learned.push(`Your measured history supports this direction with ${prismExplainPct(r.confidence)} reasoning confidence.`);
  if(r.verdict==='caution')caution.push('Your combined outcome history suggests a more conservative approach here.');
  if(r.verdict==='conflicted')caution.push('Your personal evidence conflicts across situations, so Coach is lowering certainty instead of forcing a conclusion.');
  if(r.verdict==='uncertain')unknown.push('There is some personal evidence, but not enough agreement yet to treat it as a reliable pattern.');
  if(response?.signal==='works')learned.push(`Similar recommendations for ${name} have generally worked well for you.`);
  if(response?.signal==='poor')caution.push(`Similar recommendations for ${name} have produced weaker outcomes for you.`);
  if(teaching?.signal==='athlete_knows')learned.push('Your own successful modifications have taught Coach a better starting point.');
  if(context?.signal==='works_here')learned.push(`This approach has worked in conditions similar to your current ${context.current?.recovery||'current'} recovery and ${context.current?.schedule||'normal'} schedule.`);
  if(context?.signal==='poor_here')caution.push('This approach has performed poorly in similar recovery and schedule conditions.');
  if(Array.isArray(memory.traits)&&memory.traits.length)learned.push(`Long-term memory contains ${memory.traits.length} relevant learned ${memory.traits.length===1?'trait':'traits'} for ${name}.`);
  if(relearn)caution.push('Newer results are challenging an older learned pattern, so PRISM is actively relearning this area.');
  if(!learned.length&&!caution.length)unknown.push('Coach does not yet have enough personal outcome history to make this recommendation athlete-specific.');
  const confidence=Number(decision.confidence)||0;let confidenceLabel=confidence>=.82?'high':confidence>=.65?'moderate':'limited';
  const summary=caution.length?`${name}: Coach is using ${confidenceLabel} confidence and extra caution because your personal evidence is not fully aligned.`:learned.length?`${name}: Coach is using ${confidenceLabel} confidence because your own training history supports this recommendation.`:`${name}: Coach is still learning your response and is relying mostly on current performance signals.`;
  return {version:PRISM_EXPLAINER_VERSION,decisionId:decision.id,exerciseId:meta.exerciseId||null,summary,confidence,confidenceLabel,learned:[...new Set(learned)].slice(0,4),caution:[...new Set(caution)].slice(0,4),unknown:[...new Set(unknown)].slice(0,3)};
}
function prismExplainCoachResult(result){const decisions=(result?.decisions||[]).map(prismExplainDecision).filter(Boolean);const memory=prismExplainSafe(()=>typeof prismAthleteMemorySummary==='function'?prismAthleteMemorySummary():null,null),relearning=prismExplainSafe(()=>typeof prismRelearningStatus==='function'?prismRelearningStatus():null,null);return {version:PRISM_EXPLAINER_VERSION,decisions,memory,relearning,headline:decisions.some(x=>x.caution.length)?'Coach is adapting with caution based on your recent evidence.':decisions.some(x=>x.learned.length)?'Coach is personalizing recommendations from your measured training history.':'Coach is collecting evidence to personalize future recommendations.'}}
function prismCoachLearningNarrative(decision){const e=prismExplainDecision(decision);if(!e)return '';const parts=[e.summary];if(e.learned[0])parts.push(`Learned: ${e.learned[0]}`);if(e.caution[0])parts.push(`Caution: ${e.caution[0]}`);if(e.unknown[0])parts.push(`Still learning: ${e.unknown[0]}`);return parts.join(' ')}
function prismInstallLearningExplainer(){if(typeof window.prismCoachAnalyze!=='function'||window.prismCoachAnalyze.__prismExplainer)return false;const original=window.prismCoachAnalyze,wrapped=function(){const result=original();if(!result||!Array.isArray(result.decisions))return result;const decisions=result.decisions.map(d=>({...d,meta:{...(d.meta||{}),learningExplanation:prismExplainDecision(d)}}));const next={...result,decisions};return {...next,learningExplanation:prismExplainCoachResult(next)}};wrapped.__prismExplainer=true;wrapped.__original=original;window.prismCoachAnalyze=wrapped;try{if(typeof prismCoachAnalyze==='function')prismCoachAnalyze=wrapped}catch{}return true}
window.prismExplainDecision=prismExplainDecision;window.prismExplainCoachResult=prismExplainCoachResult;window.prismCoachLearningNarrative=prismCoachLearningNarrative;window.prismInstallLearningExplainer=prismInstallLearningExplainer;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(prismInstallLearningExplainer,180),{once:true});else setTimeout(prismInstallLearningExplainer,180);
