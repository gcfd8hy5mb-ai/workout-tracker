const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');
const exists = path => fs.existsSync(path);

const redesignFiles = [
  'liftova-onboarding.js',
  'liftova-home.js',
  'liftova-workouts.js',
  'liftova-active-workout.js',
  'liftova-library.js',
  'liftova-progress.js',
  'liftova-profile.js',
  'liftova-pro.js',
  'liftova-polish.js'
];

for (const file of redesignFiles) {
  assert.equal(exists(file), true, `${file} must exist`);
  assert.doesNotThrow(() => new Function(read(file)), `${file} must parse`);
}

const accountUi = read('persistence/account-ui.js');
assert.match(accountUi, /liftovaAuthGate/, 'LIFTOVA auth gate must exist');
assert.match(accountUi, /Sign In/, 'Sign In must be present');
assert.match(accountUi, /Sign Up/, 'Sign Up must be present');
assert.match(accountUi, /cloud\.signIn/, 'Existing Supabase sign-in path must remain wired');
assert.match(accountUi, /cloud\.signUp/, 'Existing Supabase sign-up path must remain wired');

const loader = read('supabase-config.js');
for (const file of redesignFiles) {
  assert.match(loader, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${file} must be loaded`);
}

const home = read('liftova-home.js');
const homeCss = read('liftova-home.css');
assert.match(home, /className='liftova-home-shell'/, 'LIFTOVA Home shell must be mounted');
assert.doesNotMatch(home, /observer\.observe\(document\.body/, 'Home must not use a document-wide MutationObserver');
assert.match(homeCss, /#home\.liftova-home>:not\(\.liftova-home-shell\)/, 'Legacy Home presentation must be hidden behind the LIFTOVA Home shell');

const html = read('index.html');
for (const screen of ['workoutsScreen','workoutScreen','libraryScreen','overallProgressScreen','profileScreen']) {
  assert.match(html, new RegExp(`id=["']${screen}["']`), `${screen} must remain in the base app`);
}

const manifest = JSON.parse(read('manifest.json'));
assert.equal(manifest.short_name, 'LIFTOVA');
assert.match(manifest.name, /^LIFTOVA/);
assert.equal(manifest.display, 'standalone');
assert.equal(
  manifest.icons.some(item => item.src === 'images/apple-touch-icon-180.png?v=6' && item.type === 'image/png'),
  true,
  'LIFTOVA PNG install icon must be present'
);

const sw = read('sw.js');
assert.match(sw, /liftova-home-v12-approved-compact/, 'LIFTOVA compact Home release must use the new cache namespace');
assert.match(sw, /url\.pathname\.includes\("\/liftova-"\)/, 'LIFTOVA presentation assets must use network-first refresh');
for (const asset of [
  './images/apple-touch-icon-180.png',
  './images/liftova-icon.svg'
]) {
  assert.match(sw, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${asset} must be cached or refreshed by the service worker`);
}

const polish = read('liftova-polish.js');
assert.match(polish, /LIFTOVA · Train · Track · Progress/, 'document title must be rebranded');
assert.match(polish, /apple-mobile-web-app-title/, 'iOS installed-app title must be rebranded');
assert.match(polish, /function updateMenuBrand/, 'Navigation drawer must receive explicit LIFTOVA branding');
assert.match(polish, /#sideMenu\{[^}]*position:fixed!important;[^}]*left:0!important;[^}]*background:radial-gradient/, 'Navigation drawer must remain a fixed left-side LIFTOVA drawer');
assert.match(polish, /\.prism-bottom-nav\{[^}]*background:rgba\(7,5,13/, 'Bottom navigation must use the LIFTOVA visual system');

const progressJs = read('liftova-progress.js');
const progressCss = read('liftova-progress.css');
assert.match(progressJs, /liftova-progress\.css\?v=6/, 'Progress styles must be cache-busted');
assert.match(progressCss, /#overallProgressScreen\{position:relative;color:#f8f5ff!important/, 'Progress screen must use canonical dark LIFTOVA styling');
assert.match(progressCss, /background:#6424d0!important/, 'Progress period control must use LIFTOVA purple treatment');

const profile = read('liftova-profile.js');
assert.doesNotMatch(profile, /observe\(document\.documentElement,\{subtree:true,childList:true\}\)/, 'Profile must not observe the whole document');
assert.match(profile, /el&&el\.textContent!==next/, 'Profile summary updates must be idempotent');

console.log('LIFTOVA redesign pre-merge smoke checks: OK');
