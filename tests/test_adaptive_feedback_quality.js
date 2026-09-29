const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync('adaptive-feedback-loop.js','utf8');
function ex(weight,reps=10){return {id:'press',sets:[{weight,reps},{weight,reps},{weight,reps}]};}
function session(date,exercise){return {date,exercises:[exercise]};}
function context(history){const window={workoutHistory:history};const ctx={window,workoutHistory:history,console,Date};vm.createContext(ctx);vm.runInContext(source,ctx);return window;}

const history=[
 session('2026-10-20',ex(70)),
 session('2026-10-13',{id:'press',sets:[{weight:100,reps:0},{weight:100,reps:0}]}),
 session('2026-10-06',ex(100)),
 session('2026-09-29',ex(100)),
 session('2026-09-22',ex(100))
];
const before=JSON.stringify(history),w=context(history),rows=w.liftovaFeedbackExercise('press'),trend=w.liftovaFeedbackTrend('press');
assert.strictEqual(rows.length,4,'zero-rep/incomplete exposures must not count as evidence');
assert.strictEqual(trend.evidence,4);
assert.strictEqual(trend.trend,'declining');
assert.ok(trend.confidence.consistency>=0&&trend.confidence.consistency<=1);
assert.strictEqual(JSON.stringify(history),before,'quality filtering must not mutate history');

const noisy=[session('2026-10-20',ex(50)),session('2026-10-13',ex(140)),session('2026-10-06',ex(60)),session('2026-09-29',ex(130))];
const stable=[session('2026-10-20',ex(95)),session('2026-10-13',ex(100)),session('2026-10-06',ex(100)),session('2026-09-29',ex(100))];
const noisyConfidence=context(noisy).liftovaFeedbackTrend('press').confidence;
const stableConfidence=context(stable).liftovaFeedbackTrend('press').confidence;
assert.ok(stableConfidence.consistency>noisyConfidence.consistency,'stable evidence should have higher consistency');

console.log(JSON.stringify({suite:'LIFTOVA Adaptive Feedback Quality',checks:{invalidExposureFiltered:true,consistencyScored:true,historyReadOnly:true}},null,2));
