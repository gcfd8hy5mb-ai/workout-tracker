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
  // Login regression: a verified sign-in must bootstrap scoped data on a new
  // document, not strip the gate and expose uninitialized legacy app state.
  const accountUi=fs.readFileSync(path.join(root,'persistence/account-ui.js'),'utf8');
  const loginPath=accountUi.slice(accountUi.indexOf("if(mode==='signin'){stage("),accountUi.indexOf("return;}else{const result=await cloud.signUp"));
  assert.ok(loginPath.includes('manager.select(signedIn.user.id)'), 'verified user must select scoped storage');
  assert.ok(loginPath.includes('location.replace(next)'), 'verified sign-in must reload account-scoped state');
  assert.ok(!loginPath.includes('gate.remove()'), 'login gate must remain during navigation');
  assert.ok(loginPath.includes('automatic navigation did not complete'), 'iPhone navigation must expose a recovery status');
  assert.ok(loginPath.includes('continueLink.focus'), 'iPhone navigation fallback must remain actionable');
  assert.ok(!loginPath.includes("classList.remove('liftova-auth-locked')"), 'do not expose legacy shell before reload');
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
