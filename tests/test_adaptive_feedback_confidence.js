const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('adaptive-feedback-loop.js','utf8');
function session(date,volumeWeight,reps=10){return {date,exercises:[{id:'press',name:'Machine Chest Press',sets:[{weight:volumeWeight,reps},{weight:volumeWeight,reps},{weight:volumeWeight,reps}]}]};}
function context(history){const window={workoutHistory:history};const ctx={window,workoutHistory:history,console,Date};vm.createContext(ctx);vm.runInContext(source,ctx);return window;}

// One unusual workout is evidence, not authority.
let history=[session('2026-09-29',70),session('2026-09-22',100)];
let w=context(history),trend=w.liftovaFeedbackTrend('press',Date.parse('2026-09-29T12:00:00Z'));
assert.strictEqual(trend.trend,'declining');
assert.strictEqual(trend.confidence.actionable,false,'two exposures must not automatically change a prescription');
let p=w.liftovaFeedbackAdjust({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100});
assert.strictEqual(p.status,'increase','low-confidence decline must not veto progression');

// Repeated fresh evidence may conservatively hold a future increase.
history=[session('2026-09-29',70),session('2026-09-22',100),session('2026-09-15',100),session('2026-09-08',100)];
w=context(history);trend=w.liftovaFeedbackTrend('press',Date.parse('2026-09-29T12:00:00Z'));
assert.strictEqual(trend.confidence.actionable,true);
p=w.liftovaFeedbackAdjust({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100});
assert.strictEqual(p.status,'feedback_hold');
assert.strictEqual(p.targetWeight,100);
assert.strictEqual(trend.confidence.freshness.stale,false);

// Old evidence remains visible to Coach but cannot override Adaptive Programming.
const stale=[session('2026-07-01',70),session('2026-06-24',100),session('2026-06-17',100),session('2026-06-10',100)];
w=context(stale);trend=w.liftovaFeedbackTrend('press',Date.parse('2026-09-29T12:00:00Z'));
assert.strictEqual(trend.trend,'declining');
assert.strictEqual(trend.confidence.freshness.stale,true);
assert.strictEqual(trend.confidence.actionable,false,'stale history must not override a current prescription');
assert.match(trend.reason,/too old to override/);

// Completed history remains untouched and the decision is reversible on fresh evidence.
const before=JSON.stringify(history);w=context(history);w.liftovaFeedbackAdjust({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100});
assert.strictEqual(JSON.stringify(history),before,'feedback must never mutate completed workout history');
const recovered=[session('2026-10-06',105),session('2026-09-29',100),session('2026-09-22',100),session('2026-09-15',100),session('2026-09-08',100)];
w=context(recovered);p=w.liftovaFeedbackAdjust({exerciseId:'press',status:'increase',targetWeight:105,lastWeight:100});
assert.strictEqual(p.status,'increase','a prior feedback hold must not become a permanent lock');

console.log(JSON.stringify({suite:'LIFTOVA Adaptive Feedback Confidence',checks:{singleOutlierDoesNotOverride:true,repeatedFreshEvidenceCanHold:true,staleEvidenceCannotOverride:true,historyReadOnly:true,reversible:true}},null,2));
