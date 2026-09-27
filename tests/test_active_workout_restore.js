const assert=require('node:assert/strict');
const {create}=require('../persistence/account-controller.js');
const {create:createStorage}=require('../persistence/scoped-storage.js');

const USER='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const rows=[];
const transport={
  read:async()=>structuredClone(rows),
  write:async(user,changes)=>{
    const returned=[];
    for(const change of changes){
      const i=rows.findIndex(r=>r.table===change.table&&r.id===change.id);
      const revision=(i>=0?rows[i].revision:0)+1;
      const next={...change,user_id:user,revision};delete next.expected_revision;
      if(i>=0)rows[i]=next;else rows.push(next);
      returned.push(next);
    }
    return structuredClone(returned);
  }
};
const cloud={currentUser:async()=>({id:USER}),getSession:async()=>({access_token:'test',user:{id:USER}})};
const backingFrom=map=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});

(async()=>{
  // Device A establishes an active workout and initial blank set state.
  const aMap=new Map(),aBacking=backingFrom(aMap),aStore=createStorage(aBacking);aStore.select(USER);
  aStore.storage.setItem('prismActiveWorkoutV1',JSON.stringify({key:'plan-day1',ids:['press'],index:0,startedAt:100}));
  aStore.storage.setItem('setHistoryV5',JSON.stringify({'plan-day1-press-set1':{weight:'',reps:''}}));
  const a=create({manager:aStore,cloud,backing:aBacking,createTransport:()=>transport});
  assert.equal((await a.connect()).status,'verified');a.stop();

  // Device B restores and therefore holds the same checkpoint/local mirror.
  const bMap=new Map(),bBacking=backingFrom(bMap),bStore=createStorage(bBacking);bStore.select(USER);
  const b=create({manager:bStore,cloud,backing:bBacking,createTransport:()=>transport});
  assert.equal((await b.connect()).status,'restored');b.stop();
  assert.equal(JSON.parse(bStore.storage.getItem('prismActiveWorkoutV1')).startedAt,100);

  // Device A advances the cloud state: a new active-workout instance plus a completed set.
  const a2=create({manager:aStore,cloud,backing:aBacking,createTransport:()=>transport});
  assert.equal((await a2.connect()).writes,0);
  aStore.storage.setItem('prismActiveWorkoutV1',JSON.stringify({key:'plan-day1',ids:['press'],index:0,startedAt:200}));
  aStore.storage.setItem('setHistoryV5',JSON.stringify({'plan-day1-press-set1':{weight:135,reps:2}}));
  assert.equal((await a2.flush()).status,'verified');a2.stop();

  // Device B did not edit its stale local workout. On refresh, verified cloud-only
  // changes must replace the stale active-workout mirror and restore the set.
  const b2=create({manager:bStore,cloud,backing:bBacking,createTransport:()=>transport});
  const result=await b2.connect();
  assert.equal(result.status,'restored');
  assert.equal(JSON.parse(bStore.storage.getItem('prismActiveWorkoutV1')).startedAt,200);
  assert.deepEqual(JSON.parse(bStore.storage.getItem('setHistoryV5'))['plan-day1-press-set1'],{weight:135,reps:2});
  b2.stop();

  console.log('Active workout restore: stale unchanged browser accepts verified newer cloud workout and set state OK.');
})().catch(error=>{console.error(error);process.exitCode=1;});
