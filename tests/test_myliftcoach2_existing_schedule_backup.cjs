const test=require('node:test'),assert=require('node:assert/strict');
const mod=require('../myliftcoach2/existing-schedule-backup.js');
const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const uuid='d3826f8f-5655-4f8f-aed2-0999c5f761c1';
const doc=()=>({version:1,plans:[{id:'custom-my-workout',title:'My workout',ids:['press']}],
 assigned:['custom-my-workout',null,null,null,null,null,null],overrides:{},recurring:[]});
function service(){
 let row=null,reads=0,writes=0,session={user:{id:owner},access_token:'test-token',expires_at:Math.floor(Date.now()/1000)+3600};
 const calls=[];
 const fetcher=async(url,request)=>{
  const fn=url.split('/').pop(),args=JSON.parse(request.body);
  calls.push({fn,args,headers:request.headers});
  if(fn==='mlc2_v1_read'){
   reads++;return {ok:true,json:async()=>row};
  }
  if(fn==='mlc2_v1_commit'){
   writes++;
   if(row?.revision!==(args.p_base_revision||0)&&!(row===null&&args.p_base_revision===0))
    return {ok:false,status:409};
   row={owner,type:'custom-plan',id:mod.RECORD_ID,revision:args.p_base_revision+1,
    deleted:false,payload:args.p_payload};
   return {ok:true,json:async()=>({owner,opId:args.p_op_id,revision:row.revision,replayed:false})};
  }
  throw Error('Unexpected request');
 };
 const transport=mod.createTestTransport({endpoint:'https://example.supabase.co',publishableKey:'public-test-key',
  getSession:async()=>session,fetcher});
 return {transport,calls,counts:()=>({reads,writes}),setSession:s=>{session=s},setRow:r=>{row=r},row:()=>row};
}
test('2.0 custom-plan transport is enabled but requires authenticated configuration',()=>{
 assert.equal(mod.ENABLED,true);
 assert.throws(()=>mod.create({}),/Authenticated HTTPS/);
 assert.equal(mod.RECORD_ID,'mlc2-recurring-schedule-v1');
});
test('new phone reads empty backup, writes verified custom-plan and reads it back',async()=>{
 const s=service();assert.deepEqual(await s.transport.read(owner),{revision:0,document:null});
 const out=await s.transport.save(owner,0,doc(),uuid);
 assert.equal(out.revision,1);
 assert.deepEqual(out.document,doc());
 assert.deepEqual(s.counts(),{reads:2,writes:1});
 assert.equal(s.row().type,'custom-plan');
 assert.equal(s.row().id,mod.RECORD_ID);
 assert.equal(s.calls.find(x=>x.fn==='mlc2_v1_commit').args.p_deleted,false);
 assert.equal(s.calls.find(x=>x.fn==='mlc2_v1_commit').args.p_op_id,uuid);
});
test('cannot read or write another account and never sends a request',async()=>{
 const s=service();
 await assert.rejects(s.transport.read(other),/Account changed/);
 await assert.rejects(s.transport.save(other,0,doc(),uuid),/Account changed/);
 assert.deepEqual(s.counts(),{reads:0,writes:0});
});
test('stale revision rejects save and preserves original cloud record',async()=>{
 const s=service();
 await s.transport.save(owner,0,doc(),uuid);
 const old=s.row();
 await assert.rejects(s.transport.save(owner,0,{...doc(),plans:[{...doc().plans[0],title:'Wrong overwrite'}]},
 '5b6da87c-1776-41d7-a296-8e2f140d949d'),/Cloud schedule changed/);
 assert.deepEqual(s.row(),old);
});
test('invalid schedule does not reach cloud transport',async()=>{
 const s=service();
 await assert.rejects(s.transport.save(owner,0,{...doc(),assigned:['missing',null,null,null,null,null,null]},uuid),/Unknown default workout/);
 assert.deepEqual(s.counts(),{reads:0,writes:0});
});
test('unexpected or deleted record cannot become restored custom workout',async()=>{
 const s=service();
 s.setRow({owner:other,type:'custom-plan',id:mod.RECORD_ID,revision:3,deleted:false,payload:{document:doc()}});
 await assert.rejects(s.transport.read(owner),/cross-account/);
 s.setRow({owner,type:'custom-plan',id:mod.RECORD_ID,revision:3,deleted:true,payload:{}});
 await assert.rejects(s.transport.read(owner),/deleted/);
});
test('expired or changed session blocks read-back and does not report success',async()=>{
 const s=service();
 const original=s.transport.read.bind(s.transport);
 let n=0;
 const session={user:{id:owner},access_token:'test-token',expires_at:Math.floor(Date.now()/1000)+3600};
 // Network response delivered, but subsequent session checks detect logout.
 const unstable=mod.createTestTransport({endpoint:'https://example.supabase.co',publishableKey:'public-test-key',
 getSession:async()=>{n++;return n>2?{...session,user:{id:other}}:session},
 fetcher:async()=>({ok:true,json:async()=>({owner,opId:uuid,revision:1,replayed:false})})});
 await assert.rejects(unstable.save(owner,0,doc(),uuid),/Account changed/);
 assert.equal(typeof original,'function');
});

test('existing Supabase custom-plan adapter integrates with revision-aware coordinator',async()=>{
 const {synchronize}=require('../myliftcoach2/v2-schedule-sync-coordinator.js');
 const s=service(),local=doc();
 const result=await synchronize({owner,localDocument:local,checkpoint:{revision:0,document:null},
  transport:s.transport,operationId:uuid,explicitApproval:true});
 assert.equal(result.status,'verified');
 assert.equal(result.revision,1);
 assert.equal(result.readBackMatches,true);
 assert.equal(s.counts().writes,1);
 assert.deepEqual(s.row().payload.document,local);
 const repeat=await synchronize({owner,localDocument:local,
  checkpoint:{revision:1,document:local},transport:s.transport,operationId:uuid,explicitApproval:true});
 assert.equal(repeat.status,'already-saved');
 assert.equal(s.counts().writes,1);
});

test('browser-facing backup transport is read-only even with a verified session',async()=>{
 const s=service();
 const reader=mod.createReadOnly({endpoint:'https://example.supabase.co',publishableKey:'public-test-key',
  getSession:async()=>({user:{id:owner},access_token:'test-token',expires_at:Math.floor(Date.now()/1000)+3600}),
  fetcher:async(url,req)=>{
   assert.match(url,/mlc2_v1_read$/);
   assert.equal(JSON.parse(req.body).p_type,'custom-plan');
   return {ok:true,json:async()=>null};
  }});
 assert.equal(typeof reader.read,'function');
 assert.equal(typeof reader.save,'undefined');
 assert.deepEqual(await reader.read(owner),{revision:0,document:null});
 assert.deepEqual(s.counts(),{reads:0,writes:0});
});
