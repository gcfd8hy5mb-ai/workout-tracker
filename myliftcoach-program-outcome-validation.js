/* MYLIFTCOACH Program Outcome Validation V7.8 — require measured improvement before outcome history can support repeating a program-level proposal.
   Advisory only: never auto-accepts, auto-activates, mutates the saved program, or overrides Adaptive Programming. */
(()=>{
 const VERSION='7.8';
 const TRIAL_KEY='myliftcoachProgramOutcomeTrialsV1';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,Number(n)||0));
 const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
 const numeric=a=>(Array.isArray(a)?a:[]).map(Number).filter(Number.isFinite).map(v=>clamp(v));
 function rows(){const v=safe(()=>JSON.parse(localStorage.getItem(TRIAL_KEY)||'[]'),[]);return Array.isArray(v)?v:[]}
 function metricDelta(pre,post){const a=numeric(pre),b=numeric(post);if(a.length<3||b.length<3)return null;return {pre:Number(avg(a).toFixed(4)),post:Number(avg(b).toFixed(4)),delta:Number((avg(b)-avg(a)).toFixed(4)),preN:a.length,postN:b.length}}
 function evaluateTrial(trial){
  const metrics={performance:metricDelta(trial?.pre?.performance,trial?.post?.performance),completion:metricDelta(trial?.pre?.completion,trial?.post?.completion),recovery:metricDelta(trial?.pre?.recovery,trial?.post?.recovery)};
  const valid=Object.entries(metrics).filter(([,v])=>v);
  if(valid.length<2)return {version:VERSION,trialId:trial?.id||null,proposalType:trial?.proposalType||null,state:'insufficient',validated:false,metricCoverage:valid.length,evidence:0,improvement:null,confidence:0,metrics,reason:'At least two measured metrics with three pre- and post-change observations are required.'};
  const weights={performance:.5,completion:.3,recovery:.2};let weight=0,total=0,minN=Infinity;
  for(const [name,m] of valid){weight+=weights[name];total+=m.delta*weights[name];minN=Math.min(minN,m.preN,m.postN)}
  const improvement=total/weight,confidence=clamp((Math.min(minN,6)/6)*(valid.length/3));
  const recoveryDrop=metrics.recovery?.delta??0,completionDrop=metrics.completion?.delta??0;
  let state='neutral';if(improvement>=.05&&recoveryDrop>-.15&&completionDrop>-.15)state='helped';else if(improvement<=-.05||recoveryDrop<=-.2||completionDrop<=-.2)state='hurt';
  return {version:VERSION,trialId:trial?.id||null,proposalType:trial?.proposalType||null,state,validated:true,metricCoverage:valid.length,evidence:minN,improvement:Number(improvement.toFixed(4)),confidence:Number(confidence.toFixed(3)),metrics,reason:state==='helped'?'Measured post-change outcomes improved relative to the athlete baseline.':state==='hurt'?'Measured post-change outcomes worsened or recovery/adherence dropped materially.':'Measured outcomes did not show a clear beneficial or harmful change.'};
 }
 function validatedHistory(proposalType){return rows().filter(x=>!proposalType||x?.proposalType===proposalType).map(evaluateTrial).filter(x=>x.validated)}
 function policy(proposalType='program_recovery'){
  const h=validatedHistory(proposalType).slice(-12),n=h.length;
  if(!n)return {version:VERSION,proposalType,validatedTrials:0,state:'learning',meanImprovement:null,confidence:0,mayInformProgramming:false,maySupportProposal:false,mayBlockProposal:false,mayOverrideAdaptive:false,reason:'No validated pre/post program-change trials are available yet.'};
  const helped=h.filter(x=>x.state==='helped').length,hurt=h.filter(x=>x.state==='hurt').length,neutral=n-helped-hurt;
  const mean=avg(h.map(x=>x.improvement)),confidence=avg(h.map(x=>x.confidence));let state='mixed';
  if(n<3)state='learning';else if(hurt>=Math.max(2,Math.ceil(n/2))||mean<=-.04)state='rethink';else if(helped>=3&&hurt===0&&mean>=.04&&confidence>=.5)state='validated_helpful';
  return {version:VERSION,proposalType,validatedTrials:n,state,meanImprovement:Number(mean.toFixed(4)),confidence:Number(confidence.toFixed(3)),helped,neutral,hurt,mayInformProgramming:n>=3&&confidence>=.5,maySupportProposal:state==='validated_helpful',mayBlockProposal:state==='rethink',mayOverrideAdaptive:false,reason:state==='validated_helpful'?'Repeated measured trials improved outcomes versus baseline and may support reconsidering this proposal type.':state==='rethink'?'Measured trials show this proposal type is not improving outcomes and should lose trust.':state==='learning'?'More validated trials are required before outcome history can influence program proposals.':'Measured outcomes remain mixed; continue observing without increasing authority.'};
 }
 function audit(){return {version:VERSION,policies:{program_recovery:policy('program_recovery'),exercise_adjustment:policy('exercise_adjustment')},guardrails:{baselineRequired:true,minimumPreObservations:3,minimumPostObservations:3,multipleMetricsRequired:true,noAutomaticAcceptance:true,noAutomaticActivation:true,noProgramMutation:true,noPresetFallback:true,preserveProgramSource:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}}}
 function install(){const base=window.myliftcoachProgramOverlayPolicy;if(typeof base==='function'&&!base.__myliftcoachV78){const wrapped=function(type){const legacy=base(type),validated=policy(type);return {...legacy,outcomeValidation:validated,validatedSupport:Boolean(validated.maySupportProposal),validatedBlock:Boolean(validated.mayBlockProposal),mayOverrideAdaptive:false}};wrapped.__myliftcoachV78=true;wrapped.__myliftcoachV78Base=base;window.myliftcoachProgramOverlayPolicy=wrapped}}
 function loadPolicy(){if(typeof document==='undefined'||!document.body||document.querySelector?.('script[data-myliftcoach-overlay-policy]'))return;const s=document.createElement('script');s.src='coach-program-overlay-policy.js?v=7.7';s.async=false;s.dataset.myliftcoachOverlayPolicy='1';document.body.appendChild(s)}
 window.myliftcoachProgramOutcomeEvaluateTrial=evaluateTrial;
 window.myliftcoachProgramValidatedOutcomeHistory=validatedHistory;
 window.myliftcoachProgramOutcomeValidationPolicy=policy;
 window.myliftcoachProgramOutcomeValidationAudit=audit;
 window.MYLIFTCOACH_PROGRAM_OUTCOME_VALIDATION_VERSION=VERSION;
 install();loadPolicy();
})();
