const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');
const js = read('liftova-reference-v3.js');
const css = read('liftova-reference-v3.css');
const base = read('myliftcoach-base.css');
const loader = read('supabase-config.js');
const sw = read('sw.js');

assert.doesNotThrow(() => new Function(js), 'canonical presentation JS must parse');
assert.ok(css.length > 12000, 'reference stylesheet must contain the full visual system');
assert.ok(base.length > 1000, 'MYLIFTCOACH base chrome stylesheet must be present');
assert.match(loader, /liftova-reference-v3\.js\?v=1/, 'canonical presentation layer must be loaded');
assert.ok(loader.indexOf('liftova-reference-v3.js?v=1') > loader.indexOf('liftova-polish.js?v=7'), 'canonical presentation layer must load after older presentation modules');
assert.match(sw, /url\.pathname\.includes\("\/liftova-"\)/, 'legacy-named presentation assets must remain network-first for cache-safe iOS/PWA delivery');

// Home remains owned by the canonical renderer and must retain the primary workout path.
for (const marker of ['lv3-home-hero','lv3-week-strip','lv3-today-card','lv3-home-grid']) {
  assert.match(js, new RegExp(marker), `Home must render ${marker}`);
  assert.match(css, new RegExp(marker), `Home must style ${marker}`);
}
assert.match(js, /TODAY’S WORKOUT/, 'Home must contain Today’s Workout hierarchy');
assert.match(js, /WEEKLY PROGRESS/, 'Home must contain weekly progress');
assert.match(js, /WORKOUT STREAK/, 'Home must contain workout streak');
assert.match(js, /THIS WEEK/, 'Home must contain this-week analytics');
assert.match(js, /MYLIFTCOACH/, 'visible canonical branding must be MYLIFTCOACH');

// Approved five-item navigation labels remain available.
for (const label of ["'Home'","'Workout'","'Log'","'Progress'","'Settings'"]) {
  assert.match(js, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `bottom navigation must include ${label}`);
}

// Workout detail renderer is functional and must not be removed during chrome consolidation.
for (const marker of ['lv3-detail-top','lv3-tabs','lv3-workout-metrics','lv3-exercise-row','lv3-set-box','lv3-start-workout']) {
  assert.match(js, new RegExp(marker), `Workout detail must render ${marker}`);
}
assert.match(js, /LiftovaAnatomy\?\.render\?\.\(ex/, 'workout rows use the shared anatomy renderer when available');
assert.match(js, /LiftovaAnatomy\?\.profile\(ex\)/, 'target labels use the per-exercise anatomy map');
assert.match(js, /Rest \$\{scheme\.rest\}/, 'each exercise row must show a rest prescription');

// Root consolidation invariant: Settings/Profile has one owner. The canonical V3 layer may
// clean up stale shells, but it must never create/prepend a second settings shell.
assert.doesNotMatch(js, /insertAdjacentHTML\([^\n]*lv3-settings-shell/, 'canonical renderer must not inject a competing Settings shell');
assert.doesNotMatch(js, /prepend\([^\n]*lv3-settings-shell/, 'canonical renderer must not prepend a competing Settings shell');
assert.match(js, /querySelectorAll\('\.lv3-settings-shell'\)/, 'canonical renderer must clean up any stale duplicate Settings shell');
assert.match(js, /myliftcoach-settings-owned/, 'Profile/Settings must be marked as MYLIFTCOACH-owned');

// Root theme must be dark MYLIFTCOACH purple/black, not the old light/blue chrome.
assert.match(base, /--mlc-purple/i, 'base chrome must define the MYLIFTCOACH purple token');
assert.match(base, /#0/i, 'base chrome must contain dark/black surfaces');

// iOS stability: no full-document child-list mutation observers in the canonical layer.
assert.doesNotMatch(js, /observe\(document\.(?:body|documentElement).*childList/s, 'canonical layer must not use document-wide child-list observers');

console.log('MYLIFTCOACH consolidated presentation ownership, workout detail, navigation and cache-safety checks: OK');
