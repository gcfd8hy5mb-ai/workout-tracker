const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class MemoryStorage{
  constructor(){this.map=new Map()}
  getItem(key){return this.map.has(String(key))?this.map.get(String(key)):null}
  setItem(key,value){this.map.set(String(key),String(value))}
  removeItem(key){this.map.delete(String(key))}
}

const localStorage=new MemoryStorage();
const document={
  readyState:'loading',body:{},
  addEventListener(){},
  createElement(){return {style:{},append(){},appendChild(){},setAttribute(){},querySelector(){return null}}},
  getElementById(){return null},querySelector(){return null}
};
class MutationObserver{constructor(){} observe(){}}
const context={
  console,localStorage,document,MutationObserver,
  addEventListener(){},
  requestAnimationFrame(){},setTimeout(){},alert(){},
  exerciseLibrary:[
    {id:'a1',name:'Chest Press',muscle:'Chest'},{id:'a2',name:'Triceps Press',muscle:'Triceps'},
    {id:'b1',name:'Leg Press',muscle:'Quads'},{id:'b2',name:'Leg Curl',muscle:'Hamstrings'},
    {id:'c1',name:'Row',muscle:'Back'}
  ],
  workoutGoals:{skipped:false,days:4,basic:true},
  presetWorkouts:{one:{title:'Preset One',exercises:['c1']},two:{title:'Preset Two',exercises:['c1']}},
  window:null
};
context.window=context;
vm.createContext(context);

const setCustoms=value=>localStorage.setItem('customWorkoutsV5',JSON.stringify(value));
const setOverrides=value=>localStorage.setItem('myliftcoachWeeklyDayOverridesV1',JSON.stringify(value));
const setHistory=value=>localStorage.setItem('workoutHistoryV52',JSON.stringify(value));
setCustoms([
  {id:'alpha',name:'Custom Upper',exercises:['a1','a2']},
  {id:'beta',name:'Custom Lower',exercises:['b1','b2']}
]);
setOverrides({});

const source=fs.readFileSync('myliftcoach-home-sequence-fix.js','utf8');
vm.runInContext(source,context);
const schedule=context.myliftcoachWeeklySchedule;
assert.equal(typeof schedule,'function','canonical weekly schedule must be exported for integration consumers');

const plain=value=>JSON.parse(JSON.stringify(value));
function signature(week){return plain(week.map(day=>day?day.name:'Rest'))}
const expected=['Custom Upper','Custom Lower','Rest','Custom Upper','Custom Lower','Rest','Rest'];

// Simulate three successive weeks with changing workout history. History must not
// rotate or replace the weekday program; the same selected-day schedule remains authoritative.
for(let week=1;week<=3;week++){
  setHistory(Array.from({length:week*4},(_,i)=>({workoutKey:i%2?'custom-beta':'custom-alpha',date:`2026-10-${String(i+1).padStart(2,'0')}`})));
  assert.deepEqual(signature(schedule()),expected,`week ${week} must keep the weekday custom program stable`);
}

// Explicit Rest Day wins without shifting another workout into that weekday.
setOverrides({1:{rest:true}});
assert.deepEqual(signature(schedule()),['Custom Upper','Rest','Rest','Custom Upper','Custom Lower','Rest','Rest']);

// Editing a custom workout is reflected immediately by the same schedule authority.
setOverrides({});
setCustoms([
  {id:'alpha',name:'Custom Upper Edited',exercises:['a1','c1']},
  {id:'beta',name:'Custom Lower',exercises:['b1','b2']}
]);
assert.deepEqual(signature(schedule()),['Custom Upper Edited','Custom Lower','Rest','Custom Upper Edited','Custom Lower','Rest','Rest']);
assert.deepEqual(plain(schedule()[0].ids),['a1','c1'],'edited exercise list must reach the scheduled workout');

// Deleting one custom workout must never fall back to presets while another custom
// workout still exists; the remaining custom repeats across selected training days.
setCustoms([{id:'alpha',name:'Custom Upper Edited',exercises:['a1','c1']}]);
assert.deepEqual(signature(schedule()),['Custom Upper Edited','Custom Upper Edited','Rest','Custom Upper Edited','Custom Upper Edited','Rest','Rest']);
assert.equal(schedule().some(day=>day&&/^Preset/.test(day.name)),false,'preset workout must not reappear while a custom program exists');

// Recreating a second custom workout restores deterministic cycling across the same days.
setCustoms([
  {id:'alpha',name:'Custom Upper Edited',exercises:['a1','c1']},
  {id:'gamma',name:'Custom Lower New',exercises:['b1','b2']}
]);
assert.deepEqual(signature(schedule()),['Custom Upper Edited','Custom Lower New','Rest','Custom Upper Edited','Custom Lower New','Rest','Rest']);

console.log(JSON.stringify({
  suite:'MYLIFTCOACH Beta Custom Program 3-Week Simulation',
  weeks:3,
  checks:{
    historyDoesNotRotateSchedule:true,
    restDayOverride:true,
    editPropagation:true,
    deletionKeepsCustomAuthority:true,
    recreationCyclesDeterministically:true,
    presetsStaySuppressed:true
  }
},null,2));
