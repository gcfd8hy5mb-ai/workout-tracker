const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../plateau-detection.js'),'utf8');
const exercises={chest:{id:'chest',name:'Chest Press',muscle:'Chest'}};
const context={console,Map,Math,Number,String,CSS:{escape:v=>String(v)},workoutHistory:[],getExercise:id=>exercises[id]||null,sessionDay:s=>s.date,escapeHTML:v=>String(v),canAccessFeature:()=>true,showProPreview:()=>{},window:{},document:{body:null},MutationObserver:undefined,setTimeout:()=>{}};
vm.createContext(context);vm.runInContext(source,context);
function history(points){return points.map((p,i)=>({date:`2026-09-${String(1+i*3).padStart(2,'0')}`,exercises:[{id:'chest',sets:[{weight:p[0],reps:p[1]}]}]}));}
context.workoutHistory=history([[100,10],[100,10],[100,10]]);assert.equal(context.prismDetectPlateaus().length,0);
context.workoutHistory=history([[100,10],[100,10],[100,10],[100,10]]);let result=context.prismDetectPlateaus();assert.equal(result.length,1);assert.equal(result[0].name,'Chest Press');assert.match(result[0].suggestion,/four logged sessions/i);
context.workoutHistory=history([[100,8],[100,9],[100,10],[100,11]]);assert.equal(context.prismDetectPlateaus().length,0);
context.workoutHistory=history([[90,10],[95,10],[100,10],[105,10]]);assert.equal(context.prismDetectPlateaus().length,0);
context.workoutHistory=history([[100,10],[100,9],[100,10],[100,9]]);result=context.prismDetectPlateaus();assert.equal(result.length,1);
context.workoutHistory=history([[100,10],[100,10],[105,9],[105,8]]);result=context.prismDetectPlateaus();assert.equal(result.length,1);assert.match(result[0].suggestion,/rebuild reps/i);
context.workoutHistory=history([[100,10],[100,10],[100,10],[105,10]]);assert.equal(context.prismDetectPlateaus().length,0);
context.workoutHistory=history([[100,10],[100,10],[100,10],[100,10]]);const snapshot=JSON.stringify(context.workoutHistory);assert.match(context.prismPlateauPreview(),/PLATEAU DETECTED/);assert.equal(JSON.stringify(context.workoutHistory),snapshot);
// Pro receives the useful diagnosis and next action.
context.canAccessFeature=()=>true;let html=context.prismPlateauInsightHTML('chest');assert.match(html,/PLATEAU WATCH/);assert.match(html,/Chest Press/);assert.match(html,/100 lb × 10/);assert.match(html,/aim for \+1 clean rep/i);
// Free receives value framing, but not the paid diagnosis or recommendation.
context.canAccessFeature=()=>false;html=context.prismPlateauInsightHTML('chest');assert.match(html,/PRISM PRO/);assert.match(html,/noticed a training pattern/i);assert.match(html,/Preview Plateau Detection/);assert.doesNotMatch(html,/100 lb × 10/);assert.doesNotMatch(html,/aim for \+1 clean rep/i);
// No detected plateau means no card for either tier.
context.workoutHistory=history([[100,8],[100,9],[100,10],[100,11]]);assert.equal(context.prismPlateauInsightHTML('chest'),'');
// DOM insertion is idempotent: a re-render pass must not append a duplicate card.
context.workoutHistory=history([[100,10],[100,10],[100,10],[100,10]]);context.canAccessFeature=()=>true;let appended=0;const host={querySelector:selector=>selector==='.prism-plateau-insight'&&appended>0?{}:null,appendChild:()=>{appended++;}};const root={querySelectorAll:()=>[],querySelector:selector=>selector.includes('chest')?host:null};context.document={createElement:()=>({innerHTML:'',get firstElementChild(){return {};}})};context.prismSurfacePlateauInsights(root);context.prismSurfacePlateauInsights(root);assert.equal(appended,1);
assert.equal(JSON.stringify(context.workoutHistory),snapshot);
console.log('PRISM Plateau Detection engine, Free/Pro gating, duplicate protection, and data safety: OK');