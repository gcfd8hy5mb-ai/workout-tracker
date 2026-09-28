const fs = require('fs');
const assert = require('assert');

const config = fs.readFileSync('supabase-config.js','utf8');
const manifest = fs.readFileSync('manifest.json','utf8');
const home = fs.readFileSync('liftova-home.js','utf8');
const reference = fs.readFileSync('liftova-reference-v3.js','utf8');

const referencePos = config.indexOf("'liftova-reference-v3.js?v=1'");
const homePos = config.indexOf("'liftova-home.js?v=9'");
assert(referencePos >= 0, 'reference renderer must remain loaded');
assert(homePos > referencePos, 'canonical photo-free Home must load after legacy reference Home');
assert(config.includes("apple-touch-icon-180.png?v=6"), 'runtime touch icon must use dedicated PNG');
assert(manifest.includes('apple-touch-icon-180.png?v=6'), 'manifest must use refreshed PNG touch icon');
assert(!home.includes('lv3-today-photo'), 'canonical Home must not contain legacy workout photo');
assert(reference.includes('lv3-today-photo'), 'test must guard against the known legacy photo renderer');
console.log('LIFTOVA Home precedence/icon regression checks passed');
