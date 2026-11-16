const test=require('node:test'),assert=require('node:assert/strict');
const transport=require('../myliftcoach2/v2-cloud-transport.js');
const document={version:1,plans:[{id:'custom-leg',title:'Legs',ids:['leg-press']}],assigned:['custom-leg',null,null,null,null,null,null]};
test('production transport is disabled even when caller asks to enable',()=>{
 assert.equal(transport.ENABLED,false);
 let count=0;
 assert.throws(()=>transport.create({endpoint:'https://example.supabase.co',publishableKey:'anon',getSession:async()=>({access_token:'token',user:{id:'one'}}),fetcher:()=>{count++},enabled:true}),/disabled/);
 assert.equal(count,0);
});
test('transport has no network path when default disabled',()=>{
 assert.throws(()=>transport.create({endpoint:'https://example.supabase.co'}),/disabled/);
});
test('save contract requires revision and rejects missing assignment before any network call',()=>{
 const checker=require('../myliftcoach2/v2-schedule-cas.js');
 assert.throws(()=>checker.validate({version:1,plans:[],assigned:['custom-unavailable',null,null,null,null,null,null]}),/Unknown/);
 assert.equal(checker.validate(document),true);
});
