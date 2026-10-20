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
  await page.route('https://*/auth/v1/token?grant_type=password',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'mock-access',refresh_token:'mock-refresh',expires_in:3600,token_type:'bearer',user:{id:TEST_ID,email:'tester@example.com'}})}));
  await page.route('https://*/auth/v1/user',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:TEST_ID,email:'tester@example.com'})}));
  await page.route('https://*/rest/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.locator('#email').fill('tester@example.com');
  await page.locator('#password').fill('password123');
  await page.locator('#submit').click();
  await page.waitForURL('**/app.html',{timeout:12000});
  const state=await page.evaluate(()=>({session:JSON.parse(window.localStorage.getItem('prismSupabaseSessionV1')||'null'),owner:window.PRISMDeviceStore?.owner||null}));
  assert.equal(state.session?.user?.id,TEST_ID,'verified session must survive navigation');
  assert.equal(state.owner,TEST_ID,'full app must bootstrap correct scoped account');
  console.log('PASS isolated luxury login and verified handoff',JSON.stringify({owner:state.owner,errors:errors.slice(0,8)}));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
