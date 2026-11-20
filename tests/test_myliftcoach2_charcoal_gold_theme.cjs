const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('myliftcoach2/index.html','utf8');
const approved=fs.readFileSync('myliftcoach2/premium-reference.css','utf8');
const refinement=fs.readFileSync('myliftcoach2/approved-refinement.css','utf8');
const consistent=fs.readFileSync('myliftcoach2/fixed-marble-card-consistency.css','utf8');

test('approved November emerald marble replaces charcoal skin as final stylesheet',()=>{
 const links=[...html.matchAll(/<link\s+[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0]);
 assert.match(links.at(-1),/fixed-marble-card-consistency\.css\?v=4/);
 assert.match(html,/approved-home-rebuild\.css\?v=21/);
 assert.match(html,/<section id="home" class="page home-rebuilt">/);
 assert.match(html,/id="homeWeekBoardDetails"/);
 assert.match(html,/id="homeMenuBtn"/);
 assert.match(html,/id="homeAccountBtn"/);
 assert.doesNotMatch(html,/<link[^>]+approved-video-fidelity\.css/);
 assert.match(html,/premium-reference\.css\?v=20/);
 assert.doesNotMatch(html,/charcoal-gold\.css/);
 assert.match(html,/<meta name="theme-color" content="#06454c">/);
});
test('video-approved reference CSS references original gold-veined marble and photo assets',()=>{
 assert.match(approved,/approved-vertical-marble-sharp\.webp/);
 assert.match(approved,/hero-dumbbells-photo\.jpg/);
 assert.match(refinement,/approved-vertical-marble-sharp\.webp/);
 assert.match(approved,/#library \.library-card/);
 assert.match(approved,/\.bottom-tabs/);
 assert.match(refinement,/\.topbar/);
 assert.match(consistent,/body::before,body:has\(#home:not\(\[hidden\]\)\)::before/);
 assert.match(consistent,/position:fixed/);
 assert.match(consistent,/approved-vertical-marble-sharp\.webp/);
 assert.match(consistent,/\.page:not\(#home\):not\(#welcome\) \.library-card/);
});
