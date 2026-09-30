const fs = require('fs');
const assert = require('assert');

const config = fs.readFileSync('supabase-config.js','utf8');
const manifest = fs.readFileSync('manifest.json','utf8');
const html = fs.readFileSync('index.html','utf8');
const home = fs.readFileSync('liftova-home.js','utf8');

const homeMatch = config.match(/'liftova-home\.js\?v=\d+'/);
const homePos = homeMatch ? config.indexOf(homeMatch[0]) : -1;
const customHomePos = config.indexOf("'liftova-custom-home.js?v=1'");
const polishMatch = config.match(/'liftova-polish\.js\?v=\d+'/);
const polishPos = polishMatch ? config.indexOf(polishMatch[0]) : -1;
assert(!config.includes('liftova-reference-v3.js'), 'retired duplicate reference renderer must not be loaded');
assert(homePos >= 0, 'canonical Home must remain loaded');
assert(customHomePos > homePos, 'custom Home sync must load after canonical Home');
assert(polishPos > customHomePos, 'final MYLIFTCOACH branding must load after every Home module');
assert(polishMatch && polishMatch[0].includes('v=8'), 'final MYLIFTCOACH branding must use the cache-bumped runtime');
assert(!config.includes('setTimeout(mount,500)'), 'canonical Home must not be delayed behind later presentation modules');
assert(!config.includes("touchIcon.href='images/liftova-icon.svg?v=8'"), 'runtime config must not overwrite the current Apple touch icon with an older asset');
assert(html.includes('apple-touch-icon-180.png?v=10'), 'HTML must keep the current MYLIFTCOACH Apple touch icon');
assert(manifest.includes('images/apple-touch-icon-180.png?v=10'), 'manifest must use refreshed MYLIFTCOACH Apple touch icon');
assert(manifest.includes('images/liftova-icon.svg?v=10'), 'manifest must use refreshed MYLIFTCOACH scalable icon');
assert(manifest.includes('"name": "MYLIFTCOACH"'), 'installed app name must be MYLIFTCOACH');
assert(manifest.includes('"short_name": "MYLIFTCOACH"'), 'installed app short name must be MYLIFTCOACH');
assert(!home.includes('lv3-today-photo'), 'canonical Home must not contain the retired legacy workout photo renderer');
console.log('MYLIFTCOACH single-root Home order, branding, and icon regression checks passed');
