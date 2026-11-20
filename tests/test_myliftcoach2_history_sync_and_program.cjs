const test=require('node:test'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const sync=require('../myliftcoach2/session-history-sync.js');
const coach=require('../myliftcoach2/adaptive-program.js');
const entitlement=require('../myliftcoach2/coach-entitlement-boundary.js');
const owner='account-a';
const entry={id:'demo-test-01',title:'My workout',created:'2026-11-18T12:00:00Z',sets:[{exerciseId:'leg-press',weight:100,reps:10}]};
const record={id:'mlc2-history-'+entry.id,owner,type:'session',revision:1,deleted:false,payload:{format:'mlc2-completed-workout-v1',workout:entry}};
const base={owner,entries:[entry],inventory:[],cryptoAPI:webcrypto,assertCurrent(){}};
test('creates an immutable record and recovers a lost response by exact read-back',async()=>{
 const ids=[];
 const transport={async commit(account,request){
  assert.equal(account,owner);assert.equal(request.baseRevision,0);assert.equal(request.recordId,record.id);
  assert.deepEqual(request.payload,record.payload);
  ids.push(request.opId);throw Error('response lost');
 },async read(){return record}};
 assert.equal((await sync.sync({...base,transport})).uploaded,1);
 await sync.sync({...base,transport});
 assert.equal(ids[0],ids[1]);
 assert.match(ids[0],/^[\da-f-]{36}$/);
 assert.equal((await sync.sync({...base,inventory:[record],transport})).uploaded,0);
 assert.equal(ids.length,2);
});
test('restores across devices without duplicates and rejects tombstones, divergent and foreign records',async()=>{
 const result=await sync.sync({...base,entries:[],inventory:[record]});
 assert.deepEqual(sync.merge([entry],result.workouts),[entry]);
 assert.deepEqual(sync.merge([],result.workouts),[entry]);
 await assert.rejects(sync.sync({...base,inventory:[{...record,deleted:true}]}),/conflicts/);
 await assert.rejects(sync.sync({...base,inventory:[{...record,owner:'account-b'}]}),/owner/);
 assert.throws(()=>sync.merge([entry],[{...entry,title:'Changed'}]),/conflicts/);
});
test('account changes stop upload and leave the device data untouched',async()=>{
 let called=false;
 await assert.rejects(sync.sync({...base,assertCurrent(){throw Error('Account changed')},transport:{
  async commit(){called=true}
 }}),/Account changed/);
 assert.equal(called,false);
});
test('adaptive plans honor prior movements, availability and exact custom order with rest',()=>{
 const catalog=[{id:'leg-press',name:'Leg Press',muscle:'Quads'},{id:'press',name:'Press',muscle:'Chest'},
  {id:'row',name:'Row',muscle:'Back'},{id:'never',name:'Untrained Row',muscle:'Back'}];
 const choose={catalog,local:[{...entry,sets:[...entry.sets,{exerciseId:'press',weight:100,reps:10}]}],
  legacy:[{date:entry.created,exercises:[{id:'row',sets:[{weight:80,reps:8}]}]}],
  profile:{days:4},checkin:{days:2},now:Date.parse('2026-11-20'),
  prescription:plan=>plan.ids.map(id=>({id,weight:null}))};
 const generated=coach.generate(choose);
 assert.equal(generated.length,2);
 assert.deepEqual(generated[0].ids,['leg-press','press','row']);
 const custom={id:'custom-week',ids:['row','leg-press']};
 const protectedPlan=coach.generate({...choose,scheduled:[null,custom,null]});
 assert.deepEqual(protectedPlan,[null,{...custom,prescriptions:[{id:'row',weight:null},{id:'leg-press',weight:null}]},null]);
});
test('only a matching verified paid tier can unlock Pro',()=>{
 const user=(tier,expires_at)=>({id:owner,app_metadata:{myliftcoach_entitlement:{tier,expires_at}}});
 const now=Date.parse('2026-11-20');
 assert.equal(entitlement.verifiedTier(user('pro','2026-12-20'),owner,now),'pro');
 assert.equal(entitlement.verifiedTier(user('pro','2026-11-19'),owner,now),'free');
 assert.equal(entitlement.verifiedTier(user('lifetime_pro'),owner,now),'lifetime_pro');
 assert.equal(entitlement.verifiedTier(user('lifetime_pro'),'account-b',now),'free');
 assert.equal(entitlement.verifiedTier({id:owner,user_metadata:user('lifetime_pro').app_metadata},owner,now),'free');
 assert.equal(entitlement.verifiedTier(user('beta'),owner,now),'free');
});

test('beta previews require an authorized owner and preserve a genuine paid tier when disabled',()=>{
 const user={id:owner,app_metadata:{myliftcoach_beta:true,myliftcoach_entitlement:{tier:'lifetime_pro'}}};
 assert.deepEqual(entitlement.access(user,owner,'free'),{paidTier:'lifetime_pro',effectiveTier:'free',mode:'free',beta:true});
 assert.equal(entitlement.access(user,owner,'pro').effectiveTier,'pro');
 assert.equal(entitlement.access(user,owner,'free',false).effectiveTier,'lifetime_pro');
 assert.equal(entitlement.access(user,'other','pro').effectiveTier,'free');
 assert.equal(entitlement.access({id:owner,user_metadata:{myliftcoach_beta:true}},owner,'pro').beta,false);
 assert.equal(entitlement.access({id:owner,app_metadata:{myliftcoach_beta:true}},owner,'pro').effectiveTier,'pro');
 assert.equal(entitlement.access({id:owner,app_metadata:{}},owner,'pro').effectiveTier,'free');
});
