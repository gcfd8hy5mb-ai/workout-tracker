const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const userId='11111111-1111-4111-8111-111111111111';
const fixture=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>.hidden{display:none!important}body{margin:0;background:#050409;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif}.container{max-width:520px;margin:auto;padding:16px}button,input,select{font:inherit}</style><link rel="stylesheet" href="/liftova-onboarding.css"><link rel="stylesheet" href="/myliftcoach-entry-flow.css"><link rel="stylesheet" href="/myliftcoach-onboarding-polish.css"></head><body><main class="container"><section id="welcomeScreen"><button type="button">Legacy welcome</button></section><section id="onboardingScreen" class="hidden"><div class="journey-shell"><div class="journey-brand"><img src="/images/app-icon-192.png" alt=""><strong>MYLIFTCOACH</strong><small>Train · Track · Progress</small></div><div id="prismJourneyContent"></div></div></section><section id="home" class="hidden"><h1>Home</h1></section><section id="goalsScreen" class="hidden"></section></main><script>
window.PRISMDeviceStore={owner:${JSON.stringify(userId)}};
window.tracking={weight:[],preferredWeightUnit:'lb',restSeconds:90,trainingLevel:'Beginner'};
window.workoutGoals={};
window.localDay=()=>new Date().toISOString().slice(0,10);
window.escapeHTML=value=>String(value??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
window.weightEntriesNewestFirst=()=>[];
window.newTrackingId=()=>Math.random().toString(36).slice(2);
window.saveTracking=()=>{};
window.showTrackingGoals=()=>window.showScreen('goalsScreen');
window.showScreen=id=>{document.querySelectorAll('main section').forEach(el=>el.classList.toggle('hidden',el.id!==id));document.body.classList.toggle('prism-onboarding-active',id==='onboardingScreen');};
window.goHome=()=>window.showScreen('home');
</script><script src="/onboarding.js"></script><script src="/myliftcoach-onboarding-polish.js"></script></body></html>`;
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/__onboarding_fixture__'){res.writeHead(200,{'content-type':'text/html'}).end(fixture);return;}const filename=pathname.replace(/^\//,'')||'index.html';const target=path.resolve(root,filename);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(error,content)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'}).end(content);});});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/__onboarding_fixture__`;
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
    const page=await context.newPage();page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
    console.log('[onboarding] signed-in handoff');
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
    await page.locator('#onboardingScreen:not(.hidden)').waitFor();
    assert.equal(await page.locator('#welcomeScreen:not(.hidden)').count(),0,'signed-in onboarding must bypass the legacy local welcome screen');
    assert.match(await page.locator('#prismJourneyContent').innerText(),/saved to your MYLIFTCOACH account/i,'signed-in profile copy must describe account persistence');
    assert.equal(await page.locator('#prismJourneyContent .journey-secondary:visible').count(),0,'first signed-in onboarding step must not expose a back path to legacy welcome');

    console.log('[onboarding] profile');
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
    const state=await page.evaluate(()=>({journey:JSON.parse(localStorage.getItem('prismJourneyV1')||'null'),profile:JSON.parse(localStorage.getItem('prismLocalProfileV1')||'null')}));
    assert.equal(state.journey.status,'complete','onboarding must commit before first Home arrival');
    assert.equal(state.profile.onboardingComplete,true,'profile must be marked complete');
    assert.equal(state.profile.displayName,'QA Athlete');

    console.log('[onboarding] returning-account route');
    await page.evaluate(()=>{showScreen('welcomeScreen');initPrismJourney();});
    await page.locator('#home:not(.hidden)').waitFor();
    assert.equal(await page.locator('#onboardingScreen:not(.hidden)').count(),0,'returning completed account must bypass onboarding');
    assert.equal(await page.locator('#welcomeScreen:not(.hidden)').count(),0,'returning completed account must not return to local welcome');
    assert.deepEqual(errors,[],'onboarding browser pass must not produce uncaught page errors');
    console.log('MYLIFTCOACH onboarding: signed-in handoff, 7-step completion, first Home and returning-account bypass PASS');
    await context.close();
  } finally {await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
