const assert=require('node:assert/strict');
const {create}=require('../persistence/account-controller.js');
const {create:createStorage}=require('../persistence/scoped-storage.js');
const model=require('../persistence/storage-model.js');

const user='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const map=new Map(),backing={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
const manager=createStorage(backing);manager.select(user);
manager.storage.setItem('prismLocalProfileV1','{"displayName":"Retry"}');
const cloud={currentUser:async()=>({id:user}),getSession:async()=>({access_token:'test',user:{id:user}})};
const rows=[];
let fail=false,attempts=0,nextId=0;
const scheduled=new Map();
const setTimer=(callback,delay)=>{const id=++nextId;scheduled.set(id,{callback,delay});return id};
const clearTimer=id=>scheduled.delete(id);
const transport={read:async()=>structuredClone(rows),write:async(owner,changes)=>{
 attempts++;
 if(fail)throw Error('Network unavailable');
 const saved=changes.map(change=>{const {expected_revision,...fields}=change;return {...fields,user_id:owner,revision:(rows.find(row=>row.id===change.id&&row.table===change.table)?.revision||0)+1}});
 for(const row of saved){const index=rows.findIndex(previous=>previous.table===row.table&&previous.id===row.id);if(index<0)rows.push(row);else rows[index]=row}
 return structuredClone(saved);
}};

(async()=>{
 const controller=create({manager,cloud,backing,createTransport:()=>transport,setTimer,clearTimer});
 assert.equal((await controller.connect()).status,'verified');
 fail=true;
 manager.storage.setItem('prismLocalProfileV1','{"displayName":"Still on device"}');
 await assert.rejects(()=>controller.flush(),/Network unavailable/);
 assert.equal(manager.storage.getItem('prismLocalProfileV1'),'{"displayName":"Still on device"}');
 assert.equal(scheduled.size,1);
 assert.equal([...scheduled.values()][0].delay,5000);
 fail=false;
 const [retryId,{callback}]=scheduled.entries().next().value;scheduled.delete(retryId);callback();
 for(let index=0;index<40&&attempts<3;index++)await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(scheduled.size,0);
 assert.equal(attempts,3,'first save, failed edit, automatic retry');
 assert.equal(JSON.parse(model.restoreSnapshot(rows).prismLocalProfileV1).displayName,'Still on device');
 controller.stop();

 const badMap=new Map(),badBacking={getItem:key=>badMap.get(key)??null,setItem:(key,value)=>badMap.set(key,value),removeItem:key=>badMap.delete(key)};
 const badManager=createStorage(badBacking);badManager.select(user);
 badManager.storage.setItem('prismLocalProfileV1','{"displayName":"Local"}');
 const forbidden={read:async()=>[],write:async()=>{const error=Error('Session revoked');error.status=401;throw error}};
 const revoked=create({manager:badManager,cloud,backing:badBacking,createTransport:()=>forbidden,setTimer,clearTimer});
 await assert.rejects(()=>revoked.connect(),/Session revoked/);
 assert.equal(scheduled.size,0,'revoked sessions are not retried');
 assert.equal(badManager.storage.getItem('prismLocalProfileV1'),'{"displayName":"Local"}');
 revoked.stop();
 console.log('Account retry: offline save retries and revoked session stops without losing local data OK.');
})().catch(error=>{console.error(error);process.exitCode=1});
