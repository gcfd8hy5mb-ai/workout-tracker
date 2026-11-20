const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('myliftcoach2/index.html','utf8');
const approved=fs.readFileSync('myliftcoach2/premium-reference.css','utf8');
const refinement=fs.readFileSync('myliftcoach2/approved-refinement.css','utf8');

test('approved November emerald marble replaces charcoal skin as final stylesheet',()=>{
 const links=[...html.matchAll(/<link\\s+[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0]);
 assert.match(links.at(-1),/approved-refinement\\.css\\?v=12/);
 assert.match(html,/premium-reference\\.css\\?v=20/);
 assert.doesNotMatch(html,/charcoal-gold\\.css/);
 assert.match(html,/<meta name="theme-color" content="#06454c">/);
});
test('video-approved reference CSS references original gold-veined marble and photo assets',()=>{
 assert.match(approved,/approved-vertical-marble-sharp\\.webp/);
 assert.match(approved,/hero-dumbbells-photo\\.jpg/);
 assert.match(refinement,/approved-vertical-marble-sharp\\.webp/);
 assert.match(approved,/#library \\.library-card/);
 assert.match(approved,/\\.bottom-tabs/);
 assert.match(refinement,/\\.topbar/);
});
