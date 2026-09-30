const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('liftova-polish.js','utf8');
const baseCss=fs.readFileSync('myliftcoach-base.css','utf8');
const html=fs.readFileSync('index.html','utf8');

// Settings/Profile must remain owned by the existing application DOM. The
// current presentation layer may brand/clean it, but must never create or
// prepend a second Settings shell.
assert.match(source,/function cleanNode\(root=document\.body\)/);
assert.match(source,/function watchScreen\(id\)/);
assert.doesNotMatch(source,/prepend\(shell\)/);
assert.doesNotMatch(source,/lv3-settings-shell/);

// Reject actual creation/assignment of a duplicate Settings shell.
assert.doesNotMatch(source,/createElement\(['"]div['"]\)[^;\n]{0,240}(?:className\s*=\s*['"][^'"]*settings-shell|classList\.add\([^\n;]*['"][^'"]*settings-shell['"])/i);
assert.doesNotMatch(source,/\.innerHTML\s*=\s*`[^`]*class=["'][^"']*settings-shell/i);

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
