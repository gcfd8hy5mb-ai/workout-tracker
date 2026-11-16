const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path');
const sql=fs.readFileSync(path.join(__dirname,'../docs/sql/prism-v2-private-rpc.DRAFT.sql'),'utf8');
const checker=require('../myliftcoach2/v2-recurring-schedule.js');
test('server validates strict dates and schedule rule workout references',()=>{
 assert.match(sql,/prism_v2_private\.valid_day\(date_key\)/);
 assert.match(sql,/not prism_v2_private\.valid_day\(rule->>'start'\)/);
 assert.match(sql,/Invalid dated workout override/);
 assert.match(sql,/Invalid repeating workout rule/);
 assert.match(sql,/not \(\(rule->>'workoutId'\)=any\(names\)\)/);
});
test('server checks duration, date bounds and array sizes',()=>{
 assert.match(sql,/not between 1 and 520/);
 assert.match(sql,/pg_catalog\.jsonb_array_length\(new_document->'recurring'\)>500/);
 assert.match(sql,/pg_catalog\.jsonb_typeof\(new_document->'overrides'\) <> 'object'/);
});
test('existing recurring data remains intact in pure read-only preview',()=>{
 const doc={version:1,plans:[{id:'custom-a',title:'Work',ids:['leg-press']}],assigned:['custom-a',null,null,null,null,null,null],overrides:{'2026-11-20':'custom-a'},recurring:[{start:'2026-11-13',end:'2027-01-29',workoutId:'custom-a'}]};
 assert.equal(checker.resolve(doc,'2026-11-20').source,'one-time');
 assert.equal(checker.resolve(doc,'2026-11-27').source,'recurring');
});
