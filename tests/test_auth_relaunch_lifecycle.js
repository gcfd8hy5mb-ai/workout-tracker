const assert=require('node:assert/strict');
const {create}=require('../persistence/account-controller.js');
const {create:createStorage}=require('../persistence/scoped-storage.js');

const USER='abababab-abab-4bab-8bab-abababababab';
const raw=new Map();
const backing={getItem:k=>raw.get(k)??null,setItem:(k,v)=>raw.set(k,v),removeItem:k=>raw.delete(k)};
const rows=[];
const transport={
 read:async user=>rows.filter(row=>row.user_id===user).map(row=>structuredClone(row)),
 write:async(user,changes)=>changes.map(change=>{
   const i=rows.findIndex(row=>row.user_id===user&&row.table===change.table&&row.id===change.id);
   const revision=(i>=0?rows[i].revision:0)+1;
   const next={...change,user_id:user,revision};delete next.expected_revision;
   if(i>=0)rows[i]=next;else rows.push(next);return structuredClone(next);
 })
};
const cloud={currentUser:async()=>({id:USER}),getSession:async()=>({access_token:'test',user:{id:USER}})};

(async()=>{
 // First signed-in launch: account-scoped workout state is written and verified.
 let manager=createStorage(backing);manager.select(USER);
 manager.storage.setItem('prismLocalProfileV1',JSON.stringify({displayName:'Lifecycle Athlete'}));
 manager.storage.setItem('prismActiveWorkoutV1',JSON.stringify({key:'preset-day1',title:'Day 1',ids:['machine-chest-press'],index:0,startedAt:12345}));
 manager.storage.setItem('setHistoryV5',JSON.stringify({'preset-day1-machine-chest-press-set1':{weight:135,reps:8,done:true}}));
 let controller=create({manager,cloud,backing,createTransport:()=>transport});
 assert.equal((await controller.connect()).status,'verified');controller.stop();

 // Sign-out/relaunch: no owner is selected and account data is not visible through guest storage.
 manager=createStorage(backing);
 assert.equal(manager.owner,null);
 assert.equal(manager.storage.getItem('prismLocalProfileV1'),null,'signed-out guest scope must not expose account profile');
 assert.equal(manager.storage.getItem('prismActiveWorkoutV1'),null,'signed-out guest scope must not expose account active workout');
 assert.equal(manager.storage.getItem('setHistoryV5'),null,'signed-out guest scope must not expose account set state');

 // Sign back in/relaunch: selecting the same user restores the exact private local mirror.
 manager.select(USER);
 assert.equal(JSON.parse(manager.storage.getItem('prismLocalProfileV1')).displayName,'Lifecycle Athlete');
 assert.equal(JSON.parse(manager.storage.getItem('prismActiveWorkoutV1')).startedAt,12345);
 assert.deepEqual(JSON.parse(manager.storage.getItem('setHistoryV5'))['preset-day1-machine-chest-press-set1'],{weight:135,reps:8,done:true});
 controller=create({manager,cloud,backing,createTransport:()=>transport});
 const reconnect=await controller.connect();
 assert.equal(reconnect.writes,0,'relaunch/sign-in must not duplicate unchanged account state');controller.stop();

 // Fresh browser for the same user restores from verified cloud state.
 const freshRaw=new Map();const freshBacking={getItem:k=>freshRaw.get(k)??null,setItem:(k,v)=>freshRaw.set(k,v),removeItem:k=>freshRaw.delete(k)};
 const fresh=createStorage(freshBacking);fresh.select(USER);
 controller=create({manager:fresh,cloud,backing:freshBacking,createTransport:()=>transport});
 assert.equal((await controller.connect()).status,'restored');
 assert.equal(JSON.parse(fresh.storage.getItem('prismActiveWorkoutV1')).startedAt,12345);
 assert.deepEqual(JSON.parse(fresh.storage.getItem('setHistoryV5'))['preset-day1-machine-chest-press-set1'],{weight:135,reps:8,done:true});
 controller.stop();
 console.log('Auth lifecycle: signed-in state, sign-out isolation, same-account sign-in relaunch, and fresh-browser restore PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
