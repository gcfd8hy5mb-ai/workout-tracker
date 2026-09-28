const assert = require('node:assert/strict');
const fs = require('node:fs');

const patch = fs.readFileSync('liftova-workout-tab-v3.js','utf8');
const config = fs.readFileSync('supabase-config.js','utf8');

assert.match(config, /liftova-workout-tab-v3\.js\?v=2/, 'canonical Workout-tab patch must be cache-busted and loaded');
assert.match(patch, /window\.showWorkouts\s*=\s*function/, 'Workout tab must override the legacy workout browser entry');
assert.match(patch, /showPrismWorkoutDetail\(item\)/, 'Workout tab itself must still open the canonical detail view');
assert.match(patch, /kind:\s*'liftova-reference'/, 'canonical session marker must be present');
assert.match(patch, /activeWorkoutKey\s*=\s*'liftova-reference-upper-body'/, 'starting the canonical session must use its own active-workout key');
assert.match(patch, /openWorkout\(item\.title, item\.ids, false\)/, 'canonical eight-exercise session must remain loggable');
assert.match(patch, /const start = event\.target\.closest\?\.\('#lv3StartWorkout'\)/, 'Home START WORKOUT must be intercepted explicitly');
assert.match(patch, /if \(start\)[\s\S]*?startCanonicalWorkout\(\);/, 'Home START WORKOUT must launch the active workout immediately, not open an intermediate detail screen');
for (const id of [
  'machine-chest-press','incline-chest-press','pec-deck','lat-pulldown',
  'seated-row','shoulder-press','lateral-raise','triceps-pushdown'
]) assert.match(patch, new RegExp(id), `${id} must be in the approved Upper Body session`);
assert.doesNotMatch(patch, /new\s+MutationObserver/, 'Workout-tab fix must not add another mutation observer');

console.log('LIFTOVA canonical Workout tab + one-tap Home start: OK');
