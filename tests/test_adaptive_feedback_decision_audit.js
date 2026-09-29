const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync('adaptive-feedback-loop.js','utf8');
function session(date,w){return {date,exercises:[{id:'press',sets:[{weight:w,reps:10},{weight:w,reps:10},{weight:w,reps:10}]}]};}
function context(history){const window={workoutHistory:history};const ctx={window,workoutHistory:history,Date,console};vm.createContext(ctx);vm.runInContext(source,ctx);return window;}
const now=Date.parse('2026-09-29T12:00:00Z');
let history=[session('2026-09-29',70),session('2026-09-22',80),session('2026-09-15',90),session('2026-09-08',100),session('2026-09-01',100)];
let w=context(history),before=JSON.stringify(history);
let audit=w.liftovaFeedbackDecisionAudit({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100},now);
assert.strictEqual(audit.authority,'adaptive_programming');
assert.strictEqual(audit.consumer,'coach');
assert.strictEqual(audit.input.status,'increase');
assert.strictEqual(audit.output.status,'feedback_hold');
assert.strictEqual(audit.changed,true);
assert.ok(audit.gates.fresh&&audit.gates.agreement&&audit.gates.confidence);
assert.strictEqual(JSON.stringify(history),before,'audit must not mutate completed history');
history=[session('2026-09-29',70),session('2026-09-22',110),session('2026-09-15',80),session('2026-09-08',105),session('2026-09-01',100)];
w=context(history);audit=w.liftovaFeedbackDecisionAudit({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100},now);
assert.strictEqual(audit.changed,false);
assert.strictEqual(audit.output.status,'increase');
assert.strictEqual(audit.gates.agreement,false);
assert.match(audit.disposition,/advisory/);
console.log(JSON.stringify({suite:'LIFTOVA Coach Decision Audit',checks:{authorityBoundary:true,inputOutputTrace:true,gatesVisible:true,conflictAdvisory:true,historyReadOnly:true}},null,2));
