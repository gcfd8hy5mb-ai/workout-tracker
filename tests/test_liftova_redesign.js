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
const loadedRedesignFiles = redesignFiles.filter(file => file !== 'liftova-home.js');
for (const file of loadedRedesignFiles) {
  assert.match(loader, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${file} must be loaded`);
}
assert.doesNotMatch(loader, /['"]liftova-home\.js(?:\?[^'"]*)?['"]/, 'legacy duplicate Home overlay must not be loaded');

const html = read('index.html');
for (const screen of ['workoutsScreen','workoutScreen','libraryScreen','overallProgressScreen','profileScreen']) {
  assert.match(html, new RegExp(`id=["']${screen}["']`), `${screen} must remain in the base app`);
}

const manifest = JSON.parse(read('manifest.json'));
assert.equal(manifest.short_name, 'LIFTOVA');
assert.match(manifest.name, /^LIFTOVA/);
assert.equal(manifest.display, 'standalone');
assert.equal(
  manifest.icons.some(item => item.src === 'images/liftova-icon.svg' && item.type === 'image/svg+xml'),
  true,
  'LIFTOVA manifest icon must be present'
);

const sw = read('sw.js');
assert.match(sw, /prism-v10\.3-beta40\.7-liftova/, 'LIFTOVA release must advance the compatible cache namespace');
assert.match(sw, /url\.pathname\.includes\("\/liftova-"\)/, 'LIFTOVA presentation assets must use network-first refresh');
for (const asset of [
  './images/app-icon-192.png',
  './images/app-icon-512.png',
  './images/app-icon.png',
  './images/apple-touch-icon-180.png',
  './images/favicon-32.png',
  './images/liftova-icon.svg',
  './images/liftova-splash.svg'
]) {
  assert.match(sw, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${asset} must be cached or refreshed by the service worker`);
}

const polish = read('liftova-polish.js');
assert.match(polish, /LIFTOVA · Train · Track · Progress/, 'document title must be rebranded');
assert.match(polish, /apple-mobile-web-app-title/, 'iOS installed-app title must be rebranded');

const profile = read('liftova-profile.js');
assert.doesNotMatch(profile, /observe\(document\.documentElement,\{subtree:true,childList:true\}\)/, 'Profile must not observe the whole document');
assert.match(profile, /el\.textContent!==next/, 'Profile summary updates must be idempotent');

console.log('LIFTOVA redesign pre-merge smoke checks: OK');
