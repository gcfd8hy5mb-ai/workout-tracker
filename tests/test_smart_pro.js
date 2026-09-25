const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const librarySection=source.slice(source.indexOf('const exerciseLibrary=['),source.indexOf('const presetWorkouts',source.indexOf('const exerciseLibrary=[')));
const ids=[...librarySection.matchAll(/\{id:"([^"]+)"/g)].map(match=>match[1]);
const metadataSection=source.slice(source.indexOf('const SMART_EXERCISE_ATTRIBUTES='),source.indexOf('function availableWorkoutPlans(){'));
const metadataIds=[...metadataSection.matchAll(/^([\w-]+)\|/gm)].map(match=>match[1]);
assert.deepEqual(new Set(metadataIds),new Set(ids),'every library exercise has substitution metadata');
const exercises=[
{id:'machine-chest-press',name:'Machine Chest Press',muscle:'Chest'},
{id:'smith-bench-press',name:'Smith Bench Press',muscle:'Chest'},
{id:'push-up',name:'Push-Up',muscle:'Chest'},
{id:'incline-chest-press',name:'Incline Chest Press',muscle:'Chest'},
{id:'pec-deck',name:'Pec Deck',muscle:'Chest'},
{id:'triceps-pushdown',name:'Triceps Pushdown',muscle:'Triceps'}
];
const context={getExercise:id=>exercises.find(ex=>ex.id===id),prismEquipment:()=>''};
vm.createContext(context);
vm.runInContext(metadataSection,context);
const ranked=context.rankExerciseSubstitutions('machine-chest-press',exercises);
assert.equal(ranked[0].exercise.id,'smith-bench-press','same pressing pattern outranks matching equipment alone');
assert.equal(ranked.at(-1).exercise.id,'pec-deck');
assert.equal(ranked.some(item=>item.exercise.id==='triceps-pushdown'),false,'keep replacements in the primary muscle group');
assert.match(ranked[0].reason,/horizontal press/);
assert.match(source,/const suggestion=showGoal&&smart\?progressionSuggestion\(ex.id\):null/,'only Pro sees progression UI');
assert.match(source,/if\(canAccessFeature\("smart_substitutions"\)\)\{\s*const ranked=rankExerciseSubstitutions/,'Pro uses ranked replacements');
assert.match(source,/\}else\{alternatives.sort\(\(a,b\)=>a.name.localeCompare/,'Free retains manual alphabetical choices');
assert.doesNotMatch(source.slice(source.indexOf('function finishWorkout(){'),source.indexOf('function showLastWorkoutSummary()')),/overloadTargets\[overloadKey/,'workout completion never applies suggested load');
console.log('Smart Pro metadata, ranking, Free/Pro presentation, and safe workout completion: OK');
