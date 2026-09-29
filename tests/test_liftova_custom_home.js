const fs = require('fs');
const assert = require('assert');

const config = fs.readFileSync('supabase-config.js', 'utf8');
const customHome = fs.readFileSync('liftova-custom-home.js', 'utf8');

const canonicalPos = config.indexOf("'liftova-home.js?v=12'");
const customPos = config.indexOf("'liftova-custom-home.js?v=1'");
assert(canonicalPos >= 0, 'canonical Home must remain loaded');
assert(customPos > canonicalPos, 'custom workout Home sync must load after canonical Home');
assert(customHome.includes("customWorkoutsV5"), 'custom Home must read saved custom workouts');
assert(customHome.includes("workoutHistoryV52"), 'custom Home must use workout history to choose the next custom workout');
assert(customHome.includes("openCustomWorkout"), 'Home custom workout card must open the matching custom workout');
assert(customHome.includes("custom-${workout.id}"), 'custom Home workout keys must match the workout engine');
console.log('LIFTOVA custom workout Home regression checks passed');
