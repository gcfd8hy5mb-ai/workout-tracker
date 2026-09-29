const fs = require('fs');
const assert = require('assert');

const config = fs.readFileSync('supabase-config.js','utf8');
const manifest = fs.readFileSync('manifest.json','utf8');
const html = fs.readFileSync('index.html','utf8');
const home = fs.readFileSync('liftova-home.js','utf8');
const reference = fs.readFileSync('liftova-reference-v3.js','utf8');

const referencePos = config.indexOf("'liftova-reference-v3.js?v=1'");
const homeMatch = config.match(/'liftova-home\.js\?v=\d+'/);
const homePos = homeMatch ? config.indexOf(homeMatch[0]) : -1;
const customHomePos = config.indexOf("'liftova-custom-home.js?v=1'");
const polishMatch = config.match(/'liftova-polish\.js\?v=\d+'/);
const polishPos = polishMatch ? config.indexOf(polishMatch[0]) : -1;
assert(referencePos >= 0, 'reference renderer must remain loaded');
assert(homePos > referencePos, 'canonical photo-free Home must load after legacy reference Home');
assert(customHomePos > homePos, 'custom Home sync must load after canonical Home');
assert(polishPos > customHomePos, 'final MYLIFTCOACH branding must load after every Home renderer');
assert(polishMatch && polishMatch[0].includes('v=8'), 'final MYLIFTCOACH branding must use the cache-bumped runtime');
assert(!config.includes("touchIcon.href='images/liftova-icon.svg?v=8'"), 'runtime config must not overwrite the current Apple touch icon with an older asset');
assert(html.includes('apple-touch-icon-180.png?v=10'), 'HTML must keep the current MYLIFTCOACH Apple touch icon');
assert(manifest.includes('images/apple-touch-icon-180.png?v=10'), 'manifest must use refreshed MYLIFTCOACH Apple touch icon');
assert(manifest.includes('images/liftova-icon.svg?v=10'), 'manifest must use refreshed MYLIFTCOACH scalable icon');
assert(manifest.includes('"name": "MYLIFTCOACH"'), 'installed app name must be MYLIFTCOACH');
assert(manifest.includes('"short_name": "MYLIFTCOACH"'), 'installed app short name must be MYLIFTCOACH');
assert(!home.includes('lv3-today-photo'), 'canonical Home must not contain legacy workout photo');
assert(reference.includes('lv3-today-photo'), 'test must guard against the known legacy photo renderer');
console.log('MYLIFTCOACH Home precedence, final branding order, and icon regression checks passed');
