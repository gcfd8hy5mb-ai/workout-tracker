const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>err?res.writeHead(404).end():res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(data));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const base='http://127.0.0.1:'+server.address().port;
  await page.route('https://*/**',route=>route.abort());
  await page.goto(base+'/launch-check.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#result')?.textContent?.includes('account-ui.js:'),null,{timeout:10000});
  const check=await page.locator('#result').innerText();
  assert.match(check,/app.html: 200 \/ workout document/);
  assert.match(check,/account-ui.js: 200 \/ script response/);
  await page.goto(base+'/app.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(2500);
  const snapshot=await page.evaluate(()=>({gate:!!document.getElementById('liftovaAuthGate'),recovery:!!document.getElementById('mlcBootRecovery'),owner:window.PRISMDeviceStore?.owner??null,bodyText:document.body?.innerText?.slice(0,350)}));
  fs.mkdirSync(path.join(root,'artifacts','luxury-preview'),{recursive:true});
  await page.screenshot({path:path.join(root,'artifacts/luxury-preview/integrated-login.png')});
  assert.equal(snapshot.owner,null,'test must start without a signed-in user');
  assert.ok(snapshot.gate,'guest startup must show the integrated login gate');
  assert.ok(!snapshot.recovery,'guest startup must not show a boot failure');
  assert.equal(await page.locator('#liftovaAuthGate').isVisible(),true,'login must be visible on iPhone');
  assert.deepEqual(errors,[],'startup must not throw JS exceptions');
  console.log('PASS integrated iPhone guest startup',JSON.stringify(snapshot));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
