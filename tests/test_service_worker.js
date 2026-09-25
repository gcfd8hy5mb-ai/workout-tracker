const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const handlers={};
const entries=new Map();
let deleted=[];
let claimed=false;
const cache={
  async addAll(files){assert.deepEqual(Array.from(files,request=>request.url),["./","./index.html","./onboarding.js","./pro-experience.js","./manifest.json","./sw.js"]);assert.equal(files.every(request=>request.cache==="reload"),true);entries.set("shell",true)},
  async add(file){if(file.endsWith("triceps-extension.png"))throw new Error("Image temporarily unavailable");entries.set(file,true)},
  async put(){}
};
const caches={open:async()=>cache,keys:async()=>["prism-v10.3-beta3","prism-v10.3-beta4"],delete:async key=>{deleted.push(key)}};
const self={addEventListener:(name,handler)=>{handlers[name]=handler},skipWaiting:async()=>{assert.equal(entries.has("shell"),true)},clients:{claim:async()=>{claimed=true}}};
vm.runInNewContext(fs.readFileSync("sw.js","utf8"),{self,caches,Promise,URL,Request:class{constructor(url,options){this.url=url;this.cache=options.cache}},fetch:async()=>({ok:true,clone(){return this}})});
async function dispatch(name){let task;handlers[name]({waitUntil(promise){task=promise}});await task}
(async()=>{
await dispatch("install");
assert.equal(entries.has("./images/app-icon-192.png"),true,"other images remain available when an optional image fails");
await dispatch("activate");
assert.deepEqual(deleted,["prism-v10.3-beta3"]);
assert.equal(claimed,true);
console.log("Service worker shell update and optional image failure: OK");
})().catch(error=>{console.error(error);process.exitCode=1});
