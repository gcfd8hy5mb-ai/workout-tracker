const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');
const loader = read('supabase-config.js');
const home = read('liftova-home.js');
const polish = read('liftova-polish.js');
const pro = read('liftova-pro.js');
const sw = read('sw.js');

// Root architectural contract: there is exactly one live presentation tree.
// reference-v3 is a retired full-screen renderer and must never be booted by
// production. Loading it recreates legacy Home/chrome underneath the current UI.
assert.doesNotMatch(loader, /liftova-reference-v3\.js/i,
  'retired reference-v3 renderer must not be part of the runtime source list');
assert.match(loader, /liftova-home\.js\?v=12/,
  'canonical Home renderer must be loaded');
assert.match(loader, /liftova-polish\.js\?v=9/,
  'final MYLIFTCOACH presentation layer must be loaded');

const sources = loader.match(/const sources=\[([^\]]+)\]/s);
assert.ok(sources, 'runtime source list must exist');
assert.equal((sources[1].match(/liftova-home\.js/g) || []).length, 1,
  'canonical Home renderer must be loaded exactly once');
assert.equal((sources[1].match(/liftova-polish\.js/g) || []).length, 1,
  'MYLIFTCOACH presentation layer must be loaded exactly once');
assert.ok(loader.indexOf('liftova-polish.js?v=9') > loader.indexOf('liftova-home.js?v=12'),
  'final MYLIFTCOACH presentation layer must run after canonical Home');

// Current presentation owns branding directly. No legacy renderer is allowed to
// supply LIFTOVA/PRISM chrome that is later covered or renamed.
assert.match(home + polish, /MYLIFTCOACH/i,
  'current presentation path must contain MYLIFTCOACH branding');
assert.match(pro, /MYLIFTCOACH/i,
  'Pro presentation must contain MYLIFTCOACH branding directly');
assert.doesNotMatch(pro, /#00b8ff|#19c6ff|rgb\(0\s*,\s*184\s*,\s*255\)/i,
  'Pro must not restore the retired cyan/PRISM-era accent palette');

// Keep cache-safe iOS/PWA delivery for active LIFTOVA-named compatibility files
// while the filenames are migrated independently from presentation ownership.
assert.match(sw, /url\.pathname\.includes\("\/liftova-"\)/,
  'active compatibility assets must remain network-first for iOS/PWA delivery');

console.log('Single presentation root, MYLIFTCOACH ownership, and legacy-renderer exclusion checks: OK');
