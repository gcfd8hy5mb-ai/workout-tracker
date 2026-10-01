const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('myliftcoach-coach-evidence-v8.js','utf8');
let policy=null;
const baseReview={proposal:{type:'program_recovery',title:'Program recovery adjustment',requiresApproval:true,preserveProgramSource:true,authority:'adaptive_programming'},authority:'adaptive_programming',mode:'advisory'};
const window={myliftcoachProgramOutcomeValidationPolicy:()=>policy,prismCoachProgramReview:()=>JSON.parse(JSON.stringify(baseReview))};
const ctx={window,console,setTimeout};vm.createContext(ctx);vm.runInContext(source,ctx);
const report={};
for(const weeks of [6,12,16,20]){
  policy={state:'validated_helpful',confidence:Math.min(.9,.55+weeks/100),freshness:.76,effectiveEvidence:2+weeks/8,recentTrials:Math.max(2,Math.floor(weeks/4)),recentHurt:0,maySupportProposal:true,mayBlockProposal:false};
  let review=window.prismCoachProgramReview();
  assert.ok(review.proposal,`${weeks}w fresh support should remain advisory, not disappear`);
  assert.strictEqual(review.coachEvidence.classification.state,'supported');
  assert.strictEqual(review.proposal.requiresApproval,true);assert.strictEqual(review.coachDecision.mayOverrideAdaptive,false);
  policy={state:'stale',confidence:.08,freshness:0,effectiveEvidence:.45,recentTrials:0,recentHurt:0,maySupportProposal:false,mayBlockProposal:false};
  review=window.prismCoachProgramReview();assert.ok(review.proposal);assert.strictEqual(review.coachEvidence.classification.state,'stale');assert.strictEqual(review.proposal.coachEvidence.strength,'none');
  policy={state:'mixed',confidence:.48,freshness:.63,effectiveEvidence:2.6,recentTrials:3,recentHurt:1,maySupportProposal:false,mayBlockProposal:false};
  review=window.prismCoachProgramReview();assert.ok(review.proposal);assert.strictEqual(review.coachEvidence.classification.conflict,true);assert.strictEqual(review.proposal.coachEvidence.strength,'light');
  policy={state:'rethink',confidence:.81,freshness:.88,effectiveEvidence:3.1,recentTrials:3,recentHurt:2,maySupportProposal:false,mayBlockProposal:true};
  review=window.prismCoachProgramReview();assert.strictEqual(review.proposal,null);assert.strictEqual(review.coachDecision.state,'blocked');assert.strictEqual(review.coachDecision.authority,'adaptive_programming');
  report[weeks]={fresh:'supported',stale:'neutralized',mixed:'conservative',reversal:'blocked'};
}
console.log(JSON.stringify({suite:'MYLIFTCOACH Coach V8 6/12/16/20 Week Evidence Simulation',weeks:[6,12,16,20],report,checks:{freshSupportAdvisory:true,staleSupportExpires:true,mixedEvidenceConservative:true,recentHarmBlocksRepeat:true,approvalAlwaysRequired:true,adaptiveAuthorityPreserved:true}},null,2));
