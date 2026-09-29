const fs = require('fs');
const assert = require('assert');

const config = fs.readFileSync('supabase-config.js', 'utf8');
const customHome = fs.readFileSync('liftova-custom-home.js', 'utf8');

const canonicalMatch = config.match(/'liftova-home\.js\?v=\d+'/);
const customMatch = config.match(/'liftova-custom-home\.js\?v=\d+'/);
assert(canonicalMatch, 'canonical Home must remain loaded');
assert(customMatch, 'custom workout Home sync must remain loaded');
const canonicalPos = config.indexOf(canonicalMatch[0]);
const customPos = config.indexOf(customMatch[0]);
assert(customPos > canonicalPos, 'custom workout Home sync must load after canonical Home');
assert(customHome.includes("customWorkoutsV5"), 'custom Home must read saved custom workouts');
assert(customHome.includes("workoutHistoryV52"), 'custom Home must use workout history to choose the next custom workout');
assert(customHome.includes("openCustomWorkout"), 'Home custom workout card must open the matching custom workout');
assert(customHome.includes("custom-${workout.id}"), 'custom Home workout keys must match the workout engine');
console.log('LIFTOVA custom workout Home regression checks passed');
