/* PRISM Beta 40 — Unified Coach Reasoning v1.0
   Combines response history, athlete teaching and context evidence into one
   evidence decision so learning layers do not independently fight each other. */
const PRISM_REASONING_VERSION='1.0';

function prismReasonSafe(fn,fallback=null){try{const v=fn();return v==null?fallback:v}catch{return fallback}}
function prismReasonClamp(v,min,max){return Math.max(min,Math.min(max,v))}
function prismReasonKind(d){return d?.source==='smart_progression'?'progression':d?.source==='plateau_detection'?'plateau':d?.source||'coach'}
function prismReasonMode(d){return String(d?.meta?.action||(/^progress-/.test(d?.id||'')?'progress':/hold/.test(d?.id||'')?'hold':'general')).toLowerCase()}
function prismReasonEvidence(decision){
  const exerciseId=decision?.meta?.exerciseId||null,kind=prismReasonKind(decision),mode=prismReasonMode(decision);
  const response=exerciseId?prismReasonSafe(()=>typeof prismAthleteResponseRecommendation==='function'?prismAthleteResponseRecommendation(exerciseId,kind,mode):null,null):null;
  const teaching=exerciseId?prismReasonSafe(()=>typeof prismAthleteTeachingAdvice==='function'?prismAthleteTeachingAdvice(exerciseId,kind):null,null):null;
  const context=exerciseId?prismReasonSafe(()=>typeof prismContextAdvice==='function'?prismContextAdvice(exerciseId,kind):null,null):null;
  return {exerciseId,kind,mode,response,teaching,context};
}
function prismReasonSignalScore(e){
  const parts=[];
  if(e.response?.evidence){const dir=e.response.signal==='works'?1:e.response.signal==='poor'?-1:0;parts.push({source:'response',direction:dir,confidence:e.response.confidence||0,evidence:e.response.evidence||0,weight:1})}
  if(e.teaching?.pattern){const dir=e.teaching.signal==='athlete_knows'?1:e.teaching.signal==='modification_poor'?-1:0;parts.push({source:'athlete_teaching',direction:dir,confidence:e.teaching.confidence||0,evidence:e.teaching.pattern?.effectiveSamples||0,weight:.9})}
  if(e.context?.effectiveSamples){const dir=e.context.signal==='works_here'?1:e.context.signal==='poor_here'?-1:0;parts.push({source:'context',direction:dir,confidence:e.context.confidence||0,evidence:e.context.effectiveSamples||0,weight:1.15})}
  let denom=0,total=0;parts.forEach(p=>{const reliability=p.weight*prismReasonClamp(p.confidence,0,1)*prismReasonClamp(p.evidence/3,0,1);p.reliability=reliability;denom+=reliability;total+=reliability*p.direction});
  const score=denom?total/denom:0,positive=parts.filter(p=>p.direction>0&&p.reliability>.1).length,negative=parts.filter(p=>p.direction<0&&p.reliability>.1).length,conflict=positive>0&&negative>0,confidence=prismReasonClamp(denom/2.2,0,1);
  return {parts,score:Number(score.toFixed(3)),confidence:Number(confidence.toFixed(3)),conflict,positive,negative};
}
function prismUnifiedCoachReasoning(decision){
  if(!decision?.meta?.exerciseId)return decision;
  const evidence=prismReasonEvidence(decision),summary=prismReasonSignalScore(evidence);
  if(!summary.parts.length)return {...decision,meta:{...(decision.meta||{}),unifiedReasoning:{version:PRISM_REASONING_VERSION,...summary}}};
  let priority=Number(decision.priority)||0,confidence=Number(decision.confidence)||.65,action=decision.action,why=decision.why,verdict='learning';
  if(summary.conflict){verdict='conflicted';priority-=Math.round(4*summary.confidence);confidence=Math.max(.52,confidence-(.12*summary.confidence));why=`${why} Your personal evidence disagrees across situations, so Coach is deliberately lowering certainty instead of letting one learning signal override the others.`}
  else if(summary.score>=.35){verdict='supported';priority+=Math.round(8*summary.confidence);confidence=Math.min(.97,confidence+(.09*summary.confidence));why=`${why} Multiple pieces of your own outcome history support this direction.`}
  else if(summary.score<=-.35){verdict='caution';priority-=Math.round(12*summary.confidence);confidence=Math.max(.5,confidence-(.16*summary.confidence));action=`Use the conservative version of this plan. ${action}`;why=`${why} Your combined response history suggests caution with this approach.`}
  else if(summary.confidence>=.25){verdict='uncertain';priority-=Math.round(3*summary.confidence);confidence=Math.max(.55,confidence-(.06*summary.confidence));why=`${why} Your personal evidence is not strong enough in either direction yet, so Coach is keeping the recommendation conservative.`}
  const taught=evidence.teaching;
  if(verdict==='supported'&&taught?.signal==='athlete_knows'&&taught.confidence>=.55&&Number(decision.meta?.targetWeight)>0){const p=taught.pattern,target=Number(decision.meta.targetWeight);if(p?.style==='lighter'&&p.avgWeightDelta<0){const learned=Math.max(0,Math.round(target+p.avgWeightDelta));if(learned>0){action=`Your successful adjustments support starting around ${learned} lb instead of ${target} lb. Use today's performance to confirm it.`;decision={...decision,meta:{...(decision.meta||{}),originalTargetWeight:target,targetWeight:learned}}}}}
  return {...decision,priority,confidence:Number(confidence.toFixed(3)),action,why,meta:{...(decision.meta||{}),unifiedReasoning:{version:PRISM_REASONING_VERSION,verdict,...summary,evidence}}};
}
function prismUnifiedReasoningDecision(result){
  const rows=(result?.decisions||[]).filter(d=>d.meta?.unifiedReasoning?.summary||d.meta?.unifiedReasoning).map(d=>({title:d.title,exerciseId:d.meta?.exerciseId,verdict:d.meta.unifiedReasoning.verdict,score:d.meta.unifiedReasoning.score,confidence:d.meta.unifiedReasoning.confidence}));
  return {version:PRISM_REASONING_VERSION,decisions:rows,supported:rows.filter(x=>x.verdict==='supported').length,caution:rows.filter(x=>x.verdict==='caution').length,conflicted:rows.filter(x=>x.verdict==='conflicted').length};
}
function prismInstallUnifiedReasoning(){
  if(typeof window.prismCoachAnalyze!=='function'||window.prismCoachAnalyze.__prismUnifiedReasoning)return false;
  const original=window.prismCoachAnalyze,wrapped=function(){const result=original();if(!result||!Array.isArray(result.decisions))return result;const decisions=result.decisions.map(prismUnifiedCoachReasoning).sort((a,b)=>b.priority-a.priority).slice(0,5),next={...result,decisions};return {...next,reasoning:prismUnifiedReasoningDecision(next)}};
  wrapped.__prismUnifiedReasoning=true;wrapped.__original=original;window.prismCoachAnalyze=wrapped;try{if(typeof prismCoachAnalyze==='function')prismCoachAnalyze=wrapped}catch{}return true;
}
window.prismReasonEvidence=prismReasonEvidence;window.prismReasonSignalScore=prismReasonSignalScore;window.prismUnifiedCoachReasoning=prismUnifiedCoachReasoning;window.prismUnifiedReasoningDecision=prismUnifiedReasoningDecision;window.prismInstallUnifiedReasoning=prismInstallUnifiedReasoning;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(prismInstallUnifiedReasoning,80),{once:true});else setTimeout(prismInstallUnifiedReasoning,80);
