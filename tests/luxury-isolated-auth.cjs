const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const filename=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html');
 if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(filename,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream'}).end(data);});
});
const TEST_ID='4aa8e0a7-1dd2-4679-a9e6-70f1ae43ba32';
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await assert.equal(await page.locator('#heading').innerText(),'Welcome back');
  assert.equal(await page.locator('script[src="persistence/account-ui.js"]').count(),0,'full auth UI must not boot during lightweight sign-in');
  assert.equal(await page.locator('script[src="myliftcoach-startup-smooth.js"]').count(),0,'legacy startup cover must not boot');
  // Simulate Supabase CORS preflight and responses exactly enough for a real
  // cross-origin browser fetch. Without these headers the test can false-fail.
  const cors={'access-control-allow-origin':base,'access-control-allow-headers':'apikey, content-type, authorization, x-client-info','access-control-allow-methods':'POST, GET, OPTIONS'};
  let passwordAttempts=0;
  await page.route('https://*/auth/v1/**',async route=>{
   const request=route.request();
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:cors,body:''});
   const url=new URL(request.url());
   if(url.pathname.endsWith('/token')&&url.searchParams.get('grant_type')==='password'){
    passwordAttempts++;
    if(passwordAttempts===1)return route.fulfill({status:400,contentType:'application/json',headers:cors,body:JSON.stringify({error:'invalid_grant',message:'Invalid login credentials'})});
    return route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({access_token:'mock-access',refresh_token:'mock-refresh',expires_in:3600,token_type:'bearer',user:{id:TEST_ID,email:'tester@example.com'}})});
   }
   if(url.pathname.endsWith('/user'))
    return route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({id:TEST_ID,email:'tester@example.com'})});
   return route.fulfill({status:404,contentType:'application/json',headers:cors,body:'{}'});
  });
  await page.route('https://*/rest/v1/**',async route=>{
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors,body:''});
   return route.fulfill({status:200,contentType:'application/json',headers:cors,body:'[]'});
  });
  await page.locator('#email').fill('tester@example.com');
  await page.locator('#password').fill('password123');
  await page.locator('#submit').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Invalid email or password'),undefined,{timeout:8000});
  assert.equal(await page.locator('#submit').isEnabled(),true,'a rejected sign-in must allow another attempt');
  assert.equal(await page.locator('#heading').innerText(),'Welcome back','bad password must never freeze or hide login');
  await page.locator('#submit').click();
  await page.waitForURL('**/app.html',{timeout:12000});
  await page.waitForFunction(id=>window.PRISMDeviceStore?.owner===id,TEST_ID,{timeout:15000});
  const state=await page.evaluate(()=>({session:JSON.parse(window.localStorage.getItem('prismSupabaseSessionV1')||'null'),owner:window.PRISMDeviceStore?.owner||null}));
  assert.equal(state.session?.user?.id,TEST_ID,'verified session must survive navigation');
  assert.equal(state.owner,TEST_ID,'full app must bootstrap correct scoped account');
  assert.equal(passwordAttempts,2,'test must exercise rejected and successful authentication');
  console.log('PASS isolated luxury rejected login, retry and verified handoff',JSON.stringify({owner:state.owner,errors:errors.slice(0,8)}));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
