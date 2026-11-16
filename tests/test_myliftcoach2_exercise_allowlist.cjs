const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const original=fs.readFileSync(path.join(root,'myliftcoach2/original-exercise-catalog.js'),'utf8');
const app=fs.readFileSync(path.join(root,'myliftcoach2/app.js'),'utf8');
const sql=fs.readFileSync(path.join(root,'docs/sql/prism-v2-private-rpc.DRAFT.sql'),'utf8');
const demo=app.slice(app.indexOf('const exercises=['),app.indexOf('const plans=['));
const oldIds=[...original.matchAll(/\{\s*id:"([a-z0-9-]+)"/g)].map(m=>m[1]);
const demoIds=[...demo.matchAll(/\{id:'([a-z0-9-]+)'/g)].map(m=>m[1]);
const canonical=[...new Set([...oldIds,...demoIds])].sort();
const start=sql.indexOf('create or replace function prism_v2_private.is_supported_exercise(');
const end=sql.indexOf('revoke all on function prism_v2_private.is_supported_exercise(',start);
const sqlIds=[...sql.slice(start,end).matchAll(/'([a-z0-9-]+)'/g)].map(m=>m[1]).sort();
test('SQL exercise allowlist matches every approved original and preview exercise',()=>{
 assert.equal(oldIds.length,60);
 assert.equal(demoIds.length,12);
 assert.equal(canonical.length,63);
 assert.deepEqual(sqlIds,canonical);
});
test('guarded save rejects unknown exercise IDs and checker is not directly exposed',()=>{
 assert.match(sql,/not prism_v2_private\.is_supported_exercise\(element #>> '\{\}'\)/);
 assert.match(sql,/Invalid or unsupported exercise identifier/);
 assert.match(sql,/revoke all on function prism_v2_private\.is_supported_exercise\(text\) from public, anon, authenticated/);
 assert.doesNotMatch(sql,/grant execute on function prism_v2_private\.is_supported_exercise\(text\) to authenticated/);
});
