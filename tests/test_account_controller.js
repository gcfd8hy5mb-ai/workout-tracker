const assert = require('node:assert/strict');
const {create} = require('../persistence/account-controller.js');
const {create: createStorage} = require('../persistence/scoped-storage.js');
const model = require('../persistence/storage-model.js');
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const raw = new Map([['workoutHistoryV52','[]'], ['prismLocalProfileV1','{"displayName":"Guest"}']]);
const backing = {getItem:k=>raw.get(k)??null,setItem:(k,v)=>raw.set(k,v),removeItem:k=>raw.delete(k)};
const manager = createStorage(backing); manager.select(A);
let owner = A;
const cloud = {currentUser:async()=>({id:owner}),getSession:async()=>({access_token:'test',user:{id:owner}})};
const rows = new Map();
const transport = {
  read:async id=>rows.get(id)||[],
  write:async(id,changes)=>{
    const state = rows.get(id)||[];
    for (const row of changes) {
      const index=state.findIndex(r=>r.table===row.table&&r.id===row.id);
      const next={...row,user_id:id,revision:(index>=0?state[index].revision:0)+1};
      if(index>=0)state[index]=next;else state.push(next);
    }
    rows.set(id,state);return state.filter(r=>changes.some(c=>c.id===r.id&&c.table===r.table));
  }
};
const events=[];
async function scenario(){
 const controller=create({manager,cloud,backing,createTransport:()=>transport,onStatus:s=>events.push(s)});
 assert.equal((await controller.connect()).status,'claim','guest data requires explicit claim');
 assert.equal(controller.claimGuest(),2);
 assert.equal((await controller.flush()).status,'verified');
 assert.equal(model.restoreSnapshot(rows.get(A)).prismLocalProfileV1,'{"displayName":"Guest"}');
 assert.equal((await controller.flush()).writes,0,'repeat is idempotent');
 assert.equal(raw.get('prismLocalProfileV1'),'{"displayName":"Guest"}','guest data remains');
 controller.stop();
 owner=B;manager.select(B);
 const second=create({manager,cloud,backing,createTransport:()=>transport});
 assert.equal((await second.connect()).status,'claim');
 assert.equal(manager.storage.getItem('prismLocalProfileV1'),null,'A data is invisible to B');
 second.stop();
 owner=A;manager.select(A);
 const same=create({manager,cloud,backing,createTransport:()=>transport});
 assert.equal((await same.connect()).writes,0,'returning to A retains remote checkpoint');
 same.stop();
 // A fresh browser gets account data from cloud without copying the legacy guest.
 const freshMap=new Map(),fresh={getItem:k=>freshMap.get(k)??null,setItem:(k,v)=>freshMap.set(k,v),removeItem:k=>freshMap.delete(k)};
 const freshManager=createStorage(fresh);freshManager.select(A);
 const restored=create({manager:freshManager,cloud,backing:fresh,createTransport:()=>transport});
 assert.equal((await restored.connect()).status,'restored');
 assert.equal(freshManager.storage.getItem('prismLocalProfileV1'),'{"displayName":"Guest"}');
 restored.stop();
 // A newly signed-in browser runs onboarding before async restoration; those
 // automatically created defaults must not block an explicit guest claim.
 const seededMap=new Map([['prismLocalProfileV1','{"displayName":"Guest"}'],['workoutHistoryV52','[]']]);
 const seededBacking={getItem:k=>seededMap.get(k)??null,setItem:(k,v)=>seededMap.set(k,v),removeItem:k=>seededMap.delete(k)};
 const seededManager=createStorage(seededBacking);seededManager.select(B);
 seededManager.storage.setItem('prismLocalProfileV1','{"displayName":""}');
 seededManager.storage.setItem('prismJourneyV1','{"status":"welcome"}');
 const seeded=create({manager:seededManager,cloud:{...cloud,currentUser:async()=>({id:B})},backing:seededBacking,initialSnapshot:{},createTransport:()=>transport});
 assert.equal((await seeded.connect()).status,'claim');
 assert.equal(seeded.claimGuest(),2);
 assert.equal(seededManager.storage.getItem('prismLocalProfileV1'),'{"displayName":"Guest"}');
 assert.equal(seededMap.get('prismLocalProfileV1'),'{"displayName":"Guest"}','original guest data stays');
 assert.equal((await seeded.flush()).status,'verified');
 seeded.stop();
 const C='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 const backupMap=new Map(),backupBacking={getItem:k=>backupMap.get(k)??null,setItem:(k,v)=>backupMap.set(k,v),removeItem:k=>backupMap.delete(k)};
 const backupManager=createStorage(backupBacking);backupManager.select(C);
 backupManager.storage.setItem('prismJourneyV1','{"status":"welcome"}');
 const backupController=create({manager:backupManager,cloud:{...cloud,currentUser:async()=>({id:C})},backing:backupBacking,initialSnapshot:{},createTransport:()=>transport});
 assert.equal((await backupController.connect()).status,'claim');
 const older={user_id:C,backup_data:{localStorage:{prismLocalProfileV1:'{"displayName":"Older"}',workoutHistoryV52:'[]',prismEntitlementV1:'{"tier":"lifetime_pro"}',prismSupabaseSessionV1:'secret'}}};
 await assert.rejects(()=>backupController.importLegacyBackup({...older,user_id:A}),/different account/);
 assert.equal(await backupController.importLegacyBackup(older),2,'only allowlisted data imported');
 assert.equal(backupManager.storage.getItem('prismEntitlementV1'),null,'legacy paid flag cannot grant access');
 assert.equal((await backupController.flush()).status,'verified');
 assert.equal(JSON.parse(model.restoreSnapshot(rows.get(C)).prismLocalProfileV1).displayName,'Older');
 backupController.stop();
 assert(events.some(e=>e.kind==='synced'));
 console.log('Account controller: explicit claim, verified save, idempotence, A/B isolation and fresh device restore OK.');
}
scenario().catch(error=>{console.error(error);process.exitCode=1;});
