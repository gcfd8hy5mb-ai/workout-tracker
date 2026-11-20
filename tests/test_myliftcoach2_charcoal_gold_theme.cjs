const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('myliftcoach2/charcoal-gold.css','utf8');
const html=fs.readFileSync('myliftcoach2/index.html','utf8');
const finishing=css.slice(css.indexOf('2026-11 iPhone beta: finish'));
test('approved charcoal-and-gold finishing layer is the final linked stylesheet and has a fresh URL',()=>{
 const links=[...html.matchAll(/<link\s+[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0]);
 assert.match(links.at(-1),/charcoal-gold\.css\?v=3/);
 assert.match(html,/<meta name="theme-color" content="#10161b">/);
 assert.ok(finishing.length>1000);
});
test('iPhone-specific legacy teal components have explicit slate overrides',()=>{
 for(const selector of ['#home .hero','.bottom-tabs','.topbar','.quick-grid button','.modal-panel']){
  assert.ok(finishing.includes(selector),selector+' missing slate override');
 }
 assert.match(finishing,/@media\(max-width:760px\)/);
 for(const value of ['#10161b','#151d23','#293339','#e8bc74']){
  assert.ok(finishing.includes(value),value+' expected palette');
 }
});
