'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),bridge=read('integrations/mlc2/redesign-bridge.js');
const css=read('integrations/mlc2/redesign-bridge.css');
test('All integration resources live only under isolated 2.0 path',()=>{
 for(const p of ['exercise-catalog-344.js','coach-program-builder.js','redesign-bridge.js']){
  assert.ok(html.includes('integrations/mlc2/'+p+'?v=1'));
  assert.ok(fs.existsSync('integrations/mlc2/'+p));
 }
 assert.ok(html.includes('integrations/mlc2/redesign-bridge.css?v=1'));
 assert.ok(html.includes('id="mlc2IntegrationScreen"'));
 assert.ok(html.includes('"mlc2IntegrationScreen"]'));
});
test('Redesign navigation and complete exercise catalog are available',()=>{
 assert.ok(html.includes('id="navMLC2Integration"'));
 assert.ok(html.includes('onclick="showMLC2Integration()"'));
 assert.ok(html.includes('id="mlc2ExerciseSearch"'));
 assert.ok(html.includes('id="mlc2MuscleGroup"'));
 assert.ok(bridge.includes('function renderExerciseLibrary()'));
 assert.ok(bridge.includes('function initializeExerciseLibrary()'));
 const mod={MLC2_EXERCISE_CATALOG:null};
 new Function('window',read('integrations/mlc2/exercise-catalog-344.js'))(mod);
 assert.equal(mod.MLC2_EXERCISE_CATALOG.length,344);
 assert.equal(new Set(mod.MLC2_EXERCISE_CATALOG.map(x=>x.id)).size,344);
});
test('Preview adapter cannot write cloud, saved workout history or navigation selection',()=>{
 assert.doesNotMatch(bridge,/\b(?:localStorage|sessionStorage|indexedDB|setItem|removeItem|fetch|XMLHttpRequest|supabase)\b/i);
 assert.ok(bridge.includes('workoutHistory.filter('));
 assert.ok(bridge.includes('s.exercises.flatMap('));
 assert.ok(bridge.includes('window.MLC2ProgramBuilder.render('));
});
test('New integration CSS is scoped to MYLIFTCOACH redesign screen',()=>{
 for(const rule of css.split('}')){
  const trimmed=rule.trim();if(!trimmed||trimmed.startsWith('/*'))continue;
  assert.ok(trimmed.startsWith('#mlc2IntegrationScreen'),trimmed.slice(0,70));
 }
});
