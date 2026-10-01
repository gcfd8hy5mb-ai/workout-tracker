const fs=require('node:fs');
const assert=require('node:assert/strict');

const schedule=fs.readFileSync('myliftcoach-home-sequence-fix.js','utf8');
const manager=fs.readFileSync('myliftcoach-custom-workout-fix.js','utf8');
const config=fs.readFileSync('supabase-config.js','utf8');

assert.match(schedule,/const source=customs\.length\?customs:plans/,'saved custom workouts must replace preset/suggested plans as the active schedule source');
assert.match(schedule,/requested=days/,'selected training-day count must remain authoritative when custom workouts exist');
assert.doesNotMatch(schedule,/Math\.min\(days,source\.length\)/,'one custom workout must be allowed to repeat across multiple selected training days');
assert.match(schedule,/source\[index%source\.length\]/,'custom workouts must cycle deterministically across scheduled training slots');
assert.match(schedule,/if\(override\.rest\)\{week\[i\]=null/,'explicit Rest Day overrides must remain authoritative');
assert.match(schedule,/showRestDay\(card\)[\s\S]*clearCardAction\(card\)/,'Rest Day must clear stale custom-workout click state');
assert.match(schedule,/workout\.kind==='custom'[\s\S]*card\.dataset\.customWorkoutIndex/,'scheduled custom workout card must identify the exact custom workout');
assert.match(schedule,/openCustomWorkout\(index\)/,'tapping the scheduled custom workout must open that custom workout');
assert.match(schedule,/window\.myliftcoachWeeklySchedule=weeklySchedule/,'the canonical weekly schedule must be exposed as the single schedule authority');

assert.doesNotMatch(manager,/syncWeekStrip|\.lh-week/,'custom workout manager must not rewrite Home scheduling');
assert.match(manager,/window\.myliftcoachRefreshHomeSchedule\?\.\(\)/,'editing a custom workout must request a canonical schedule refresh');

assert.doesNotMatch(config,/['\"]liftova-custom-home\.js/,'legacy history-cycling custom Home overlay must not load');
assert.match(config,/myliftcoach-home-sequence-fix\.js\?v=4/,'canonical schedule authority must be cache-busted');
assert.match(config,/myliftcoach-custom-workout-fix\.js\?v=2/,'custom workout manager must load the non-scheduling version');

console.log(JSON.stringify({suite:'MYLIFTCOACH custom program single schedule authority',checks:{customOverridesPreset:true,selectedDaysPreserved:true,customsCycleAcrossDays:true,restOverrides:true,staleCardStateCleared:true,exactCustomOpens:true,legacySchedulerRemoved:true,managerNoLongerSchedules:true}},null,2));
