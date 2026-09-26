// Real embedded PostgreSQL engine, with test-only Auth/Storage schema stubs.
// This validates SQL semantics; it is not a live Supabase auth/Storage integration test.
const {PGlite}=require('@electric-sql/pglite');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const model=require('../../persistence/storage-model.js');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated;
 create schema auth; create table auth.users(id uuid primary key);
 insert into auth.users values ('${A}'),('${B}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 create schema storage;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id bigint generated always as identity primary key,bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 grant usage on schema public,storage to anon,authenticated;
 grant select,insert,update,delete on storage.objects to authenticated;
 grant usage on all sequences in schema storage to authenticated;`);
 const root=path.join(__dirname,'../../supabase/migrations');
 for(const file of fs.readdirSync(root).sort())await db.exec(fs.readFileSync(path.join(root,file),'utf8'));
 async function as(user,role='authenticated'){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);await db.exec('set role '+role);}
 const local={workoutHistoryV52:JSON.stringify([{id:1,date:'2026-09-26',exercises:[{id:'press',sets:[{weight:100,reps:10}]}]}]),prismCoachInterventionsV1:JSON.stringify([{id:'i',response:{value:'followed'},outcome:{value:'better'}}]),prismAdaptiveProgrammingV1:JSON.stringify({accepted:{p:{proposal:{id:'p'}}},dismissed:{}})};
 const records=(await model.normalize(local)).map(r=>({...r,expected_revision:0}));
 await as(A);
 const batch=await db.query('select public.prism_apply_account_batch($1::jsonb) as data',[JSON.stringify(records)]);
 assert.equal(batch.rows[0].data.length,records.length);
 // Every table policy must hide A from B, not just the tables in this fixture.
 await as(B);
 for(const table of model.TABLES)assert.equal((await db.query('select count(*)::int as n from public.prism_account_'+table)).rows[0].n,0,table);
 await assert.rejects(()=>db.query('insert into public.prism_account_sources(user_id,id,source_key,payload) values($1,$2,$3,$4)',[A,'1'.repeat(64),'bad','{}']),/row-level security/);
 // Same legacy identities are safely reusable by another account.
 await db.query('select public.prism_apply_account_batch($1::jsonb)',[JSON.stringify(records)]);
 await as(A);
 const first=records.find(r=>r.table==='sessions');
 const changed={...first,payload:{...first.payload,workoutTitle:'Updated'},expected_revision:1};
 await db.query('select public.prism_apply_account_batch($1::jsonb)',[JSON.stringify([changed])]);
 await assert.rejects(()=>db.query('select public.prism_apply_account_batch($1::jsonb)',[JSON.stringify([changed])]),/Revision conflict/);
 // A conflict late in the batch rolls back earlier changes in the same transaction.
 const set=records.find(r=>r.table==='sets');
 await assert.rejects(()=>db.query('select public.prism_apply_account_batch($1::jsonb)',[JSON.stringify([{...set,payload:{weight:999,reps:1},expected_revision:1},changed])]),/Revision conflict/);
 assert.equal((await db.query('select weight_value from public.prism_account_sets')).rows[0].weight_value,'100');
 await assert.rejects(()=>db.exec('delete from public.prism_account_sessions'),/permission denied/);
 await assert.rejects(()=>db.query('select public.prism_apply_account_batch($1::jsonb)',[JSON.stringify([{...first,table:'sessions;drop table auth.users'}])]),/Unknown account table/);
 // FK refuses links to a parent belonging only to B.
 await as(B);const extra={...first,id:'2'.repeat(64),expected_revision:0};await db.query('select public.prism_apply_account_batch($1::jsonb)',[JSON.stringify([extra])]);
 await as(A);
 const exercise=records.find(r=>r.table==='session_exercises');
 await assert.rejects(()=>db.query('select public.prism_apply_account_batch($1::jsonb)',[JSON.stringify([{...exercise,id:'3'.repeat(64),parent_id:extra.id,expected_revision:0}])]),/foreign key/);
 // Private photo bucket policies, including forged user folder uploads.
 await db.query("insert into storage.objects(bucket_id,name) values ('prism-account-photos',$1)",[A+'/photo/hash.jpg']);
 await as(B);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await assert.rejects(()=>db.query("insert into storage.objects(bucket_id,name) values ('prism-account-photos',$1)",[A+'/bad.jpg']),/row-level security/);
 await as(null,'anon');
 await assert.rejects(()=>db.exec('select * from public.prism_account_sessions'),/permission denied/);
 await assert.rejects(()=>db.query('select public.prism_apply_account_batch($1::jsonb)',['[]']),/permission denied/);
 await as(null);await assert.rejects(()=>db.query('select public.prism_apply_account_batch($1::jsonb)',['[]']),/Authentication required/);
 await db.close();console.log('PostgreSQL: migrations, A/B RLS, anonymous denial, atomic rollback, stale revision rejection, owner-scoped FKs, and private photo policies pass.');
})().catch(e=>{console.error(e);process.exitCode=1;});
