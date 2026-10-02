const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{const filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';const target=path.resolve(root,filename);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(error,content)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'}).end(content);});});

(async()=>{
  const watchdog=setTimeout(()=>{console.error('MYLIFTCOACH onboarding fixture exceeded 60 seconds');process.exit(1);},60000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
    const page=await context.newPage();page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const userId='11111111-1111-4111-8111-111111111111';
    await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* onboarding UI fixture: auth transport covered elsewhere */'}));

    console.log('[onboarding] boot runtime');
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForFunction(()=>window.LiftovaAnatomy&&typeof window.goHome==='function'&&window.showWorkouts?.__liftovaCanonicalWorkout===true&&window.MYLIFTCOACHNavigation,{timeout:15000});
    const hasOnboarding=await page.evaluate(()=>typeof window.startPrismGuest==='function'&&typeof window.initPrismJourney==='function');
    assert.equal(hasOnboarding,true,`onboarding runtime must load after canonical shell: ${JSON.stringify(errors)}`);
    await page.evaluate(userId=>{window.PRISMDeviceStore.select(userId);startPrismGuest();},userId);
    await page.locator('#onboardingScreen:not(.hidden)').waitFor();

    console.log('[onboarding] profile');
    assert.equal(await page.evaluate(()=>window.PRISMDeviceStore.owner),userId,'onboarding fixture must use account-scoped storage');
    assert.equal(await page.locator('#welcomeScreen:not(.hidden)').count(),0,'verified account onboarding must not stop at the legacy local welcome screen');
    assert.match(await page.locator('#prismJourneyContent').innerText(),/saved to your MYLIFTCOACH account/i,'signed-in profile copy must describe account persistence');
    assert.equal(await page.locator('#prismJourneyContent .journey-secondary:visible').count(),0,'first signed-in onboarding step must not expose a back button to the legacy welcome screen');
    const fontSize=await page.locator('#journey-name').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    assert.ok(fontSize>=16,'profile input must remain iPhone zoom-safe');
    await page.locator('#journey-name').fill('QA Athlete');
    await page.getByRole('button',{name:'Continue',exact:true}).click();

    console.log('[onboarding] training goal');
    await page.getByRole('button',{name:/Build Muscle/i}).click();
    await page.getByRole('button',{name:'Continue',exact:true}).click();

    console.log('[onboarding] body goal');
    await page.getByRole('button',{name:/MAINTAIN/i}).click();
    await page.getByRole('button',{name:'Continue',exact:true}).click();

    console.log('[onboarding] duration');
    await page.locator('#journey-weeks').selectOption('8');
    await page.getByRole('button',{name:/Confirm duration/i}).click();

    console.log('[onboarding] calories');
    await page.getByRole('button',{name:/SKIP FOR NOW/i}).click();

    console.log('[onboarding] preferences');
    assert.equal(await page.locator('#journey-days').inputValue(),'4','training preferences should preserve the four-day default');
    await page.getByRole('button',{name:/See my setup/i}).click();

    console.log('[onboarding] ready and first Home');
    await page.getByRole('button',{name:/START TRAINING/i}).click();
    await page.locator('#home:not(.hidden)').waitFor();
    const scoped=await page.evaluate(()=>({owner:window.PRISMDeviceStore.owner,journey:JSON.parse(localStorage.getItem('prismJourneyV1')||'null'),profile:JSON.parse(localStorage.getItem('prismLocalProfileV1')||'null')}));
    assert.equal(scoped.owner,userId);
    assert.equal(scoped.journey.status,'complete','onboarding must commit before first Home arrival');
    assert.equal(scoped.profile.onboardingComplete,true,'profile must be marked complete');
    assert.equal(scoped.profile.displayName,'QA Athlete');

    console.log('[onboarding] returning-account route');
    await page.evaluate(()=>{showScreen('welcomeScreen');initPrismJourney();});
    await page.locator('#home:not(.hidden)').waitFor();
    assert.equal(await page.locator('#onboardingScreen:not(.hidden)').count(),0,'returning completed account must bypass onboarding');
    assert.equal(await page.locator('#welcomeScreen:not(.hidden)').count(),0,'returning completed account must not return to local welcome');
    assert.deepEqual(errors,[],'onboarding pass must not produce uncaught page errors');

    console.log('MYLIFTCOACH onboarding: account-scoped handoff, 7-step completion, first Home and returning-account bypass PASS');
    await context.close();
  } finally {
    clearTimeout(watchdog);
    await browser.close();
    server.close();
  }
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
