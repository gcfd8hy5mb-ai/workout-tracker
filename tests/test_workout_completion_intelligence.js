const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../workout-completion-intelligence.js'),'utf8');
const exercises={chest:{id:'chest',name:'Chest Press'},row:{id:'row',name:'Seated Row'}};
const area={querySelector:()=>null,appendChild:()=>{}};
const context={console,Math,Number,String,workoutHistory:[],getExercise:id=>exercises[id]||null,escapeHTML:v=>String(v),canAccessFeature:()=>true,progressionSuggestion:()=>null,prismDetectPlateaus:()=>[],showProPreview:()=>{},window:{},document:{getElementById:()=>area,createElement:()=>({className:'',innerHTML:''})},showWorkoutSummary:function(){}};
vm.createContext(context);vm.runInContext(source,context);
function ex(id,w,r){return {id,name:exercises[id].name,sets:[{weight:w,reps:r}]};}
function session(date,items,recordIds=[]){return {date,exercises:items,recordIds};}
const old=session('2026-09-20',[ex('chest',100,10),ex('row',100,10)]);
const current=session('2026-09-25',[ex('chest',105,10),ex('row',100,8)],['chest']);
context.workoutHistory=[current,old];let analysis=context.prismCompletionAnalyze(current);assert.equal(analysis.improved.length,1);assert.equal(analysis.improved[0].id,'chest');assert.equal(analysis.declined.length,1);assert.equal(analysis.declined[0].id,'row');assert.equal(context.prismCompletionChange(analysis.improved[0]),'+5 lb');
// One extra rep at the same load counts as progress.
const repOld=session('2026-09-20',[ex('chest',100,10)]),repNew=session('2026-09-25',[ex('chest',100,11)]);context.workoutHistory=[repNew,repOld];analysis=context.prismCompletionAnalyze(repNew);assert.equal(analysis.improved.length,1);assert.equal(context.prismCompletionChange(analysis.improved[0]),'+1 rep');
// A one-rep drop is normal noise; two reps down is worth surfacing.
let noise=session('2026-09-25',[ex('chest',100,9)]);context.workoutHistory=[noise,repOld];analysis=context.prismCompletionAnalyze(noise);assert.equal(analysis.declined.length,0);let decline=session('2026-09-25',[ex('chest',100,8)]);context.workoutHistory=[decline,repOld];analysis=context.prismCompletionAnalyze(decline);assert.equal(analysis.declined.length,1);
// Free gets the value preview but not paid performance details.
context.workoutHistory=[current,old];context.canAccessFeature=()=>false;let html=context.prismCompletionProHTML(current);assert.match(html,/PRISM PRO/);assert.match(html,/Unlock your workout insight/);assert.doesNotMatch(html,/Chest Press<\/strong>/);assert.doesNotMatch(html,/\+5 lb/);
// Pro gets PRs, improvement details and an intelligence card.
context.canAccessFeature=()=>true;html=context.prismCompletionProHTML(current);assert.match(html,/New PR/);assert.match(html,/Improved/);assert.match(html,/\+5 lb/);assert.match(html,/PRISM INSIGHT/);
// Smart Progression feeds the next target when no plateau exists.
context.progressionSuggestion=id=>id==='chest'?{status:'ready',action:'increase',weight:110,range:{min:8,max:10}}:null;context.prismDetectPlateaus=()=>[];analysis=context.prismCompletionAnalyze(current);assert.match(context.prismCompletionInsight(current,analysis),/110 lb/);assert.match(context.prismCompletionInsight(current,analysis),/8–10 reps/);
// Plateau guidance takes priority over generic progression guidance.
context.prismDetectPlateaus=()=>[{id:'chest',name:'Chest Press',suggestion:'Hold the load and rebuild reps.'}];assert.match(context.prismCompletionInsight(current,analysis),/may be plateauing/);assert.match(context.prismCompletionInsight(current,analysis),/rebuild reps/);assert.doesNotMatch(context.prismCompletionInsight(current,analysis),/110 lb/);
// Rendering twice must not duplicate the intelligence wrapper.
let appended=0,exists=false;const renderArea={querySelector:selector=>selector==='.prism-completion-intelligence'&&exists?{}:null,appendChild:()=>{appended++;exists=true;}};context.document={getElementById:()=>renderArea,createElement:()=>({className:'',innerHTML:''})};context.prismEnhanceCompletion(current);context.prismEnhanceCompletion(current);assert.equal(appended,1);
// Analysis/rendering must never mutate saved workout data.
context.workoutHistory=[current,old];const snapshot=JSON.stringify(context.workoutHistory);context.prismCompletionAnalyze(current);context.prismCompletionProHTML(current);assert.equal(JSON.stringify(context.workoutHistory),snapshot);
console.log('PRISM Workout Completion Intelligence gating, progress, PRs, progression, plateau priority, duplicate protection, and data safety: OK');