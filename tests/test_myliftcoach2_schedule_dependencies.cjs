const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../myliftcoach2/index.html'),'utf8');
const scripts=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
const pos=name=>scripts.findIndex(s=>s.endsWith('/'+name+'.js'));
test('schedule dependencies load before consumer modules',()=>{
 for(const module of ['custom-schedule-copy','recurring-draft','v2-recurring-schedule'])assert.ok(pos('weekly-schedule')<pos(module),module+' loaded before weekly dependency');
 assert.ok(pos('original-custom-schedule')<pos('custom-schedule-copy'));
 assert.ok(pos('original-custom-schedule')<pos('v2-recurring-schedule'));
 assert.ok(pos('v2-recurring-schedule')<pos('recurring-draft'));
 assert.ok(pos('recurring-draft')<pos('app'));
});
test('schedule script references appear exactly once',()=>{
 for(const name of ['weekly-schedule','original-custom-schedule','custom-schedule-copy','v2-recurring-schedule','recurring-draft','app'])assert.equal(scripts.filter(x=>x.endsWith('/'+name+'.js')).length,1);
});
