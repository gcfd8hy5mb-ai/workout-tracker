const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

const manifest=JSON.parse(read('manifest.json'));
const loader=read('supabase-config.js');
const brand=read('myliftcoach-brand.js');
const icon=read('images/myliftcoach-icon.svg');

assert.equal(manifest.name,'MYLIFTCOACH');
assert.equal(manifest.short_name,'MYLIFTCOACH');
assert.equal(manifest.icons.some(i=>i.src==='images/myliftcoach-icon.svg?v=21'),true,'manifest must use canonical MYLIFTCOACH icon');
assert.match(loader,/window\.MYLIFTCOACH_SUPABASE_CONFIG/,'canonical Supabase namespace must be MYLIFTCOACH');
assert.doesNotMatch(loader,/myliftcoach-brand\.js\?v=21/,'presentation loader must not depend on a DOM rewrite brand guard');
assert.match(brand,/const BRAND='MYLIFTCOACH'/);
assert.match(brand,/const ICON='images\/myliftcoach-icon\.svg\?v=21'/);
assert.doesNotMatch(brand,/MutationObserver|TreeWalker|replaceLegacy/i,'brand module must not rewrite rendered DOM');
assert.match(icon,/aria-label="MYLIFTCOACH app icon"/);
assert.match(icon,/>MY</);
assert.match(icon,/>LIFT</);
assert.match(icon,/>COACH</);
console.log('MYLIFTCOACH canonical branding lock: OK');
