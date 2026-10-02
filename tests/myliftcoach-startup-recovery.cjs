const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname;if(p==='/myliftcoach-startup-smooth.js'){res.writeHead(200,{'content-type':'application/javascript'});res.end(fs.readFileSync(path.join(root,'myliftcoach-startup-smooth.js')));return;}res.writeHead(404).end();});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent(`<!doctype html><html class="prism-account-booting"><head></head><body><div id="home"><div class="liftova-home-shell">Canonical Home</div></div><script>
    window.__identityCalls=0;
    window.PRISMDeviceStore={owner:'user-a'};
    window.PRISMCloud={currentUser(){window.__identityCalls++;if(window.__identityCalls===1)return new Promise(()=>{});return Promise.resolve({id:'user-a'});}};
  <\/script><script src="http://127.0.0.1:${server.address().port}/myliftcoach-startup-smooth.js"></script></body></html>`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.documentElement.classList.contains('myliftcoach-starting'),null,{timeout:5000});
  assert.ok(await page.evaluate(()=>window.__identityCalls>=2),'Startup must retry a stalled identity check');
  assert.equal(await page.locator('#myliftcoachStartupCover').count(),0,'Startup cover must be removed after verified recovery');
  assert.equal(await page.locator('#home .liftova-home-shell').count(),1,'Canonical Home must remain mounted before reveal');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('prism-account-booting')),false,'Verified owner must clear account boot gate');
  console.log('MYLIFTCOACH startup recovery PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
