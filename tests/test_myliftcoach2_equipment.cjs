const test=require('node:test'),assert=require('node:assert/strict');
const meta=require('../myliftcoach2/exercise-metadata.js');
test('original classifications and increment match isolation movements',()=>{assert.ok(meta.count>=50);assert.equal(meta.get('pec-deck').type,'Isolation');assert.equal(meta.increment('pec-deck','Pec Deck'),2.5);});
test('original classifications apply to dumbbells and compound machines',()=>{assert.equal(meta.increment('dumbbell-row','Dumbbell Row'),2.5);assert.equal(meta.increment('machine-chest-press','Machine Chest Press'),5);});
test('fallback uses original name inference for unclassified exercises',()=>{assert.equal(meta.increment('unknown','Dumbbell Rotation'),2.5);assert.equal(meta.increment('unknown-machine','Unknown Station'),5);});
