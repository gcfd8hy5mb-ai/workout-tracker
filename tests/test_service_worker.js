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
const oldCache="prism-obsolete-test-cache";
const cache={
  async addAll(files){assert.deepEqual(Array.from(files,request=>request.url),["./","./index.html",`./onboarding.js?v=${onboardingVersion}`,"./pro-experience.js","./manifest.json","./sw.js"]);assert.equal(files.every(request=>request.cache==="reload"),true);entries.set("shell",true)},
  async add(file){if(file.endsWith("triceps-extension.png"))throw new Error("Image temporarily unavailable");entries.set(file,true)},
  async put(){}
};
const caches={open:async name=>{assert.equal(name,currentCache);return cache},keys:async()=>[oldCache,currentCache],delete:async key=>{deleted.push(key)}};
const self={addEventListener:(name,handler)=>{handlers[name]=handler},skipWaiting:async()=>{assert.equal(entries.has("shell"),true)},clients:{claim:async()=>{claimed=true}}};
vm.runInNewContext(swSource,{self,caches,Promise,URL,Request:class{constructor(url,options){this.url=url;this.cache=options.cache}},fetch:async()=>({ok:true,clone(){return this}})});
async function dispatch(name){let task;handlers[name]({waitUntil(promise){task=promise}});await task}
(async()=>{
await dispatch("install");
assert.equal(entries.has("./images/app-icon-192.png"),true,"other images remain available when an optional image fails");
await dispatch("activate");
assert.deepEqual(deleted,[oldCache]);
assert.equal(claimed,true);
console.log(`Service worker ${currentCache} shell update and optional image failure: OK`);
})().catch(error=>{console.error(error);process.exitCode=1});
