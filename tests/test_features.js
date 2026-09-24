// Exercise the adaptive target with completed workout history, without a browser.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const match=source.match(/function progressionSuggestion\(exerciseId\)\{[\s\S]*?\n\}\nfunction overloadGoal/);
assert(match,'progression algorithm exists');
const context={workoutHistory:[]};
vm.createContext(context);
vm.runInContext(match[0].replace(/\nfunction overloadGoal$/,''),context);
const session=(weight,reps)=>({exercises:[{id:'press',sets:reps.map(rep=>({weight,reps:rep}))}]});
assert.equal(context.progressionSuggestion('press'),null);
context.workoutHistory=[session(180,[10,10,10])];
assert.equal(context.progressionSuggestion('press').weight,185);
context.workoutHistory=[session(185,[8,9,8]),session(180,[10,10,10])];
assert.equal(context.progressionSuggestion('press').weight,185);
context.workoutHistory=[session(185,[6,7,6]),session(185,[6,6,7])];
assert.equal(context.progressionSuggestion('press').weight,180);
console.log('Smart progression: increase, repeat, and deload passed');
