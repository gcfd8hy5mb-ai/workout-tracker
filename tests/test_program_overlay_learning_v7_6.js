const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('coach-program-overlay-learning.js','utf8');
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
const window={},ctx={window,localStorage,console,Date,Math,JSON};vm.createContext(ctx);vm.runInContext(source,ctx);
const now=Date.now();
localStorage.setItem('myliftcoachProgramOverlaysV1',JSON.stringify([
 {id:'o1',proposalId:'p1',proposalType:'program_recovery',status:'completed',completedAt:new Date(now-86400000).toISOString(),changes:[{exerciseId:'press'}]},
 {id:'o2',proposalId:'p2',proposalType:'program_recovery',status:'completed',completedAt:new Date(now-2*86400000).toISOString(),changes:[{exerciseId:'press'}]},
 {id:'o3',proposalId:'p3',proposalType:'program_recovery',status:'completed',completedAt:new Date(now-3*86400000).toISOString(),changes:[{exerciseId:'row'}]}
]));
localStorage.setItem('prismCoachInterventionsV1',JSON.stringify([
 {exerciseId:'press',outcome:{value:'better',at:new Date(now-12*3600000).toISOString()}},
 {exerciseId:'press',outcome:{value:'better',at:new Date(now-30*3600000).toISOString()}},
 {exerciseId:'row',outcome:{value:'same',at:new Date(now-2.5*86400000).toISOString()}}
]));
const history=window.myliftcoachProgramOverlayOutcomeHistory();assert.strictEqual(history.length,3);assert.ok(history.some(x=>x.result==='helped'));
const p=window.myliftcoachProgramOverlayPolicy('program_recovery');assert.strictEqual(p.version,'7.6');assert.ok(p.evidence>=2);assert.strictEqual(p.mayOverrideAdaptive,false);assert.strictEqual(p.mayInformProgramming,true);
const beforeOverlays=localStorage.getItem('myliftcoachProgramOverlaysV1'),beforeInterventions=localStorage.getItem('prismCoachInterventionsV1');
const audit=window.myliftcoachProgramOverlayLearningAudit();assert.strictEqual(audit.guardrails.historyReadOnly,true);assert.strictEqual(audit.guardrails.noProgramMutation,true);assert.strictEqual(audit.guardrails.noAutomaticActivation,true);assert.strictEqual(audit.guardrails.mayOverrideAdaptive,false);assert.strictEqual(audit.guardrails.preserveProgramSource,true);
assert.strictEqual(localStorage.getItem('myliftcoachProgramOverlaysV1'),beforeOverlays);assert.strictEqual(localStorage.getItem('prismCoachInterventionsV1'),beforeInterventions);
console.log(JSON.stringify({suite:'MYLIFTCOACH Program Overlay Learning V7.6',checks:{outcomeClassification:true,policyLearning:true,readOnly:true,noAutoActivation:true,adaptiveAuthority:true,preserveProgramSource:true}},null,2));
