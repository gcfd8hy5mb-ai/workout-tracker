const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../plateau-detection.js'),'utf8');
const exercises={chest:{id:'chest',name:'Chest Press',muscle:'Chest'}};
const context={console,Map,Math,Number,String,workoutHistory:[],getExercise:id=>exercises[id]||null,sessionDay:s=>s.date,escapeHTML:v=>String(v),window:{}};
vm.createContext(context);vm.runInContext(source,context);
function history(points){return points.map((p,i)=>({date:`2026-09-${String(1+i*3).padStart(2,'0')}`,exercises:[{id:'chest',sets:[{weight:p[0],reps:p[1]}]}]}));}
// Not enough history: never call a plateau.
context.workoutHistory=history([[100,10],[100,10],[100,10]]);assert.equal(context.prismDetectPlateaus().length,0);
// Four identical performances: true plateau.
context.workoutHistory=history([[100,10],[100,10],[100,10],[100,10]]);let result=context.prismDetectPlateaus();assert.equal(result.length,1);assert.equal(result[0].name,'Chest Press');assert.match(result[0].suggestion,/four logged sessions/i);
// Continued progression should not be flagged.
context.workoutHistory=history([[100,8],[100,9],[100,10],[100,11]]);assert.equal(context.prismDetectPlateaus().length,0);
// Clear weight progression should not be flagged.
context.workoutHistory=history([[90,10],[95,10],[100,10],[105,10]]);assert.equal(context.prismDetectPlateaus().length,0);
// Small normal fluctuations can still represent a flat trend across four sessions.
context.workoutHistory=history([[100,10],[100,9],[100,10],[100,9]]);result=context.prismDetectPlateaus();assert.equal(result.length,1);
// A load increase with enough rep loss to keep performance flat should be surfaced.
context.workoutHistory=history([[100,10],[100,10],[105,9],[105,8]]);result=context.prismDetectPlateaus();assert.equal(result.length,1);assert.match(result[0].suggestion,/rebuild reps/i);
// A meaningful performance jump in the recent window clears the plateau.
context.workoutHistory=history([[100,10],[100,10],[100,10],[105,10]]);assert.equal(context.prismDetectPlateaus().length,0);
// Preview uses saved data and never mutates it.
context.workoutHistory=history([[100,10],[100,10],[100,10],[100,10]]);const snapshot=JSON.stringify(context.workoutHistory);assert.match(context.prismPlateauPreview(),/PLATEAU DETECTED/);assert.equal(JSON.stringify(context.workoutHistory),snapshot);
console.log('PRISM Plateau Detection history, progression, fluctuations, load/rep tradeoff, and data safety: OK');