const assert = require('node:assert/strict');
const fs = require('node:fs');

const patch = fs.readFileSync('liftova-workout-tab-v3.js','utf8');
const config = fs.readFileSync('supabase-config.js','utf8');

assert.match(config, /liftova-workout-tab-v3\.js\?v=2/, 'current-day Workout-tab patch must be cache-bumped');
assert.match(patch, /window\.showWorkouts\s*=\s*function/, 'Workout tab must override the legacy browser entry');
assert.match(patch, /myliftcoachWeeklySchedule/, 'Workout tab must use the same weekly schedule authority as Home');
assert.match(patch, /const dayIndex=\(new Date\(\)\.getDay\(\)\+6\)%7/, 'Workout tab must resolve the actual weekday');
assert.match(patch, /showPrismWorkoutDetail\(item\)/, 'Workout tab must open the resolved scheduled workout');
assert.match(patch, /kind:'suggested'/, 'generated plan days must retain suggested-workout behavior');
assert.match(patch, /kind:'preset'/, 'basic plan days must retain preset-workout behavior');
assert.match(patch, /kind:'custom'/, 'custom scheduled days must retain custom-workout behavior');
assert.match(patch, /kind:'scheduled'/, 'weekday overrides must remain startable');
assert.doesNotMatch(patch, /liftova-reference-upper-body/, 'Workout tab must not force the old hard-coded Upper Body session');
assert.doesNotMatch(patch, /CANONICAL_IDS/, 'Workout tab must not keep a fixed Monday/Upper Body exercise list');
assert.doesNotMatch(patch, /CHEST · BACK · SHOULDERS · ARMS/, 'detail subtitle must come from the actual scheduled workout');
assert.doesNotMatch(patch, /<b>Hypertrophy<\/b>/, 'detail goal must not be hard-coded to Hypertrophy');
assert.doesNotMatch(patch, /new\s+MutationObserver/, 'Workout-tab fix must not add another mutation observer');

console.log('MYLIFTCOACH current-day Workout tab: OK');
