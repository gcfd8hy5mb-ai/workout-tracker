const fs = require('fs');
const assert = require('assert');

const config = fs.readFileSync('supabase-config.js', 'utf8');
const schedule = fs.readFileSync('myliftcoach-home-sequence-fix.js', 'utf8');

const canonicalPos = config.indexOf("'liftova-home.js?v=12'");
const schedulePos = config.indexOf("'myliftcoach-home-sequence-fix.js?v=4'");
assert(canonicalPos >= 0, 'canonical Home must remain loaded');
assert(schedulePos > canonicalPos, 'canonical weekday schedule authority must load after Home');
assert(!config.includes("'liftova-custom-home.js"), 'retired history-cycling custom Home layer must not load');
assert(schedule.includes("customWorkoutsV5"), 'weekly schedule must read saved custom workouts');
assert(schedule.includes("const source=customs.length?customs:plans"), 'custom workouts must override preset/suggested plans');
assert(!schedule.includes("workoutHistoryV52"), 'weekday scheduling must not choose a custom workout from completion history');
assert(schedule.includes("openCustomWorkout(index)"), 'scheduled custom workout card must open the matching custom workout');
assert(schedule.includes("workoutKey:'custom-'+workout.id"), 'custom schedule workout keys must match the workout engine');
assert(schedule.includes("if(override.rest){week[i]=null"), 'explicit Rest Day overrides must win');
console.log('MYLIFTCOACH custom workout single-schedule regression checks passed');
