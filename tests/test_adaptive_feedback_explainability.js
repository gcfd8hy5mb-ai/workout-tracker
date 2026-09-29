const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync('adaptive-feedback-loop.js','utf8');
function session(date,w){return {date,exercises:[{id:'press',sets:[{weight:w,reps:10},{weight:w,reps:10},{weight:w,reps:10}]}]};}
function context(history){const window={workoutHistory:history};const ctx={window,workoutHistory:history,Date,console};vm.createContext(ctx);vm.runInContext(source,ctx);return window;}
const now=Date.parse('2026-09-29T12:00:00Z');
let w=context([session('2026-09-29',70),session('2026-09-22',80),session('2026-09-15',90),session('2026-09-08',100),session('2026-09-01',100)]);
let x=w.liftovaFeedbackExplain('press',now);
assert.strictEqual(x.authority,'adaptive_programming');
assert.strictEqual(x.coachRole,'consumer');
assert.ok(Array.isArray(x.signals)&&x.signals.length>=3);
assert.strictEqual(x.canInfluence,true);
assert.match(x.summary,/Coach may conservatively influence/);
w=context([session('2026-09-29',70),session('2026-09-22',110),session('2026-09-15',80),session('2026-09-08',105),session('2026-09-01',100)]);
x=w.liftovaFeedbackExplain('press',now);
assert.strictEqual(x.canInfluence,false);
assert.match(x.summary,/Adaptive Programming remains unchanged/);
const before=JSON.stringify(w.workoutHistory);w.liftovaFeedbackExplain('press',now);assert.strictEqual(JSON.stringify(w.workoutHistory),before);
console.log(JSON.stringify({suite:'LIFTOVA Feedback Explainability',checks:{authorityExplicit:true,signalsVisible:true,influenceExplicit:true,historyReadOnly:true}},null,2));
