const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('adaptive-feedback-loop.js','utf8');
function session(date,volumeWeight,reps=10){return {date,exercises:[{id:'press',name:'Machine Chest Press',sets:[{weight:volumeWeight,reps},{weight:volumeWeight,reps},{weight:volumeWeight,reps}]}]};}
function context(history){const window={workoutHistory:history};const ctx={window,workoutHistory:history,console,Date};vm.createContext(ctx);vm.runInContext(source,ctx);return window;}
const now=Date.parse('2026-09-29T12:00:00Z');

let history=[session('2026-09-29',70),session('2026-09-22',100)];
let w=context(history),trend=w.liftovaFeedbackTrend('press',now);
assert.strictEqual(trend.trend,'declining');
assert.strictEqual(trend.confidence.actionable,false,'two exposures must not automatically change a prescription');
let p=w.liftovaFeedbackAdjust({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100});
assert.strictEqual(p.status,'increase');

// A repeated directional decline may conservatively hold a future increase.
history=[session('2026-09-29',70),session('2026-09-22',80),session('2026-09-15',90),session('2026-09-08',100),session('2026-09-01',100)];
w=context(history);trend=w.liftovaFeedbackTrend('press',now);
assert.ok(trend.confidence.agreement.support>=2);
assert.strictEqual(trend.confidence.actionable,true);
p=w.liftovaFeedbackAdjust({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100});
assert.strictEqual(p.status,'feedback_hold');
assert.strictEqual(p.targetWeight,100);

// Conflicting recent exposures stay advisory even if the latest session alone looks poor.
const mixed=[session('2026-09-29',70),session('2026-09-22',110),session('2026-09-15',80),session('2026-09-08',105),session('2026-09-01',100)];
w=context(mixed);trend=w.liftovaFeedbackTrend('press',now);
assert.strictEqual(trend.trend,'declining');
assert.ok(trend.confidence.agreement.score<.5,'mixed directions should have weak agreement');
assert.strictEqual(trend.confidence.actionable,false,'conflicting evidence must not override Adaptive Programming');
p=w.liftovaFeedbackAdjust({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100});
assert.strictEqual(p.status,'increase');
assert.match(trend.reason,/disagree/);

const stale=[session('2026-07-01',70),session('2026-06-24',80),session('2026-06-17',90),session('2026-06-10',100)];
w=context(stale);trend=w.liftovaFeedbackTrend('press',now);
assert.strictEqual(trend.confidence.freshness.stale,true);
assert.strictEqual(trend.confidence.actionable,false);

const before=JSON.stringify(history);w=context(history);w.liftovaFeedbackAdjust({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100});
assert.strictEqual(JSON.stringify(history),before,'feedback must never mutate completed workout history');

console.log(JSON.stringify({suite:'LIFTOVA Adaptive Feedback Confidence',checks:{smallSampleAdvisory:true,repeatedAgreementCanHold:true,conflictingEvidenceAdvisory:true,staleEvidenceCannotOverride:true,historyReadOnly:true}},null,2));
