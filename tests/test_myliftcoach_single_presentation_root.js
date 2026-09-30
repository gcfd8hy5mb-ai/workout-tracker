const fs = require('fs');
const assert = require('assert');

const config = fs.readFileSync('supabase-config.js', 'utf8');

assert(!config.includes("'liftova-reference-v3.js"), 'retired liftova-reference-v3.js must not be loaded by runtime');
assert(!config.includes('setTimeout(mount,500)'), 'canonical Home must not use the retired delayed mount path');
assert(config.includes("'liftova-home.js?v=12'"), 'canonical Home presentation must remain in the sequential runtime');
assert(config.includes("'liftova-custom-home.js?v=1'"), 'current custom Home compatibility layer must remain loaded');

console.log('MYLIFTCOACH single-presentation-root regression guard passed');
