const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sql=fs.readFileSync(path.join(__dirname,'../docs/sql/prism-v2-owner-hardening.DRAFT.sql'),'utf8');
test('private schedule functions move to least privilege no-login role',()=>{
 assert.match(sql,/create role prism_v2_executor nologin noinherit/);
 assert.match(sql,/alter function prism_v2_private\.schedule_read\(\) owner to prism_v2_executor/);
 assert.match(sql,/alter function prism_v2_private\.schedule_save\(bigint,jsonb\) owner to prism_v2_executor/);
 assert.doesNotMatch(sql,/bypassrls|superuser|login\s+password/i); // note comment strings excluded below
});
test('executor RLS restricts select insert and update to auth uid and user id',()=>{
 assert.match(sql,/for select to prism_v2_executor using \(\(select auth\.uid\(\)\)=user_id\)/);
 assert.match(sql,/for insert to prism_v2_executor with check \(\(select auth\.uid\(\)\)=user_id\)/);
 assert.match(sql,/for update to prism_v2_executor using \(\(select auth\.uid\(\)\)=user_id\)/);
 assert.match(sql,/with check \(\(select auth\.uid\(\)\)=user_id\)/);
});
test('schema create is removed immediately after function ownership change',()=>{
 assert.match(sql,/alter function prism_v2_private\.schedule_save\(bigint,jsonb\) owner to prism_v2_executor;\s*revoke create on schema prism_v2_private from prism_v2_executor/);
});
