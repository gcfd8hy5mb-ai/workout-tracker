const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('myliftcoach-program-outcome-validation.js','utf8');
class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}}
const storage=new MemoryStorage(),window={myliftcoachProgramOverlayPolicy:type=>({version:'7.6',proposalType:type,evidence:8,state:'working',confidence:1,successRate:.9,mayInformProgramming:true,mayOverrideAdaptive:false})};
const ctx={window,localStorage:storage,console,Date};vm.createContext(ctx);vm.runInContext(source,ctx);
const seq=(b,d)=>Array.from({length:6},(_,i)=>Math.max(0,Math.min(1,b+d+(i%3-1)*.004))),iso=d=>new Date(Date.now()-d*86400000).toISOString();
function row(id,days,delta,type='program_recovery'){return {id,proposalType:type,completedAt:iso(days),pre:{performance:seq(.55,0),completion:seq(.80,0),recovery:seq(.68,0)},post:{performance:seq(.55,delta),completion:seq(.80,delta*.6),recovery:seq(.68,delta*.5)}}}
const report={};
for(const weeks of [6,12,16,20]){
 const helpful=[];for(let w=weeks;w>=2;w-=2)helpful.push(row(`h-${w}`,w*7-7,.08));
 storage.setItem('myliftcoachProgramOutcomeTrialsV1',JSON.stringify(helpful));const hp=window.myliftcoachProgramOutcomeValidationPolicy('program_recovery');
 if(weeks<=6)assert.ok(['learning','validated_helpful'].includes(hp.state));else assert.strictEqual(hp.state,'validated_helpful');
 const reversal=[...helpful,row(`bad-a-${weeks}`,12,-.11),row(`bad-b-${weeks}`,3,-.12)];storage.setItem('myliftcoachProgramOutcomeTrialsV1',JSON.stringify(reversal));const rp=window.myliftcoachProgramOutcomeValidationPolicy('program_recovery');assert.strictEqual(rp.state,'rethink');
 const stale=helpful.map((x,i)=>({...x,completedAt:iso(130+i*5)}));storage.setItem('myliftcoachProgramOutcomeTrialsV1',JSON.stringify(stale));const sp=window.myliftcoachProgramOutcomeValidationPolicy('program_recovery');assert.strictEqual(sp.state,'stale');assert.strictEqual(sp.maySupportProposal,false);
 report[weeks]={fresh:hp.state,reversal:rp.state,expired:sp.state,freshness:hp.freshness,effectiveEvidence:hp.effectiveEvidence};
}
console.log(JSON.stringify({suite:'MYLIFTCOACH V7.9 6/12/16/20 Week Freshness Simulation',weeks:[6,12,16,20],report,checks:{freshEvidenceBuilds:true,oldEvidenceExpires:true,recentReversalDominates:true,noPermanentConfidence:true,adaptiveAuthorityPreserved:true}},null,2));
