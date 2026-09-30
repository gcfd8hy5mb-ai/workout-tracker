const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('liftova-reference-v3.js','utf8');
const baseCss=fs.readFileSync('myliftcoach-base.css','utf8');
const html=fs.readFileSync('index.html','utf8');

// Settings/Profile must remain owned by the existing application DOM. The
// presentation layer may mark/clean it, but must never prepend a second shell.
assert.match(source,/function renderSettings\(\)\{/);
assert.match(source,/querySelectorAll\('\.lv3-settings-shell'\)\.forEach\(el=>el\.remove\(\)\)/);
assert.match(source,/classList\.add\('myliftcoach-settings-owned'\)/);
assert.doesNotMatch(source,/prepend\(shell\)/);

// Reject actual creation/assignment of a duplicate Settings shell without
// allowing an unrelated createElement elsewhere in the file to match across
// arbitrary source text into the cleanup selector.
assert.doesNotMatch(source,/createElement\(['"]div['"]\)[^;\n]{0,240}(?:className\s*=\s*['"][^'"]*lv3-settings-shell|classList\.add\([^\n;]*['"]lv3-settings-shell['"])/);
assert.doesNotMatch(source,/\.innerHTML\s*=\s*`[^`]*class=["'][^"']*lv3-settings-shell/);

// Existing functional Profile/Settings controls remain in index.html rather
// than being recreated by the presentation layer.
assert.match(html,/onclick="showPrismPro\(\)"[^>]*>See what Pro can do/);
assert.match(html,/data-beta-mode="free" onclick="setBetaPreview\('free'\)"/);
assert.match(html,/data-beta-mode="pro" onclick="setBetaPreview\('pro'\)"/);

// Canonical visible theme is MYLIFTCOACH dark purple/black.
assert.match(baseCss,/--mlc-purple:#9d46ff/);
assert.match(baseCss,/\.side-menu\{background:#08060d/);
assert.match(baseCss,/header\{background:#08060d/);

console.log('MYLIFTCOACH Settings single-owner DOM, existing Pro/Beta actions, and canonical theme: OK');
