const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../myliftcoach2/app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../myliftcoach2/index.html'),'utf8');
const preflight=fs.readFileSync(path.join(__dirname,'../myliftcoach2/v2-readonly-preflight.js'),'utf8');
test('readiness control only checks authenticated session and read-only RPC',()=>{
 const start=app.indexOf('async function runCloudReadinessCheck()');
 const end=app.indexOf('function renderSettings()',start);
 assert.ok(start>=0&&end>start);
 const body=app.slice(start,end);
 assert.match(body,/authRequest\('user',null,token,'GET'\)/);
 assert.match(body,/\/rest\/v1\/rpc\/prism_v2_schedule_read/);
 assert.doesNotMatch(body,/prism_v2_schedule_save|prism_apply_account_batch|localStorage\.setItem|method:\s*'PUT'|method:\s*'PATCH'/);
 assert.match(preflight,/canWrite:false,readOnly:true/);
});
test('settings button and dependencies included exactly once',()=>{
 assert.equal((html.match(/id="cloudReadinessButton"/g)||[]).length,1);
 assert.equal((html.match(/src="\.\/v2-readonly-preflight\.js\?v=1"/g)||[]).length,1);
 assert.ok(html.indexOf('v2-readonly-preflight.js')<html.indexOf('src="./app.js'));
 assert.match(html,/No workout data is uploaded or saved/);
});
