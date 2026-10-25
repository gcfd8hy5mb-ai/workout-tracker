const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(data);});
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__themeChanges=[];const original=Element.prototype.setAttribute;Element.prototype.setAttribute=function(name,value){if(this.tagName==='META'&&this.getAttribute('name')==='theme-color'&&name==='content'){window.__themeChanges.push({value,stack:new Error().stack});}return original.apply(this,arguments);};});
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(1500);
  fs.mkdirSync(path.join(root,'artifacts','luxury-preview'),{recursive:true});
  await page.screenshot({path:path.join(root,'artifacts','luxury-preview','iphone-first-launch.png'),fullPage:false});
  // Do not load large coach/workout runtimes while sign-in is visible.
  const configScript=fs.readFileSync(path.join(root,'supabase-config.js'),'utf8');
  assert.ok(configScript.includes('if (!window.PRISMDeviceStore?.owner) return;'),
    'the sign-in screen must defer heavyweight workout and coach scripts');
  const startupScript=fs.readFileSync(path.join(root,'myliftcoach-startup-smooth.js'),'utf8');
  const startupCss=fs.readFileSync(path.join(root,'myliftcoach-startup-smooth.css'),'utf8');
  assert.ok(startupScript.includes('setTimeout(showBootFailure,12000)'), 'stalled startup must expose a recovery surface');
  assert.ok(startupCss.includes(':not(#mlcStartupFailure)'), 'the startup mask must not hide its recovery surface');
  assert.ok(startupScript.includes("!document.getElementById('liftovaAuthGate')"), 'do not load owner admin tools while signing in');
  // The isolated login document must not load the legacy account gate.
  const loginHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(loginHtml.includes("await verifyAccount("), 'sign-in must verify the account before opening workouts');
  assert.ok(loginHtml.includes("OPEN MY WORKOUTS"), 'provide an actionable iPhone navigation fallback');
  assert.ok(!loginHtml.includes('persistence/account-ui.js'), 'login must not boot the full workout account gate');
  // The full app restores identity after load: recovery must stop when the
  // account gate clears, not just when the document load event fires.
  const html=fs.readFileSync(path.join(root,'app.html'),'utf8');
  assert.ok(html.includes("recovery.id='mlcBootRecovery'"), 'startup must offer recovery on genuine timeout');
  assert.ok(html.includes("const mlcBootGateObserver=new MutationObserver("), 'observe asynchronous account boot completion');
  assert.ok(html.includes('mlcBootGateObserver.disconnect()'), 'disconnect boot observer after verification');
  assert.ok(html.includes('mlcBootFinished=true'), 'cancel false startup failure after successful boot');
    const theme=await page.locator('meta[name="theme-color"]').getAttribute('content');
  const initialTheme=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<meta name="theme-color" content="([^"]+)"/)[1];
  const icon=await page.locator('link[rel="icon"]').getAttribute('href');
  const themeChanges=await page.evaluate(()=>window.__themeChanges||[]);
  console.log('THEME_DIAGNOSTIC',JSON.stringify({initialTheme,theme,themeChanges}));
  assert.equal(initialTheme,'#003b49','initial HTML theme must match luxury palette');
  assert.equal(theme,'#003b49','runtime must not restore the legacy theme');
  assert.deepEqual(themeChanges.filter(change=>change.value!=='#003b49'),[],
    'no runtime theme-color mutation may flash a legacy palette');
  assert.ok(icon.includes('myliftcoach-icon.svg'), 'favicon must use the MYLIFTCOACH brand icon');
  console.log(JSON.stringify({initialTheme,theme,icon,visibleText:(await page.locator('body').innerText()).slice(0,400),errors:errors.slice(0,8)}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
