const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');
const js = read('liftova-reference-v3.js');
const css = read('liftova-reference-v3.css');
const loader = read('supabase-config.js');
const sw = read('sw.js');

assert.doesNotThrow(() => new Function(js), 'reference-match JS must parse');
assert.ok(css.length > 12000, 'reference-match stylesheet must contain the full visual system');
assert.match(loader, /liftova-reference-v3\.js\?v=1/, 'reference-match layer must be loaded');
assert.ok(loader.indexOf('liftova-reference-v3.js?v=1') > loader.indexOf('liftova-polish.js?v=7'), 'reference-match layer must load after the existing presentation modules');
assert.match(sw, /url\.pathname\.includes\("\/liftova-"\)/, 'all LIFTOVA assets must remain network-first for cache-safe iOS/PWA delivery');

// Home reference: cinematic hero, seven-day plan, workout hero, analytics and quick actions.
for (const marker of ['lv3-home-hero','lv3-week-strip','lv3-today-card','lv3-home-grid','lv3-quick-actions']) {
  assert.match(js, new RegExp(marker), `Home must render ${marker}`);
  assert.match(css, new RegExp(marker), `Home must style ${marker}`);
}
assert.match(js, /TODAY’S WORKOUT/, 'Home must contain the approved Today’s Workout hierarchy');
assert.match(js, /WEEKLY PROGRESS/, 'Home must contain weekly progress');
assert.match(js, /WORKOUT STREAK/, 'Home must contain workout streak');
assert.match(js, /RECENT PERFORMANCE/, 'Home must contain recent performance');
assert.match(js, /THIS WEEK/, 'Home must contain this-week analytics');

// Approved five-item navigation order / labels.
for (const label of ["'Home'","'Workout'","'Log'","'Progress'","'Settings'"]) {
  assert.match(js, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `bottom navigation must include ${label}`);
}
assert.match(js, /insertBefore\(historyBtn,progress\)/, 'Log must be ordered before Progress');

// Workout detail reference and anatomical muscle groups.
for (const marker of ['lv3-detail-top','lv3-tabs','lv3-workout-metrics','lv3-exercise-row','lv3-set-box','lv3-start-workout']) {
  assert.match(js, new RegExp(marker), `Workout detail must render ${marker}`);
}
assert.match(js, /LiftovaAnatomy\.render\(ex/, 'workout details and rows use the shared premium anatomy renderer');
assert.match(js, /LiftovaAnatomy\?\.profile\(ex\)/, 'target labels use the per-exercise anatomy map');
assert.match(js, /Rest \$\{scheme\.rest\}/, 'each exercise row must show a rest prescription');

// Exercise guide reference: Overview, How To, Muscles and History.
for (const panel of ['overview','howto','muscles','history']) {
  assert.match(js, new RegExp(`data-panel=\\"${panel}\\"`), `exercise guide must include ${panel}`);
}
assert.match(js, /Adjust the seat/, 'exercise how-to must include step-by-step setup detail');
assert.match(js, /PERFORMANCE HISTORY/, 'exercise detail must include performance history');

// Progress + settings reference layouts.
for (const target of ['overview','strength','volume','body']) assert.match(js, new RegExp(`data-progress-target="${target}"`), `Progress must expose the ${target} tab`);
for (const setting of ['My Profile','Units','Rest Timer','Theme','Notifications']) assert.match(js, new RegExp(setting), `Settings must include ${setting}`);

// iOS stability: no full-document child-list mutation observers in the new reference layer.
assert.doesNotMatch(js, /observe\(document\.(?:body|documentElement).*childList/s, 'reference-match layer must not use document-wide child-list observers');

console.log('LIFTOVA reference-match v3 structure, anatomy, navigation and cache-safety checks: OK');
