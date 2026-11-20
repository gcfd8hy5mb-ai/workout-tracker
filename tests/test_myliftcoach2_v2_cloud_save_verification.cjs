const test=require('node:test'),assert=require('node:assert/strict');
const {verify}=require('../myliftcoach2/v2-cloud-save-verification.js');
const owner='account-a';
const doc=()=>({version:1,plans:[{id:'custom-a',title:'Original custom',ids:['leg-press']}],
 assigned:['custom-a',null,null,null,null,null,null],overrides:{'2026-11-21':null},recurring:[]});
test('successful isolated save requires a separate matching read-back',async()=>{
 const data=doc(),before=JSON.stringify(data),calls=[];
 const transport={
  async save(id,revision,document){calls.push('save');assert.equal(id,owner);assert.equal(revision,0);return {revision:1,document}},
  async read(id){calls.push('read');assert.equal(id,owner);return {revision:1,document:data}}
 };
 const result=await verify({owner,expectedRevision:0,document:data,transport});
 assert.equal(result.verified,true);assert.equal(result.readBackMatches,true);
 assert.deepEqual(calls,['save','read']);assert.equal(JSON.stringify(data),before);
});
test('read-back loss is indeterminate and never silently retries write',async()=>{
 let saves=0;const transport={async save(id,r,d){saves++;return {revision:1,document:d}},
  async read(){throw Error('offline')}};
 await assert.rejects(verify({owner,expectedRevision:0,document:doc(),transport}),/do not retry automatically/);
 assert.equal(saves,1);
});
test('a remote overwrite between save and read-back is detected',async()=>{
 const transport={async save(id,r,d){return {revision:1,document:d}},
  async read(){return {revision:2,document:doc()}}};
 await assert.rejects(verify({owner,expectedRevision:0,document:doc(),transport}),/differs/);
});
test('stale revision rejected by transport is never retried by verifier',async()=>{
 let count=0;const transport={async save(){count++;throw Error('Schedule changed on another device')},
  async read(){throw Error('should not read')}};
 await assert.rejects(verify({owner,expectedRevision:0,document:doc(),transport}),/another device/);
 assert.equal(count,1);
});
test('invalid owner and revision cannot reach transport',async()=>{
 let calls=0;const transport={async save(){calls++},async read(){calls++}};
 await assert.rejects(verify({owner:'',expectedRevision:0,document:doc(),transport}),/requires/);
 await assert.rejects(verify({owner,expectedRevision:-1,document:doc(),transport}),/requires/);
 assert.equal(calls,0);
});
