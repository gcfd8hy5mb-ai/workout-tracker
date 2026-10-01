/* MYLIFTCOACH Coach Context Evidence V8.1
   Captures recommendation context and interprets Athlete V8 patterns against current conditions.
   Advisory only. Adaptive Programming remains final decision authority. */
(()=>{
 const VERSION='8.1',KEY='prismCoachInterventionsV1',core=window.myliftcoachIntelligenceCore;
 const safe=core?.safe||((fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}});
 function rows(){const v=safe(()=>JSON.parse(localStorage.getItem(KEY)||'[]'),[]);return Array.isArray(v)?v:[]}
 function save(v){try{localStorage.setItem(KEY,JSON.stringify((v||[]).slice(0,180)))}catch{}}
 function currentPhase(){return String(safe(()=>window.prismCurrentGoalPhase?.()?.type,null)||safe(()=>JSON.parse(localStorage.getItem('prismGoalPhaseV1')||'null')?.type,null)||'general').toLowerCase()}
 function currentContext(){
  const row=safe(()=>window.prismCheckinCurrent?.()||window.prismCheckinLatest?.(),null),signal=safe(()=>window.prismCheckinCoachSignal?.(row),null);
  let recovery='unknown';
  if(row?.recovery==='poor'||row?.energy==='low'||signal?.load==='conservative')recovery='strained';
  else if(row?.recovery||row?.energy||signal?.load)recovery='ready';
  return {recovery,phase:currentPhase(),checkinWeek:row?.week||null,load:signal?.load||null,capturedAt:new Date().toISOString()};
 }
 function interventionEvents(){return rows().filter(x=>x?.exerciseId&&x?.outcome).map((x,i)=>{const details=x.outcome?.details||{},ctx=x.athleteContext||{};return {recommendationId:x.id||`coach-context-${i}`,exerciseId:String(x.exerciseId),recommendationType:x.kind||'coach',completedAt:x.outcome?.at||x.respondedAt||x.at||null,followedRecommendation:x.response?.value==='followed',performanceDelta:x.outcome?.value==='better'?.08:x.outcome?.value==='worse'?-.08:0,rpe:details.rpe??null,pain:details.pain??null,recoveryState:ctx.recovery||details.recoveryState||'unknown',phase:ctx.phase||details.phase||'general'};})}
 function currentKey(recovery,phase){return `${recovery}|followed|${phase}`}
 function exerciseEvidence(exerciseId){
  const events=interventionEvents(),ctx=currentContext(),profile=safe(()=>window.myliftcoachAthleteExerciseContexts?.(events,String(exerciseId)),null);
  if(!profile)return {version:VERSION,exerciseId:String(exerciseId),currentContext:ctx,state:'unavailable',strength:'none',summary:'Context-specific Athlete evidence is unavailable.',matched:null,mayOverrideAdaptive:false};
  let matched=profile.contexts?.[currentKey(ctx.recovery,ctx.phase)]||null;
  if(!matched&&ctx.phase!=='general')matched=profile.contexts?.[currentKey(ctx.recovery,'general')]||null;
  if(!matched&&ctx.recovery==='unknown'){const candidates=Object.values(profile.contexts||{}).filter(x=>x.context?.adherence==='followed'&&(x.context?.phase===ctx.phase||x.context?.phase==='general'));matched=candidates.sort((a,b)=>b.confidence-a.confidence)[0]||null}
  let state='learning',strength='none',summary='Coach does not yet have enough current-context evidence to adjust confidence.';
  if(matched?.state==='stale'){state='stale';summary='This context pattern is too old to guide Coach.'}
  else if(matched?.state==='contradictory'){state='conflict';strength='strong';summary='Recent outcomes conflict with older outcomes under similar conditions, so Coach should reduce confidence and avoid overreacting.'}
  else if(matched?.state==='usable'&&matched.responseScore>=.7){state='supported';strength=matched.confidence>=.7?'moderate':'light';summary=`This athlete has responded well to similar recommendations under ${matched.context.recovery} recovery conditions.`}
  else if(matched?.state==='usable'&&matched.responseScore<=.45){state='caution';strength='strong';summary=`This athlete has responded poorly to similar recommendations under ${matched.context.recovery} recovery conditions.`}
  else if(matched?.state==='usable'){state='mixed';strength='light';summary='This context is repeatable but outcomes are not directional enough for Coach to lean on.'}
  else if(matched){state=matched.state||'learning';summary=matched.explanation||summary}
  return {version:VERSION,exerciseId:String(exerciseId),currentContext:ctx,state,strength,summary,matched,profile,mayInformProgramming:Boolean(matched?.mayInformProgramming),mayOverrideAdaptive:false,advisoryOnly:true};
 }
 function proposalEvidence(proposal){
  const ids=[...new Set((proposal?.changes||[]).map(x=>x?.exerciseId).filter(Boolean).map(String))],items=ids.map(exerciseEvidence);
  const caution=items.filter(x=>['caution','conflict'].includes(x.state)),supported=items.filter(x=>x.state==='supported'),stale=items.filter(x=>x.state==='stale');
  let state='learning',summary='Context-specific evidence is still building.';
  if(caution.length){state='caution';summary=`${caution.length} affected exercise${caution.length===1?' has':'s have'} current-context evidence that argues for a conservative interpretation.`}
  else if(supported.length>=Math.max(1,Math.ceil(ids.length*.6))){state='supported';summary='Most affected exercises have fresh context-specific evidence supporting the recommendation direction.'}
  else if(stale.length===items.length&&items.length){state='stale';summary='Context-specific evidence for the affected exercises is stale.'}
  else if(items.some(x=>x.state==='mixed')){state='mixed';summary='Context-specific responses are mixed, so Coach should avoid increasing recommendation strength.'}
  return {version:VERSION,state,summary,items,supported:supported.length,caution:caution.length,stale:stale.length,total:items.length,requiresApproval:true,mayOverrideAdaptive:false,authority:'adaptive_programming'};
 }
 function enrich(review){if(!review)return review;const contextEvidence=proposalEvidence(review.proposal||review.outcomePolicyDecision?.blockedProposal||null),decision=review.coachDecision?{...review.coachDecision}:null;if(decision){decision.contextState=contextEvidence.state;decision.contextReason=contextEvidence.summary;decision.mayOverrideAdaptive=false;if(contextEvidence.state==='caution'&&decision.state!=='blocked')decision.state='caution'}const proposal=review.proposal?{...review.proposal,coachContextEvidence:contextEvidence,requiresApproval:true,authority:'adaptive_programming',preserveProgramSource:true}:null;return {...review,proposal,coachContextEvidence:contextEvidence,coachDecision:decision}}
 function legacyInstall(name,marker,factory,attempt=0,ready=null){const base=window[name],isReady=typeof ready==='function'?safe(()=>Boolean(ready()),false):true;if(typeof base!=='function'||!isReady){if(attempt<80&&typeof setTimeout==='function')setTimeout(()=>legacyInstall(name,marker,factory,attempt+1,ready),100);return false}if(base[marker])return true;const wrapped=factory(base);wrapped[marker]=true;wrapped[`${marker}Base`]=base;window[name]=wrapped;return true}
 function installCapture(){const wrap=core?.installWrapper?((name,marker,factory,options={})=>core.installWrapper(name,marker,factory,options)):((name,marker,factory)=>legacyInstall(name,marker,factory));return wrap('prismRememberIntervention','__myliftcoachContextV81',base=>function(data){const result=base.apply(this,arguments);if(result?.id&&!result.athleteContext){const all=rows(),row=all.find(x=>x.id===result.id);if(row){row.athleteContext=currentContext();save(all);result.athleteContext=row.athleteContext}}return result},{maxAttempts:80,delayMs:100});}
 function installReview(){const ready=()=>typeof window.myliftcoachAthleteExerciseContexts==='function',wrap=core?.installWrapper?((name,marker,factory,options={})=>core.installWrapper(name,marker,factory,options)):((name,marker,factory)=>legacyInstall(name,marker,factory,0,ready));return wrap('prismCoachProgramReview','__myliftcoachCoachContextV81',base=>function(){return enrich(base.apply(this,arguments))},{maxAttempts:80,delayMs:100,ready});}
 function audit(){return {version:VERSION,currentContext:currentContext(),eventCount:interventionEvents().length,guardrails:{capturesContextProspectively:true,usesCurrentRecoveryContext:true,phaseSpecificWhenAvailable:true,staleContextCannotStrengthen:true,conflictReducesTrust:true,noAutomaticAcceptance:true,noProgramMutation:true,preserveProgramSource:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}}}
 window.myliftcoachCoachCurrentContext=currentContext;
 window.myliftcoachCoachContextEvents=interventionEvents;
 window.myliftcoachCoachExerciseContextEvidence=exerciseEvidence;
 window.myliftcoachCoachProposalContextEvidence=proposalEvidence;
 window.myliftcoachCoachContextEnrich=enrich;
 window.myliftcoachCoachContextAudit=audit;
 window.MYLIFTCOACH_COACH_CONTEXT_VERSION=VERSION;
 installCapture();installReview();
})();
