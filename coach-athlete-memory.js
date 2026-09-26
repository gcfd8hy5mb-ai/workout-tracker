/* PRISM Beta 40 — Durable Athlete Memory v1.0
   Converts repeated measured patterns into durable, revisable coaching traits.
   Local-first and designed to migrate to cloud storage later. */
const PRISM_ATHLETE_MEMORY_VERSION='1.0';
const PRISM_ATHLETE_MEMORY_KEY='prismAthleteLearnedMemoryV1';

function prismMemorySafe(fn,fallback=null){try{const v=fn();return v==null?fallback:v}catch{return fallback}}
function prismMemoryRead(){try{const v=JSON.parse(localStorage.getItem(PRISM_ATHLETE_MEMORY_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{version:PRISM_ATHLETE_MEMORY_VERSION,traits:{},updatedAt:null}}catch{return {version:PRISM_ATHLETE_MEMORY_VERSION,traits:{},updatedAt:null}}}
function prismMemoryWrite(memory){memory.version=PRISM_ATHLETE_MEMORY_VERSION;memory.updatedAt=new Date().toISOString();try{localStorage.setItem(PRISM_ATHLETE_MEMORY_KEY,JSON.stringify(memory))}catch{}return memory}
function prismMemoryTrait(id,label,direction,confidence,evidence,scope,details={}){return {id,label,direction,confidence:Number(Math.max(0,Math.min(1,confidence||0)).toFixed(3)),evidence:Number(evidence||0),scope,details,learnedAt:new Date().toISOString(),lastConfirmedAt:new Date().toISOString(),status:'active'}}
function prismMemoryCandidates(){
  const out=[];
  const response=prismMemorySafe(()=>typeof prismAthleteResponsePatterns==='function'?prismAthleteResponsePatterns():[],[])||[];
  response.filter(p=>p.effectiveSamples>=2.5&&p.confidence>=.4&&(p.signal==='works'||p.signal==='poor')).forEach(p=>{const name=prismMemorySafe(()=>p.exerciseId&&typeof getExercise==='function'?getExercise(p.exerciseId)?.name:null,null)||'this exercise',good=p.signal==='works';out.push(prismMemoryTrait(`response:${p.key}`,good?`${name} responds well to ${String(p.targetMode||p.kind).replaceAll('_',' ')}`:`${name} responds poorly to ${String(p.targetMode||p.kind).replaceAll('_',' ')}`,good?'positive':'negative',p.confidence,p.effectiveSamples,{exerciseId:p.exerciseId,kind:p.kind,mode:p.targetMode},{score:p.weightedScore,source:'response_model'}))});
  const teaching=prismMemorySafe(()=>typeof prismAthleteTeachingPatterns==='function'?prismAthleteTeachingPatterns():[],[])||[];
  teaching.filter(p=>p.effectiveSamples>=2.5&&p.confidence>=.4&&p.signal==='athlete_knows').forEach(p=>{const name=prismMemorySafe(()=>p.exerciseId&&typeof getExercise==='function'?getExercise(p.exerciseId)?.name:null,null)||'this exercise';let adjustment=p.style.replaceAll('_',' ');if(p.style==='lighter'&&p.avgWeightDelta!=null)adjustment=`about ${Math.abs(Math.round(p.avgWeightDelta))} lb lighter`;if(p.style==='heavier'&&p.avgWeightDelta!=null)adjustment=`about ${Math.abs(Math.round(p.avgWeightDelta))} lb heavier`;out.push(prismMemoryTrait(`teaching:${p.key}`,`${name} often does better when you choose ${adjustment}`, 'preference',p.confidence,p.effectiveSamples,{exerciseId:p.exerciseId,kind:p.kind},{style:p.style,avgWeightDelta:p.avgWeightDelta,avgRepsDelta:p.avgRepsDelta,avgSetsDelta:p.avgSetsDelta,score:p.score,source:'athlete_teaching'}))});
  return out;
}
function prismRefreshAthleteMemory(){
  const memory=prismMemoryRead(),traits=memory.traits||{},candidates=prismMemoryCandidates(),seen=new Set();
  candidates.forEach(c=>{seen.add(c.id);const old=traits[c.id];if(old){traits[c.id]={...old,...c,learnedAt:old.learnedAt||c.learnedAt,lastConfirmedAt:new Date().toISOString(),status:'active'}}else traits[c.id]=c});
  Object.values(traits).forEach(t=>{if(seen.has(t.id))return;const age=(Date.now()-new Date(t.lastConfirmedAt||t.learnedAt||0).getTime())/86400000;if(age>120)t.status='stale'});
  const ids=Object.keys(traits);if(ids.length>60)ids.sort((a,b)=>new Date(traits[b].lastConfirmedAt||0)-new Date(traits[a].lastConfirmedAt||0)).slice(60).forEach(id=>delete traits[id]);
  memory.traits=traits;return prismMemoryWrite(memory);
}
function prismAthleteMemoryTraits(filter={}){const memory=prismMemoryRead();return Object.values(memory.traits||{}).filter(t=>t.status==='active'&&(!filter.exerciseId||t.scope?.exerciseId===filter.exerciseId)&&(!filter.kind||t.scope?.kind===filter.kind)).sort((a,b)=>(b.confidence*b.evidence)-(a.confidence*a.evidence))}
function prismAthleteMemoryForDecision(decision){if(!decision?.meta?.exerciseId)return [];const kind=decision.source==='smart_progression'?'progression':decision.source;return prismAthleteMemoryTraits({exerciseId:decision.meta.exerciseId}).filter(t=>!t.scope?.kind||t.scope.kind===kind).slice(0,4)}
function prismApplyAthleteMemory(decision){
  const traits=prismAthleteMemoryForDecision(decision);if(!traits.length)return decision;
  let priority=Number(decision.priority)||0,confidence=Number(decision.confidence)||.65,positive=0,negative=0;traits.forEach(t=>{const strength=t.confidence*Math.min(1,t.evidence/4);if(t.direction==='positive'||t.direction==='preference')positive+=strength;if(t.direction==='negative')negative+=strength});
  const net=positive-negative;let why=decision.why,action=decision.action;if(Math.abs(net)>=.2){if(net>0){priority+=Math.round(5*Math.min(1,net));confidence=Math.min(.97,confidence+(.05*Math.min(1,net)));why=`${why} Long-term athlete memory also supports this direction: ${traits[0].label}.`}else{priority-=Math.round(7*Math.min(1,Math.abs(net)));confidence=Math.max(.52,confidence-(.08*Math.min(1,Math.abs(net))));action=`Keep this change conservative. ${action}`;why=`${why} Long-term athlete memory adds caution: ${traits.find(t=>t.direction==='negative')?.label||traits[0].label}.`}}
  return {...decision,priority,confidence:Number(confidence.toFixed(3)),action,why,meta:{...(decision.meta||{}),athleteMemory:{traits,net:Number(net.toFixed(3))}}};
}
function prismAthleteMemorySummary(){const traits=prismAthleteMemoryTraits();return {version:PRISM_ATHLETE_MEMORY_VERSION,total:traits.length,highConfidence:traits.filter(t=>t.confidence>=.7).length,traits:traits.slice(0,10),updatedAt:prismMemoryRead().updatedAt}}
function prismInstallAthleteMemory(){if(typeof window.prismCoachAnalyze!=='function'||window.prismCoachAnalyze.__prismAthleteMemory)return false;prismRefreshAthleteMemory();const original=window.prismCoachAnalyze,wrapped=function(){prismRefreshAthleteMemory();const result=original();if(!result||!Array.isArray(result.decisions))return result;const decisions=result.decisions.map(prismApplyAthleteMemory).sort((a,b)=>b.priority-a.priority).slice(0,5);return {...result,decisions,athleteMemory:prismAthleteMemorySummary()}};wrapped.__prismAthleteMemory=true;wrapped.__original=original;window.prismCoachAnalyze=wrapped;try{if(typeof prismCoachAnalyze==='function')prismCoachAnalyze=wrapped}catch{}return true}
window.prismRefreshAthleteMemory=prismRefreshAthleteMemory;window.prismAthleteMemoryTraits=prismAthleteMemoryTraits;window.prismAthleteMemoryForDecision=prismAthleteMemoryForDecision;window.prismApplyAthleteMemory=prismApplyAthleteMemory;window.prismAthleteMemorySummary=prismAthleteMemorySummary;window.prismInstallAthleteMemory=prismInstallAthleteMemory;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(prismInstallAthleteMemory,120),{once:true});else setTimeout(prismInstallAthleteMemory,120);
