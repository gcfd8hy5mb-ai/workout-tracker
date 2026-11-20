const test=require('node:test'),assert=require('node:assert/strict');
const {synchronize,inspect}=require('../myliftcoach2/v2-schedule-sync-coordinator.js');
const owner='owner-one',other='owner-two';
const document=(title='Legs')=>({version:1,plans:[{id:'custom-a',title,ids:['leg-press']}],
 assigned:['custom-a',null,null,null,null,null,null],
 overrides:{'2026-11-20':null},recurring:[{start:'2026-11-13',end:null,workoutId:'custom-a'}]});
function fake(initial=null,revision=0){
 let current={revision,document:initial},reads=0,writes=0;
 const transport={
  async read(id){assert.equal(id,owner);reads++;return structuredClone(current)},
  async save(id,expected,local){assert.equal(id,owner);if(expected!==current.revision)throw Error('Schedule changed on another device');
   writes++;current={revision:current.revision+1,document:structuredClone(local)};return structuredClone(current)}
 };
 return {transport,counts:()=>({reads,writes}),replace(doc){current={revision:current.revision+1,document:doc}}};
}
test('explicit isolated first save is read back and does not mutate local schedule',async()=>{
 const x=fake(),local=document(),before=JSON.stringify(local);
 const r=await synchronize({owner,localDocument:local,checkpoint:{revision:0,document:null},
  transport:x.transport,explicitApproval:true});
 assert.equal(r.status,'verified');assert.equal(r.revision,1);assert.equal(r.writeCount,1);
 assert.deepEqual(x.counts(),{reads:2,writes:1});assert.equal(JSON.stringify(local),before);
});
test('identical remote schedule short-circuits without a duplicate save',async()=>{
 const x=fake(document(),4);
 const r=await synchronize({owner,localDocument:document(),checkpoint:{revision:4,document:document()},
  transport:x.transport,explicitApproval:true});
 assert.equal(r.status,'already-saved');assert.equal(r.writeCount,0);
 assert.deepEqual(x.counts(),{reads:1,writes:0});
});
test('new device revision blocks stale cloud overwrite before any write',async()=>{
 const x=fake(document(),4),checkpoint={revision:4,document:document()};
 x.replace(document('Updated on phone'));
 await assert.rejects(synchronize({owner,localDocument:document('Laptop update'),checkpoint,
  transport:x.transport,explicitApproval:true}),/changed since checkpoint/);
 assert.equal(x.counts().writes,0);
});
test('new document at cloud revision zero blocks blind first-save',async()=>{
 const x=fake(),checkpoint={revision:0,document:null};
 x.replace(document('Other device'));
 await assert.rejects(synchronize({owner,localDocument:document(),checkpoint,transport:x.transport,
  explicitApproval:true}),/changed since checkpoint/);
 assert.equal(x.counts().writes,0);
});
test('explicit approval is always required before network operations',async()=>{
 const x=fake();
 await assert.rejects(synchronize({owner,localDocument:document(),
  checkpoint:{revision:0,document:null},transport:x.transport}),/Explicit user approval/);
 assert.deepEqual(x.counts(),{reads:0,writes:0});
});
test('same cloud revision with unexpectedly modified document is a conflict',async()=>{
 const x=fake(document('Changed while offline'),3);
 await assert.rejects(synchronize({owner,localDocument:document('My edit'),
  checkpoint:{revision:3,document:document()},transport:x.transport,explicitApproval:true}),/changed since checkpoint/);
 assert.equal(x.counts().writes,0);
});
test('malformed documents and empty owner fail without cloud activity',async()=>{
 const x=fake();
 await assert.rejects(synchronize({owner,localDocument:{...document(),assigned:['missing',null,null,null,null,null,null]},
  checkpoint:{revision:0,document:null},transport:x.transport,explicitApproval:true}),/Unknown default workout/);
 await assert.rejects(synchronize({owner:'',localDocument:document(),checkpoint:{revision:0,document:null},
  transport:x.transport,explicitApproval:true}),/Authenticated owner/);
 assert.deepEqual(x.counts(),{reads:0,writes:0});
});
test('ambiguous read-back is never retried automatically',async()=>{
 let writes=0,reads=0;
 const transport={async read(){reads++;if(reads===1)return {revision:0,document:null};throw Error('offline')},
  async save(id,rev,doc){writes++;return {revision:1,document:doc}}};
 await assert.rejects(synchronize({owner,localDocument:document(),checkpoint:{revision:0,document:null},
  transport,explicitApproval:true}),/do not retry automatically/);
 assert.equal(writes,1);assert.equal(reads,2);
});

test('read-only cross-device inspection distinguishes synchronized and changed schedules without writes',async()=>{
 const base=document(),cloud=fake(base,3),checkpoint={revision:3,document:base};
 const synced=await inspect({owner,localDocument:document(),checkpoint,transport:cloud.transport});
 assert.equal(synced.status,'in-sync');
 assert.equal(synced.writeCount,0);
 assert.equal(synced.safeToOfferSave,false);
 const local=await inspect({owner,localDocument:document('Edited on laptop'),checkpoint,transport:cloud.transport});
 assert.equal(local.status,'local-only');
 assert.equal(local.safeToOfferSave,true);
 cloud.replace(document('Edited on phone'));
 const remote=await inspect({owner,localDocument:document(),checkpoint,transport:cloud.transport});
 assert.equal(remote.status,'cloud-newer');
 assert.equal(remote.safeToOfferSave,false);
 const conflict=await inspect({owner,localDocument:document('Edited on laptop'),checkpoint,transport:cloud.transport});
 assert.equal(conflict.status,'conflict');
 assert.equal(conflict.remoteDocument.plans[0].title,'Edited on phone');
 assert.equal(conflict.safeToOfferSave,false);
 assert.equal(cloud.counts().writes,0);
});
test('read-only schedule inspection refuses unauthenticated, malformed or changing drafts',async()=>{
 const x=fake();
 await assert.rejects(inspect({owner:'',localDocument:document(),checkpoint:{revision:0,document:null},transport:x.transport}),/Authenticated owner/);
 await assert.rejects(inspect({owner,localDocument:{...document(),assigned:['unknown',null,null,null,null,null,null]},checkpoint:{revision:0,document:null},transport:x.transport}),/Unknown default workout/);
 assert.deepEqual(x.counts(),{reads:0,writes:0});
});
