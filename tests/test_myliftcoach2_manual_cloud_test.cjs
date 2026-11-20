const test=require('node:test'),assert=require('node:assert/strict');
const {run,journalKey,lastKey}=require('../myliftcoach2/manual-cloud-test.js');
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const inputWorkout={id:'demo-local',title:'Leg test',sets:[{exerciseId:'leg-press',reps:10,weight:50}]};
function setup({failCommit=false,changeOwner=false}={}){
 const map=new Map(),rows=new Map(),calls=[];
 let n=0,session={access_token:'token',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:owner}};
 const args={owner,session:async()=>session,verifyUser:async()=>({id:owner}),
  cryptoAPI:{randomUUID:()=>String(++n).padStart(8,'0')+'-0000-4000-8000-000000000000'},
  storage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)},
  endpoint:'https://example.supabase.co',publishableKey:'test-key',workout:inputWorkout,confirmWrite:true,
  fetcher:async(url,options)=>{
   const name=url.split('/').at(-1),body=JSON.parse(options.body);calls.push({name,body});
   if(name==='mlc2_v1_read')return {ok:true,json:async()=>rows.get(body.p_record_id)||null};
   if(changeOwner)session={...session,user:{id:other}};
   if(failCommit)throw Error('Network result unknown');
   rows.set(body.p_record_id,{owner,type:'session',id:body.p_record_id,revision:1,deleted:false,payload:body.p_payload});
   return {ok:true,json:async()=>({owner,opId:body.p_op_id,revision:1,replayed:false})};
  }
 };
 return {args,calls,rows,map};
}
test('single explicit test copy uses isolated ID, then verifies independent readback',async()=>{
 const h=setup(),r=await run(h.args);
 assert.equal(r.status,'uploaded-verified');assert.equal(r.sets,1);
 assert.deepEqual(h.calls.map(x=>x.name),['mlc2_v1_read','mlc2_v1_commit','mlc2_v1_read']);
 assert.equal(h.calls[1].body.p_base_revision,0);
 assert.equal(h.calls[1].body.p_deleted,false);
 assert.notEqual(h.calls[1].body.p_record_id,inputWorkout.id);
 assert.equal(h.map.has(journalKey(owner)),false);assert.equal(h.map.get(lastKey(owner)),r.recordId);
 assert.equal(inputWorkout.id,'demo-local');
});
test('no permission means zero network calls or writes',async()=>{
 const h=setup();await assert.rejects(run({...h.args,confirmWrite:false}),/Explicit confirmation/);
 assert.equal(h.calls.length,0);
});
test('an ambiguous response leaves journal and never automatically retries',async()=>{
 const h=setup({failCommit:true});
 await assert.rejects(run(h.args),/Network result unknown/);
 assert.equal(h.calls.filter(x=>x.name==='mlc2_v1_commit').length,1);
 assert.ok(h.map.has(journalKey(owner)));
 await assert.rejects(run(h.args),/uncertain outcome/);
 assert.equal(h.calls.filter(x=>x.name==='mlc2_v1_commit').length,1);
});
test('pending record already saved is verified with a read, never re-committed',async()=>{
 const h=setup({failCommit:true});await assert.rejects(run(h.args),/Network result unknown/);
 const p=JSON.parse(h.map.get(journalKey(owner)));
 h.rows.set(p.recordId,{owner,type:'session',id:p.recordId,revision:1,deleted:false,payload:p.payload});
 const result=await run({...h.args,confirmWrite:false});
 assert.equal(result.status,'verified-pending');assert.equal(h.calls.filter(x=>x.name==='mlc2_v1_commit').length,1);
});
test('remote payload mismatch cannot silently be marked verified',async()=>{
 const h=setup({failCommit:true});await assert.rejects(run(h.args),/Network result unknown/);
 const p=JSON.parse(h.map.get(journalKey(owner)));
 h.rows.set(p.recordId,{owner,type:'session',id:p.recordId,revision:1,deleted:false,payload:{title:'Different'}});
 await assert.rejects(run(h.args),/differs/);
 assert.ok(h.map.has(journalKey(owner)));
});
test('cross-owner session change blocks an otherwise successful commit',async()=>{
 const h=setup({changeOwner:true});await assert.rejects(run(h.args),/Account session changed/);
 assert.ok(h.map.has(journalKey(owner)));
});
