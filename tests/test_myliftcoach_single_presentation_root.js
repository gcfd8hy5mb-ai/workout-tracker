const fs = require('fs');
const assert = require('assert');

const config = fs.readFileSync('supabase-config.js', 'utf8');

assert(!config.includes("'liftova-reference-v3.js"), 'retired liftova-reference-v3.js must not be loaded by runtime');
assert(!config.includes('setTimeout(mount,500)'), 'canonical Home must not use the retired delayed mount path');
assert(config.includes("'liftova-home.js?v=13'"), 'canonical Home presentation must remain in the sequential runtime');
assert(!config.includes("'liftova-custom-home.js"), 'retired custom Home compatibility scheduler must not load');
assert(config.includes("'myliftcoach-home-sequence-fix.js?v=5'"), 'single canonical weekday schedule authority must remain loaded');
assert(config.includes("'myliftcoach-custom-workout-fix.js?v=2'"), 'custom workout management must load without owning Home scheduling');

console.log('MYLIFTCOACH single-presentation-root and single-schedule-authority regression guard passed');
