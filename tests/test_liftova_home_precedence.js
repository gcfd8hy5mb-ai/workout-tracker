const fs = require('fs');
const assert = require('assert');

const config = fs.readFileSync('supabase-config.js','utf8');
const manifest = fs.readFileSync('manifest.json','utf8');
const html = fs.readFileSync('index.html','utf8');
const home = fs.readFileSync('liftova-home.js','utf8');
const reference = fs.readFileSync('liftova-reference-v3.js','utf8');
const pro = fs.readFileSync('liftova-pro.js','utf8');

const homeMatch = config.match(/'liftova-home\.js\?v=\d+'/);
const homePos = homeMatch ? config.indexOf(homeMatch[0]) : -1;
const customHomePos = config.indexOf("'liftova-custom-home.js?v=1'");
const polishMatch = config.match(/'liftova-polish\.js\?v=\d+'/);
const polishPos = polishMatch ? config.indexOf(polishMatch[0]) : -1;

// Root-cause guard: reference-v3 is a complete second UI renderer. It rewrites Home, nav and
// menu branding and must never be mounted alongside the canonical Home renderer.
assert(!config.includes('liftova-reference-v3.js'), 'duplicate legacy reference renderer must not be loaded');
assert(reference.includes('shell.innerHTML'), 'test must continue to recognize reference-v3 as a full competing renderer');
assert(reference.includes("brand.textContent='LIFTOVA'"), 'test must guard the known legacy menu-brand rewrite');
assert(reference.includes('lv3-home-hero'), 'test must guard the known duplicate Home hero');

assert(homePos >= 0, 'canonical Home renderer must remain loaded');
assert(customHomePos > homePos, 'custom Home sync must load after canonical Home');
assert(polishPos > customHomePos, 'final MYLIFTCOACH branding must load after every active Home renderer');
assert(polishMatch && polishMatch[0].includes('v=9'), 'final MYLIFTCOACH branding must use the new cache-bumped runtime');
assert(config.includes("'liftova-pro.js?v=8'"), 'MYLIFTCOACH Pro surface must use the unified brand release');
assert(!/25,183,255|19b7ff|8bdcff|087fbd/i.test(pro), 'legacy cyan/PRISM-era Pro palette must not remain');
assert(pro.includes('MYLIFTCOACH · PRO'), 'Pro hero must render MYLIFTCOACH directly');
assert(pro.includes('images/liftova-icon.svg?v=10'), 'Pro hero must use the current MYLIFTCOACH logo asset');
assert(!config.includes("touchIcon.href='images/liftova-icon.svg?v=8'"), 'runtime config must not overwrite the current Apple touch icon with an older asset');
assert(html.includes('apple-touch-icon-180.png?v=10'), 'HTML must keep the current MYLIFTCOACH Apple touch icon');
assert(manifest.includes('images/apple-touch-icon-180.png?v=10'), 'manifest must use refreshed MYLIFTCOACH Apple touch icon');
assert(manifest.includes('images/liftova-icon.svg?v=10'), 'manifest must use refreshed MYLIFTCOACH scalable icon');
assert(manifest.includes('"name": "MYLIFTCOACH"'), 'installed app name must be MYLIFTCOACH');
assert(manifest.includes('"short_name": "MYLIFTCOACH"'), 'installed app short name must be MYLIFTCOACH');
assert(!home.includes('lv3-today-photo'), 'canonical Home must not contain legacy reference workout photo');
console.log('Single UI root, MYLIFTCOACH branding, Pro palette, and icon regression checks passed');
