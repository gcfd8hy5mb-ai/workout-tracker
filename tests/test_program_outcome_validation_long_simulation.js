const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('myliftcoach-program-outcome-validation.js','utf8');
class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}}
const storage=new MemoryStorage(),window={myliftcoachProgramOverlayPolicy:type=>({version:'7.6',proposalType:type,evidence:8,state:'working',confidence:1,successRate:.9,mayInformProgramming:true,mayOverrideAdaptive:false})};
const ctx={window,localStorage:storage,console};vm.createContext(ctx);vm.runInContext(source,ctx);
const seq=(base,delta,n=6)=>Array.from({length:n},(_,i)=>Math.max(0,Math.min(1,base+delta+(i%3-1)*.005)));
function trial(id,type,mode){const helpful=mode==='helpful',harmful=mode==='harmful';const d=helpful ? .08 : harmful ? -.09 : (Number(id.replace(/\D/g,''))%2 ? .025 : -.02);const rd=helpful ? .04 : harmful ? -.22 : 0;return {id,proposalType:type,pre:{performance:seq(.55,0),completion:seq(.80,0),recovery:seq(.68,0)},post:{performance:seq(.55,d),completion:seq(.80,d*.6),recovery:seq(.68,rd)}}}
function runWeeks(weeks,mode,type){const trials=[];for(let w=2;w<=weeks;w+=2)trials.push(trial(`${mode}-${w}`,type,mode));storage.setItem('myliftcoachProgramOutcomeTrialsV1',JSON.stringify(trials));return window.myliftcoachProgramOutcomeValidationPolicy(type)}
const report={};
for(const weeks of [6,12,16,20]){
 const good=runWeeks(weeks,'helpful','program_recovery');
 assert.strictEqual(good.state,'validated_helpful',`${weeks}w repeated helpful trials should validate support`);
 assert.strictEqual(good.maySupportProposal,true);assert.strictEqual(good.mayOverrideAdaptive,false);
 const bad=runWeeks(weeks,'harmful','exercise_adjustment');
 assert.strictEqual(bad.state,'rethink',`${weeks}w harmful trials should reduce trust`);assert.strictEqual(bad.mayBlockProposal,true);assert.strictEqual(bad.mayOverrideAdaptive,false);
 const mixed=runWeeks(weeks,'mixed','program_recovery');
 assert.notStrictEqual(mixed.state,'validated_helpful',`${weeks}w noisy/mixed trials must not be promoted to helpful`);assert.strictEqual(mixed.maySupportProposal,false);assert.strictEqual(mixed.mayOverrideAdaptive,false);
 report[weeks]={helpful:good.state,harmful:bad.state,mixed:mixed.state,helpfulImprovement:good.meanImprovement,harmfulImprovement:bad.meanImprovement};
}
const thin=Array.from({length:10},(_,i)=>({id:`thin-${i}`,proposalType:'program_recovery',pre:{performance:seq(.5,0)},post:{performance:seq(.5,.15)}}));storage.setItem('myliftcoachProgramOutcomeTrialsV1',JSON.stringify(thin));const thinPolicy=window.myliftcoachProgramOutcomeValidationPolicy('program_recovery');assert.strictEqual(thinPolicy.validatedTrials,0);assert.strictEqual(thinPolicy.maySupportProposal,false);
console.log(JSON.stringify({suite:'MYLIFTCOACH V7.8 Long Program Outcome Simulation',weeks:[6,12,16,20],report,checks:{helpfulConverges:true,harmfulRejected:true,mixedNotPromoted:true,singleMetricNeverEnough:true,adaptiveAuthorityPreserved:true}},null,2));
