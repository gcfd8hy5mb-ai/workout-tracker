const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{const filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';const target=path.resolve(root,filename);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(error,content)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'}).end(content);});});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* guest final-readiness fixture */'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof goHome==='function'&&typeof showWorkouts==='function'&&typeof showOverallProgress==='function'&&typeof showProfile==='function'&&window.MYLIFTCOACHBrandSafety);
  const visibleLegacy=async()=>page.evaluate(()=>{
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const hits=[];let node;
    while((node=walker.nextNode())){
      const text=(node.nodeValue||'').trim();if(!text||!/\b(?:LIFTOVA|PRISM)\b/.test(text))continue;
      const el=node.parentElement;if(!el)continue;const style=getComputedStyle(el),r=el.getBoundingClientRect();
      if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||r.width===0||r.height===0)continue;
      hits.push(text);
    }
    return hits;
  });
  const check=async(label,open)=>{await page.evaluate(open);await page.waitForTimeout(120);const hits=await visibleLegacy();assert.deepEqual(hits,[],`${label} must not expose legacy LIFTOVA/PRISM branding: ${hits.join(' | ')}`);const geo=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert.ok(geo.sw<=geo.w+2,`${label} must not horizontally overflow iPhone viewport: ${JSON.stringify(geo)}`);};
  const forceDeepRootScroll=async()=>page.evaluate(()=>{showProfile();document.getElementById('myliftcoachScrollFixture')?.remove();const spacer=document.createElement('div');spacer.id='myliftcoachScrollFixture';spacer.style.height='1800px';document.getElementById('profileScreen').appendChild(spacer);window.scrollTo(0,1200);});

  await check('Home',()=>goHome());
  await check('Workouts',()=>showWorkouts());
  await check('Progress/Coach',()=>showOverallProgress());
  const coachText=await page.locator('#prismAsk').innerText();assert.match(coachText,/MYLIFTCOACH/i,'Coach preview must use current MYLIFTCOACH branding');assert.doesNotMatch(coachText,/LIFTOVA|PRISM/,'Coach preview must not expose legacy branding');
  await check('Profile',()=>showProfile());

  // Reproduce the Oct 2 iPhone recording: leave a long root screen scrolled down,
  // then use the fixed bottom navigation. The next root must start at its top;
  // otherwise History can look blank and Progress lands in mid-page Coach cards.
  await forceDeepRootScroll();
  assert.ok(await page.evaluate(()=>window.scrollY>100),'fixture must begin with a non-zero root scroll position');
  await page.locator('#prismBottomNav [data-prism-tab="History"]').click();
  await page.waitForFunction(()=>!document.getElementById('globalHistoryScreen').classList.contains('hidden'));
  await page.waitForTimeout(80);
  assert.ok(await page.evaluate(()=>window.scrollY<=2),'History bottom-tab navigation must reset document scroll to the top');
  assert.equal(await page.locator('#globalHistoryScreen h2').first().isVisible(),true,'History heading must be immediately visible after root-tab navigation');

  await forceDeepRootScroll();
  assert.ok(await page.evaluate(()=>window.scrollY>100),'fixture must restore a deep scroll before Progress navigation');
  await page.locator('#prismBottomNav [data-prism-tab="Progress"]').click();
  await page.waitForFunction(()=>!document.getElementById('overallProgressScreen').classList.contains('hidden'));
  await page.waitForTimeout(80);
  assert.ok(await page.evaluate(()=>window.scrollY<=2),'Progress bottom-tab navigation must reset document scroll to the top');
  const progressTop=await page.locator('#overallProgressScreen').boundingBox();assert.ok(progressTop&&progressTop.y<180,'Progress root content must begin in the visible top viewport');
  await page.evaluate(()=>document.getElementById('myliftcoachScrollFixture')?.remove());

  await check('Settings',()=>showSettings());
  await check('Timer',()=>showGlobalTimer());
  await check('Help',()=>showHelp());
  await check('Data & Backup',()=>showDataBackup());
  await page.evaluate(()=>openMenu());await page.waitForTimeout(80);assert.deepEqual(await visibleLegacy(),[],'Side menu must not expose legacy branding');
  const brand=await page.locator('#sideMenu').innerText();assert.match(brand,/MYLIFTCOACH/,'Side menu must show MYLIFTCOACH brand');
  assert.deepEqual(errors,[],'Final tester-readiness sweep must not produce page errors');
  await context.close();console.log('MYLIFTCOACH final tester-readiness: major surfaces, root-tab scroll reset, Coach branding, menu branding, compact iPhone geometry PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
