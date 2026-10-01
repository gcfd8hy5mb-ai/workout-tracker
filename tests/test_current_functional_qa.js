const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Current-main functional QA regression: Repeat Last Set and Coach planned-set
// confirmation must persist numeric values through saveSet rather than trying to
// click transient picker options.
const workoutSource=fs.readFileSync('workout-experience.js','utf8');
const saved=[];
function pickerButtons(key,weight,reps){return [
  {textContent:weight,getAttribute:name=>name==='onclick'?`openPicker('${key}','weight')`:null,dataset:{},classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){}},
  {textContent:reps,getAttribute:name=>name==='onclick'?`openPicker('${key}','reps')`:null,dataset:{},classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){}}
]}
const previous={dataset:{},querySelectorAll:selector=>selector==='.picker-button'?pickerButtons('prev-set','50 lb','8 reps'):[]};
const currentButtons=pickerButtons('current-set','Weight','Reps');
const current={dataset:{},parentElement:{querySelectorAll:()=>[previous,current]},querySelectorAll:selector=>selector==='.picker-button'?currentButtons:[],querySelector:()=>null};
const document={readyState:'loading',addEventListener(){},getElementById:()=>null,querySelectorAll:()=>[],createElement:()=>({}),head:{appendChild(){}}};
const window={dispatchEvent(){}};
const context={window,document,setTimeout:fn=>fn(),clearTimeout(){},MutationObserver:function(){this.observe=()=>{}},CustomEvent:function(){},sessionStorage:{getItem:()=>null,setItem(){}},location:{pathname:'/'},saveSet:(key,type,value)=>saved.push([key,type,value]),refreshComparison:key=>saved.push(['comparison',key])};
vm.createContext(context);vm.runInContext(workoutSource,context);
window.prismWorkoutExperience.copyPrevious(current);
assert.deepEqual(saved.slice(0,2),[['current-set','weight',50],['current-set','reps',8]],'Repeat Last Set must persist the previous numeric weight/reps');
assert.equal(currentButtons[0].textContent,'50 lb');
assert.equal(currentButtons[1].textContent,'8 reps');
assert.match(workoutSource,/confirmPlan\(block\)[\s\S]*setBlockValues\(block,w,r\)/,'Coach Confirm Set must use the same persistence path');

// Goals editing must not walk an established user back into first-run Welcome.
const onboarding=fs.readFileSync('onboarding.js','utf8');
const back=onboarding.match(/function prismBack\(\)\{[^\n]+\}/);
assert.ok(back,'prismBack must exist');
const journey={status:'onboarding',origin:'goals',step:1,draft:{displayName:'QA'}};
let destination='';
const backContext={prismJourney:journey,savePrismJourney(){},showTrackingGoals(){destination='goals'},showPrismWelcome(){destination='welcome'},renderPrismJourney(){destination='onboarding'}};
vm.createContext(backContext);vm.runInContext(back[0],backContext);backContext.prismBack();
assert.equal(destination,'goals','Back from editing a goal must return to Goals');
assert.equal(journey.status,'complete');
assert.equal(journey.origin,undefined);

// Completion rendering must suppress invalid next-target values. The runtime
// compatibility layer also guards legacy rendering while the core renderer remains safe.
const html=fs.readFileSync('index.html','utf8');
const fixes=fs.readFileSync('liftova-functional-fixes.js','utf8');
assert.ok(/next\?\.status===?['\"]ready['\"]|next\?\.status\s*===\s*['\"]ready['\"]/.test(html)||/Next:\\s\*\(\?:undefined\|NaN\)/.test(fixes),'completion summary must guard undefined/NaN next targets');

console.log(JSON.stringify({suite:'MYLIFTCOACH current-main functional QA',checks:{repeatLastSet:true,coachSetPersistence:true,goalsBackNavigation:true,completionTargetGuard:true}},null,2));
