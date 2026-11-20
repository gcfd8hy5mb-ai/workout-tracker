const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const regular=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const privateSession=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const base='http://127.0.0.1:8765/myliftcoach2/';
 try{
  const a=await regular.newPage(),b=await privateSession.newPage();
  const errors=[];
  a.on('pageerror',e=>errors.push('regular: '+e.message));
  b.on('pageerror',e=>errors.push('private: '+e.message));
  await a.route('https://kirlpjflaoriiusfamsk.supabase.co/**',route=>route.abort());
  await b.route('https://kirlpjflaoriiusfamsk.supabase.co/**',route=>route.abort());
  await a.goto(base,{waitUntil:'load'});
  await b.goto(base,{waitUntil:'load'});
  await a.waitForFunction(()=>document.querySelector('#todayTitle')?.textContent?.length>0);
  await b.waitForFunction(()=>document.querySelector('#todayTitle')?.textContent?.length>0);
  assert.deepEqual(errors,[],errors.join('; '));
  const sentinel='demo-private-isolation-check';
  await a.evaluate(id=>localStorage.setItem('mlc2-two-context-isolation',id),sentinel);
  assert.equal(await a.evaluate(()=>localStorage.getItem('mlc2-two-context-isolation')),sentinel);
  assert.equal(await b.evaluate(()=>localStorage.getItem('mlc2-two-context-isolation')),null);
  assert.equal(await b.evaluate(()=>sessionStorage.getItem('mlc2-auth-session-v1')),null);
  assert.equal(await b.locator('#existingCloudSessionsButton').isDisabled(),true);
  assert.equal(await a.locator('#existingCloudSessionsButton').isDisabled(),true);
  // Private window closure must not remove the regular session's device data.
  await privateSession.close();
  assert.equal(await a.evaluate(()=>localStorage.getItem('mlc2-two-context-isolation')),sentinel);
  console.log('PASS: separate mobile browser contexts preserve independent local/session storage, production writes inactive');
 }finally{await regular.close();await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
