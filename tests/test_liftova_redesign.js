const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');
const exists = path => fs.existsSync(path);

const redesignFiles = [
  'liftova-onboarding.js','liftova-home.js','liftova-workouts.js','liftova-active-workout.js',
  'liftova-library.js','liftova-progress.js','liftova-profile.js','liftova-pro.js','liftova-polish.js'
];
for (const file of redesignFiles) {
  assert.equal(exists(file), true, `${file} must exist`);
  assert.doesNotThrow(() => new Function(read(file)), `${file} must parse`);
}

const accountUi = read('persistence/account-ui.js');
assert.match(accountUi, /liftovaAuthGate/, 'legacy auth compatibility hook must exist');
assert.match(accountUi, /Sign In/);
assert.match(accountUi, /Sign Up/);
assert.match(accountUi, /cloud\.signIn/);
assert.match(accountUi, /cloud\.signUp/);

const loader = read('supabase-config.js');
for (const file of redesignFiles) assert.match(loader, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${file} must be loaded`);
assert.match(loader, /liftova-functional-fixes\.js\?v=2/);

const home = read('liftova-home.js');
const homeCss = read('liftova-home.css');
assert.match(home, /className='liftova-home-shell'/);
assert.match(home, /data-lh-action="analytics"/);
assert.match(home, /function openAnalytics\(/);
assert.doesNotMatch(home, /observer\.observe\(document\.body/);
assert.match(homeCss, /#home\.liftova-home>:not\(\.liftova-home-shell\)/);

const html = read('index.html');
for (const screen of ['workoutsScreen','workoutScreen','libraryScreen','overallProgressScreen','profileScreen']) assert.match(html, new RegExp(`id=["']${screen}["']`));
assert.match(html, /apple-mobile-web-app-title" content="MYLIFTCOACH"/, 'iOS install title must be MYLIFTCOACH at source');
assert.match(html, /apple-touch-icon[^>]+apple-touch-icon-180\.png\?v=10/, 'HTML Apple icon must use current v10 asset');
assert.match(html, /rel="icon"[^>]+liftova-icon\.svg\?v=10/, 'HTML favicon must use current v10 asset');
assert.match(html, /<title>MYLIFTCOACH · Train · Track · Progress<\/title>/);

const manifest = JSON.parse(read('manifest.json'));
assert.equal(manifest.name, 'MYLIFTCOACH');
assert.equal(manifest.short_name, 'MYLIFTCOACH');
assert.equal(manifest.id, './?app=myliftcoach');
assert.equal(manifest.start_url, './?app=myliftcoach');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.icons.some(item => item.src === 'images/liftova-icon.svg?v=10' && item.type === 'image/svg+xml'), true);
assert.equal(manifest.icons.some(item => item.src === 'images/apple-touch-icon-180.png?v=10' && item.type === 'image/png'), true);

const sw = read('sw.js');
assert.match(sw, /myliftcoach-home-v14-source-rebrand/, 'service worker must use MYLIFTCOACH cache identity');
assert.doesNotMatch(sw, /const CACHE_NAME = ["']liftova-/i, 'service worker cache must not retain old brand identity');
assert.match(sw, /url\.pathname\.includes\("\/liftova-"\)/, 'legacy filenames remain network-first for compatibility');
for (const asset of ['./images/apple-touch-icon-180.png','./images/liftova-icon.svg']) assert.match(sw, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

const functionalFixes = read('liftova-functional-fixes.js');
assert.match(functionalFixes, /showWorkoutSummary/);
assert.match(functionalFixes, /undefined\|NaN/);

const polish = read('liftova-polish.js');
assert.match(polish, /MYLIFTCOACH · Train · Track · Progress/);
assert.match(polish, /const ICON='images\/liftova-icon\.svg\?v=10'/, 'runtime brand asset must use v10');
assert.match(polish, /apple-touch-icon-180\.png\?v=10/, 'runtime Apple touch icon must use v10 PNG');
assert.match(polish, /function updateMenuBrand/);
assert.match(polish, /#sideMenu\{[^}]*position:fixed!important;[^}]*left:0!important;[^}]*background:radial-gradient/);
assert.match(polish, /\.prism-bottom-nav\{[^}]*background:rgba\(7,5,13/);

const pro = read('liftova-pro.js');
assert.match(pro, /MYLIFTCOACH · PRO/, 'Pro hero must use MYLIFTCOACH branding');
assert.doesNotMatch(pro, />\s*(?:PRISM|LIFTOVA)(?:\s|<)/, 'Pro visible markup must not expose a legacy brand');

const progressJs = read('liftova-progress.js');
const progressCss = read('liftova-progress.css');
assert.match(progressJs, /liftova-progress\.css\?v=6/);
assert.match(progressCss, /#overallProgressScreen\{position:relative;color:#f8f5ff!important/);
assert.match(progressCss, /background:#6424d0!important/);

const profile = read('liftova-profile.js');
assert.doesNotMatch(profile, /observe\(document\.documentElement,\{subtree:true,childList:true\}\)/);
assert.match(profile, /el&&el\.textContent!==next/);

console.log('MYLIFTCOACH source rebrand pre-merge checks: OK');
