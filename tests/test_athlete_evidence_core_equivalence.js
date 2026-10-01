const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const evidence=fs.readFileSync('myliftcoach-athlete-evidence-core.js','utf8');
const modules=[
 ['athlete-context-learning-v8.js','myliftcoachAthleteContextNormalize','myliftcoachAthleteExerciseContexts'],
 ['athlete-dose-response-v8_2.js','myliftcoachAthleteDoseNormalize','myliftcoachAthleteDoseProfile'],
 ['athlete-recovery-lag-v8_3.js','myliftcoachAthleteRecoveryNormalize','myliftcoachAthleteRecoveryProfile']
];
const now=Date.now();
const iso=d=>new Date(now-d*86400000).toISOString();
const events=[
 {recommendationId:'r1',exerciseId:'press',completedAt:iso(5),outcomeScore:.8,performanceDelta:.08,followedRecommendation:true,recoveryState:'good',phase:'build',sets:3,reps:10,recommendationType:'increase',recoveryHours:72,outcome:{value:'better'}},
 {recommendationId:'r2',exerciseId:'press',completedAt:iso(12),outcomeScore:.7,performanceDelta:.05,followedRecommendation:true,recoveryState:'good',phase:'build',sets:3,reps:9,recommendationType:'increase',recoveryHours:70,outcome:{value:'better'}},
 {recommendationId:'r3',exerciseId:'press',completedAt:iso(28),outcomeScore:.65,performanceDelta:.03,followedRecommendation:true,recoveryState:'good',phase:'build',sets:3,reps:8,recommendationType:'hold',recoveryHours:68,outcome:{value:'same'}},
 {recommendationId:'r4',exerciseId:'press',completedAt:iso(40),outcomeScore:.75,performanceDelta:.06,followedRecommendation:true,recoveryState:'good',phase:'build',sets:3,reps:10,recommendationType:'hold',recoveryHours:75,outcome:{value:'better'}},
 {recommendationId:'r5',exerciseId:'press',completedAt:iso(155),outcomeScore:.2,performanceDelta:-.08,followedRecommendation:true,recoveryState:'poor',phase:'build',sets:5,reps:6,recommendationType:'increase',recoveryHours:30,outcome:{value:'worse'}}
];
function run(file,withCore){const window={};const ctx={window,console,setTimeout:()=>0,Date,Object,JSON,Number,String,Boolean,Math,Array,RegExp};vm.createContext(ctx);if(withCore)vm.runInContext(evidence,ctx,{filename:'myliftcoach-athlete-evidence-core.js'});vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});return window;}
for(const [file,normalizeName,profileName] of modules){const shared=run(file,true),standalone=run(file,false);const a=JSON.parse(JSON.stringify(shared[normalizeName](events))),b=JSON.parse(JSON.stringify(standalone[normalizeName](events)));assert.deepEqual(a,b,`${file} normalization changed through shared evidence core`);const pa=JSON.parse(JSON.stringify(shared[profileName](events,'press'))),pb=JSON.parse(JSON.stringify(standalone[profileName](events,'press')));assert.deepEqual(pa,pb,`${file} profile changed through shared evidence core`);}
const cfg=fs.readFileSync('supabase-config.js','utf8');const sharedPos=cfg.indexOf('myliftcoach-athlete-evidence-core.js?v=1'),ctxPos=cfg.indexOf('athlete-context-learning-v8.js?v=8.0'),dosePos=cfg.indexOf('athlete-dose-response-v8_2.js?v=8.2'),recoveryPos=cfg.indexOf('athlete-recovery-lag-v8_3.js?v=8.3');assert(sharedPos>0&&ctxPos>sharedPos&&dosePos>sharedPos&&recoveryPos>sharedPos,'shared Athlete evidence core must load before all Athlete evidence models');
console.log('Athlete evidence shared-core equivalence and runtime load order pass.');