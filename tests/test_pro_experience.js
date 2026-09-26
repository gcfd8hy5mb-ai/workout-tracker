const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../pro-experience.js'),'utf8');
const storage=new Map([['workoutHistoryV52','preserve'],['prismEntitlementV1','preserve'],['progressPhotosV1','preserve']]);
const example={id:'machine-chest-press',name:'Machine Chest Press',muscle:'Chest'};
const alternative={id:'smith-bench-press',name:'Smith Bench Press',muscle:'Chest'};
const status={textContent:''};
const appendedScripts=[];
const context={
workoutHistory:[],PRISM_ACCESS:{limits:{freeCustomWorkouts:3}},PRISM_GOAL_NAMES:{cut:'Cut'},
getExercise:id=>id===example.id?example:id===alternative.id?alternative:null,
progressionSuggestion:()=>({status:'ready',lastWeight:180,lastReps:[10,10,10],weight:185,range:{min:8,max:10}}),
rankExerciseSubstitutions:()=>[{exercise:alternative,metadata:{primary:'Chest',secondary:['Triceps','Front Delts']},reason:'Same horizontal press movement.'}],
escapeHTML:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'),
weekStart:()=> '2026-09-21',sessionDay:s=>s.date.slice(0,10),
localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
document:{
  getElementById:id=>id==='prismProFeedbackStatus'?status:null,
  querySelector:()=>null,
  createElement:tag=>({tagName:String(tag).toUpperCase(),dataset:{},src:'',async:true}),
  body:{appendChild:node=>{appendedScripts.push(node);return node;}}
}
};
context.window=context;
vm.createContext(context);vm.runInContext(source,context);
assert.ok(appendedScripts.length>=1,'Pro experience should register its feature scripts');
assert.match(context.prismProProgressionExample(),/SAMPLE PREVIEW · NOT YOUR DATA/);
context.workoutHistory=[{date:'2026-09-25T12:00:00Z',exercises:[{id:example.id,sets:[{weight:180,reps:10},{weight:180,reps:10},{weight:180,reps:10}]}]}];
assert.match(context.prismProProgressionExample(),/YOUR SAVED TRAINING[\s\S]*Suggested: 185 lb/);
assert.match(context.prismProFeaturePreview('smart_substitutions'),/Smith Bench Press/);
assert.match(context.prismProFeaturePreview('photo_comparison'),/Front \/ Side \/ Back/);
const plateau=context.prismProFeaturePreview('plateau_detection');assert.match(plateau,/PLATEAU DETECTION|COMING LATER/);
assert.match(context.prismProFeaturePreview('weekly_prism_summary'),/1 workouts · 3 working sets · 5,400 lb volume/);
const form={elements:[{name:'wouldPay',value:'Maybe'},{name:'monthlyPrice',value:'9.99'},{name:'comments',value:'Simple, please'}]};
context.savePrismProFeedback({preventDefault(){},currentTarget:form});
assert.equal(JSON.parse(storage.get('prismProBetaFeedbackV1')).wouldPay,'Maybe');
for(const key of ['workoutHistoryV52','prismEntitlementV1','progressPhotosV1'])assert.equal(storage.get(key),'preserve',`${key} must not change`);
assert.match(status.textContent,/Saved on this device/);
console.log('Pro examples, script loading, labeled samples, separate feedback, and preserved user data: OK');
