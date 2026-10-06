const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';
  const target=path.resolve(root,filename);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(target,(error,content)=>error?res.writeHead(404).end():res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'}).end(content));
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>localStorage.setItem('prismJourneyV1',JSON.stringify({status:'complete',mode:'local',step:6,draft:{}})));
    await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* startup guest fixture */'}));
    const url=`http://127.0.0.1:${server.address().port}/`;
    for(const launch of ['cold','refresh','returning']){
      if(launch==='cold')await page.goto(url,{waitUntil:'domcontentloaded'});
      else if(launch==='refresh')await page.reload({waitUntil:'domcontentloaded'});
      else await page.goto(url,{waitUntil:'domcontentloaded'});
      const menu=page.locator('#home:not(.hidden) .liftova-home-shell .lh-hero-menu');
      await menu.waitFor({state:'visible',timeout:15000});
      await page.waitForFunction(()=>!document.documentElement.classList.contains('myliftcoach-starting'),null,{timeout:5000});
      const before=await page.evaluate(()=>{
        const shell=document.querySelector('#home .liftova-home-shell'),card=shell?.querySelector('.lh-workout'),logo=shell?.querySelector('.lh-hero-mark img'),button=shell?.querySelector('.lh-hero-menu');
        window.__startupNodes={shell,card,logo};
        const box=button.getBoundingClientRect(),hit=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
        return {trace:window.MYLIFTCOACHStartupTrace?.events,hit:hit===button||button.contains(hit),logoLoaded:logo?.complete&&logo.naturalWidth>0,buttonEnabled:!button?.disabled};
      });
      assert.ok(before.hit&&before.buttonEnabled,`${launch}: no loading overlay or disabled state may intercept Home menu`);
      assert.ok(before.logoLoaded,`${launch}: logo must be decoded when Home is interactive`);
      assert.ok(before.trace?.some(e=>e.name==='home-mounted')&&before.trace?.some(e=>e.name==='home-interactive'),`${launch}: startup timing marks must identify mount and reveal`);
      const started=Date.now();await menu.click();await page.locator('#sideMenu.open').waitFor({timeout:1000});
      const tapMs=Date.now()-started;
      assert.ok(tapMs<500,`${launch}: first Home tap took ${tapMs}ms after Home became interactive`);
      await page.locator('#sideMenu .menu-close').click();
      if(launch==='cold')await page.evaluate(()=>{
        const id=exerciseLibrary[0].id,weekday=(new Date().getDay()+6)%7;
        localStorage.setItem('customWorkoutsV5',JSON.stringify([{id:'qa-startup',name:'QA Workout',exercises:[id]}]));
        localStorage.setItem('myliftcoachWeeklyDayOverridesV1',JSON.stringify({[weekday]:{name:'QA Workout',ids:[id]}}));
      });
      await page.evaluate(()=>goHome());
      await page.waitForTimeout(500);
      const after=await page.evaluate(()=>({sameShell:window.__startupNodes.shell===document.querySelector('#home .liftova-home-shell'),sameCard:window.__startupNodes.card===document.querySelector('#home .lh-workout'),sameLogo:window.__startupNodes.logo===document.querySelector('#home .lh-hero-mark img'),cover:!!document.getElementById('myliftcoachStartupCover'),accountGate:document.documentElement.classList.contains('prism-account-booting')}));
      assert.deepEqual(after,{sameShell:true,sameCard:true,sameLogo:true,cover:false,accountGate:false},`${launch}: Home and workout card must stay mounted`);
      if(launch==='cold')assert.match(await page.locator('#home .lh-workout h2').textContent(),/QA WORKOUT/, 'in-place card must reflect changed schedule');
      console.log(`[startup ${launch}] first menu tap ${tapMs}ms; trace ${JSON.stringify(before.trace)}`);
    }
    assert.deepEqual(errors,[],'startup must not throw');
    await context.close();
    console.log('MYLIFTCOACH iPhone Home cold, refresh, returning session, first tap, stable logo/card PASS');
  }finally{await browser.close();server.close()}
})().catch(error=>{server.close();console.error(error);process.exitCode=1});
