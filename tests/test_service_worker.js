const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const swSource=fs.readFileSync("sw.js","utf8");
const htmlSource=fs.readFileSync("index.html","utf8");
const cacheMatch=swSource.match(/const CACHE_NAME = "([^"]+)"/);
assert.ok(cacheMatch,"Service worker must declare a cache version");
const currentCache=cacheMatch[1];
const onboardingMatch=swSource.match(/"\.\/onboarding\.js\?v=([^"]+)"/);
assert.ok(onboardingMatch,"Service worker must cache the versioned onboarding script");
const onboardingVersion=onboardingMatch[1];
assert.match(htmlSource,new RegExp(`<script src="onboarding\\.js\\?v=${onboardingVersion.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"><\\/script>`),"HTML and offline cache must use the same onboarding release URL");

const handlers={};
const entries=new Map();
let deleted=[];
let claimed=false;
let navigated=[];
const oldCache="prism-obsolete-test-cache";
const requestUrl=value=>typeof value==="string"?value:value&&value.url;
const cache={
  async addAll(files){assert.deepEqual(Array.from(files,request=>requestUrl(request)),["./","./index.html",`./onboarding.js?v=${onboardingVersion}`,"./pro-experience.js","./manifest.json","./sw.js"]);assert.equal(files.every(request=>request.cache==="reload"),true);entries.set("shell",true)},
  async add(file){const url=requestUrl(file);assert.equal(file.cache,"reload","optional install assets must bypass stale HTTP cache");if(url.endsWith("triceps-extension.png"))throw new Error("Image temporarily unavailable");entries.set(url,true)},
  async put(){}
};
const caches={open:async name=>{assert.equal(name,currentCache);return cache},keys:async()=>[oldCache,currentCache],delete:async key=>{deleted.push(key)}};
const clients=[{url:"https://gcfd8hy5mb-ai.github.io/workout-tracker/?app=myliftcoach",async navigate(url){navigated.push(url)},postMessage(){}}];
const self={location:{origin:"https://gcfd8hy5mb-ai.github.io"},addEventListener:(name,handler)=>{handlers[name]=handler},skipWaiting:async()=>{assert.equal(entries.has("shell"),true)},clients:{claim:async()=>{claimed=true},matchAll:async()=>clients}};
vm.runInNewContext(swSource,{self,caches,Promise,URL,Request:class{constructor(url,options={}){this.url=url;this.cache=options.cache}},fetch:async()=>({ok:true,clone(){return this}})});
async function dispatch(name){let task;handlers[name]({waitUntil(promise){task=promise}});await task}
(async()=>{
await dispatch("install");
assert.equal(entries.has("./images/apple-touch-icon-180.png"),true,"current MYLIFTCOACH install icon remains available when an optional asset fails");
assert.equal(entries.has("./images/app-icon.png?v=11"),true,"current MYLIFTCOACH brand icon remains available when an optional asset fails");
await dispatch("activate");
let intercepted=false;
handlers.fetch({request:{method:"GET",url:"https://kirlpjflaoriiusfamsk.supabase.co/rest/v1/prism_account_sources"},respondWith(){intercepted=true;}});
assert.equal(intercepted,false,"service worker must leave all cross-origin Supabase traffic uncached");
assert.deepEqual(deleted,[oldCache]);
assert.equal(claimed,true);
assert.equal(navigated.length,1,"an existing installed PWA client must be navigated to the fresh shell during an upgrade");
assert.match(navigated[0],/myliftcoach_upgrade=/,"upgrade navigation must carry a one-time cache-busting marker");
console.log(`Service worker ${currentCache} shell update, installed-client upgrade and optional asset failure: OK`);
})().catch(error=>{console.error(error);process.exitCode=1});
