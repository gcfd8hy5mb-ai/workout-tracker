/* MYLIFTCOACH Program Outcome Validation V7.9 — measured outcome validation with evidence freshness and confidence decay.
   Advisory only: never auto-accepts, auto-activates, mutates the saved program, or overrides Adaptive Programming. */
(()=>{
 const VERSION='7.9';
 const TRIAL_KEY='myliftcoachProgramOutcomeTrialsV1';
 const HALF_LIFE_DAYS=42;
 const RECENT_DAYS=45;
 const STALE_DAYS=120;
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,Number(n)||0));
 const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
 const numeric=a=>(Array.isArray(a)?a:[]).map(Number).filter(Number.isFinite).map(v=>clamp(v));
 function rows(){const v=safe(()=>JSON.parse(localStorage.getItem(TRIAL_KEY)||'[]'),[]);return Array.isArray(v)?v:[]}
 function metricDelta(pre,post){const a=numeric(pre),b=numeric(post);if(a.length<3||b.length<3)return null;return {pre:Number(avg(a).toFixed(4)),post:Number(avg(b).toFixed(4)),delta:Number((avg(b)-avg(a)).toFixed(4)),preN:a.length,postN:b.length}}
 function trialTime(trial){const raw=trial?.completedAt||trial?.endedAt||trial?.at||trial?.createdAt||null,t=Date.parse(raw||'');return Number.isFinite(t)?t:Date.now()}
 function freshness(ageDays){return Number(Math.pow(.5,Math.max(0,ageDays)/HALF_LIFE_DAYS).toFixed(4))}
 function evaluateTrial(trial){
  const metrics={performance:metricDelta(trial?.pre?.performance,trial?.post?.performance),completion:metricDelta(trial?.pre?.completion,trial?.post?.completion),recovery:metricDelta(trial?.pre?.recovery,trial?.post?.recovery)};
  const valid=Object.entries(metrics).filter(([,v])=>v),at=trialTime(trial),ageDays=Math.max(0,(Date.now()-at)/86400000),freshnessWeight=freshness(ageDays);
  if(valid.length<2)return {version:VERSION,trialId:trial?.id||null,proposalType:trial?.proposalType||null,state:'insufficient',validated:false,metricCoverage:valid.length,evidence:0,improvement:null,confidence:0,at:new Date(at).toISOString(),ageDays:Number(ageDays.toFixed(1)),freshnessWeight,metrics,reason:'At least two measured metrics with three pre- and post-change observations are required.'};
  const weights={performance:.5,completion:.3,recovery:.2};let weight=0,total=0,minN=Infinity;
  for(const [name,m] of valid){weight+=weights[name];total+=m.delta*weights[name];minN=Math.min(minN,m.preN,m.postN)}
  const improvement=total/weight,baseConfidence=clamp((Math.min(minN,6)/6)*(valid.length/3)),confidence=baseConfidence*freshnessWeight;
  const recoveryDrop=metrics.recovery?.delta??0,completionDrop=metrics.completion?.delta??0;
  let state='neutral';if(improvement>=.05&&recoveryDrop>-.15&&completionDrop>-.15)state='helped';else if(improvement<=-.05||recoveryDrop<=-.2||completionDrop<=-.2)state='hurt';
  return {version:VERSION,trialId:trial?.id||null,proposalType:trial?.proposalType||null,state,validated:true,metricCoverage:valid.length,evidence:minN,improvement:Number(improvement.toFixed(4)),baseConfidence:Number(baseConfidence.toFixed(3)),confidence:Number(confidence.toFixed(3)),at:new Date(at).toISOString(),ageDays:Number(ageDays.toFixed(1)),freshnessWeight,stale:ageDays>STALE_DAYS,recent:ageDays<=RECENT_DAYS,metrics,reason:state==='helped'?'Measured post-change outcomes improved relative to the athlete baseline.':state==='hurt'?'Measured post-change outcomes worsened or recovery/adherence dropped materially.':'Measured outcomes did not show a clear beneficial or harmful change.'};
 }
 function validatedHistory(proposalType){return rows().filter(x=>!proposalType||x?.proposalType===proposalType).map(evaluateTrial).filter(x=>x.validated).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))}
 function weightedMean(h,key){const usable=h.filter(x=>Number.isFinite(Number(x[key]))),w=usable.reduce((s,x)=>s+x.freshnessWeight,0);return w?usable.reduce((s,x)=>s+Number(x[key])*x.freshnessWeight,0)/w:null}
 function policy(proposalType='program_recovery'){
  const h=validatedHistory(proposalType).slice(-16),n=h.length;
  if(!n)return {version:VERSION,proposalType,validatedTrials:0,recentTrials:0,effectiveEvidence:0,state:'learning',meanImprovement:null,confidence:0,freshness:0,mayInformProgramming:false,maySupportProposal:false,mayBlockProposal:false,mayOverrideAdaptive:false,reason:'No validated pre/post program-change trials are available yet.'};
  const recent=h.filter(x=>x.recent),nonstale=h.filter(x=>!x.stale),helped=nonstale.filter(x=>x.state==='helped'),hurt=nonstale.filter(x=>x.state==='hurt'),neutral=nonstale.length-helped.length-hurt.length;
  const effectiveEvidence=h.reduce((s,x)=>s+x.freshnessWeight,0),mean=weightedMean(h,'improvement'),confidence=weightedMean(h,'baseConfidence'),freshness=avg(h.map(x=>x.freshnessWeight))||0;
  const recentHelped=recent.filter(x=>x.state==='helped').length,recentHurt=recent.filter(x=>x.state==='hurt').length;
  let state='mixed';
  if(!recent.length||freshness<.18)state='stale';
  else if(n<3||effectiveEvidence<2)state='learning';
  else if(recentHurt>=2||(mean!=null&&mean<=-.04))state='rethink';
  else if(recentHelped>=2&&helped.length>=3&&recentHurt===0&&mean>=.04&&confidence>=.5&&freshness>=.45)state='validated_helpful';
  const mayInformProgramming=['validated_helpful','rethink','mixed'].includes(state)&&effectiveEvidence>=2&&freshness>=.3;
  return {version:VERSION,proposalType,validatedTrials:n,recentTrials:recent.length,effectiveEvidence:Number(effectiveEvidence.toFixed(3)),state,meanImprovement:mean==null?null:Number(mean.toFixed(4)),confidence:confidence==null?0:Number((confidence*freshness).toFixed(3)),freshness:Number(freshness.toFixed(3)),helped:helped.length,neutral,hurt:hurt.length,recentHelped,recentHurt,mayInformProgramming,maySupportProposal:state==='validated_helpful',mayBlockProposal:state==='rethink',mayOverrideAdaptive:false,reason:state==='validated_helpful'?'Recent measured trials repeatedly improved outcomes versus baseline and may support reconsidering this proposal type.':state==='rethink'?'Recent or time-weighted measured trials show this proposal type is not improving outcomes and should lose trust.':state==='stale'?'Prior evidence is too old to influence current programming; fresh validation is required.':state==='learning'?'More recent validated trials are required before outcome history can influence program proposals.':'Measured outcomes remain mixed; continue observing without increasing authority.'};
 }
 function audit(){return {version:VERSION,policies:{program_recovery:policy('program_recovery'),exercise_adjustment:policy('exercise_adjustment')},guardrails:{baselineRequired:true,minimumPreObservations:3,minimumPostObservations:3,multipleMetricsRequired:true,evidenceHalfLifeDays:HALF_LIFE_DAYS,recentEvidenceDays:RECENT_DAYS,staleEvidenceDays:STALE_DAYS,recentEvidenceRequired:true,oldEvidenceDecays:true,contradictoryRecentEvidenceWins:true,noAutomaticAcceptance:true,noAutomaticActivation:true,noProgramMutation:true,noPresetFallback:true,preserveProgramSource:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}}}
 function install(){const base=window.myliftcoachProgramOverlayPolicy;if(typeof base==='function'&&!base.__myliftcoachV79){const wrapped=function(type){const legacy=base(type),validated=policy(type);return {...legacy,outcomeValidation:validated,validatedSupport:Boolean(validated.maySupportProposal),validatedBlock:Boolean(validated.mayBlockProposal),mayInformProgramming:Boolean(validated.mayInformProgramming),mayOverrideAdaptive:false}};wrapped.__myliftcoachV79=true;wrapped.__myliftcoachV79Base=base;window.myliftcoachProgramOverlayPolicy=wrapped}}
 function loadPolicy(){if(typeof document==='undefined'||!document.body||document.querySelector?.('script[data-myliftcoach-overlay-policy]'))return;const s=document.createElement('script');s.src='coach-program-overlay-policy.js?v=7.7';s.async=false;s.dataset.myliftcoachOverlayPolicy='1';document.body.appendChild(s)}
 window.myliftcoachProgramOutcomeEvaluateTrial=evaluateTrial;
 window.myliftcoachProgramValidatedOutcomeHistory=validatedHistory;
 window.myliftcoachProgramOutcomeValidationPolicy=policy;
 window.myliftcoachProgramOutcomeValidationAudit=audit;
 window.MYLIFTCOACH_PROGRAM_OUTCOME_VALIDATION_VERSION=VERSION;
 install();loadPolicy();
})();
