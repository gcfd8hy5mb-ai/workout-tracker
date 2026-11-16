#!/usr/bin/env python3
"""Run role/GUC simulated authenticated integration tests against disposable PG only.

This emulates Supabase auth.uid() in an ephemeral GitHub Actions database.
It is not a real Supabase/JWT or independent security review.
"""
import json
import os
import subprocess
import time

A = "11111111-1111-4111-8111-111111111111"
B = "22222222-2222-4222-8222-222222222222"
D = {
    "version": 1,
    "plans": [{"id": "custom-a", "title": "Legs", "ids": ["leg-press"]}],
    "assigned": ["custom-a", None, None, None, None, None, None],
}
BASE = ["psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-h", "127.0.0.1", "-U", "postgres", "-d", "postgres"]
ENV = dict(os.environ, PGPASSWORD="postgres")

def exec_sql(sql, ok=True):
    p = subprocess.run(BASE, input=sql, text=True, capture_output=True, env=ENV, timeout=30)
    if ok and p.returncode:
        raise AssertionError("Unexpected SQL failure: " + p.stderr + "\nSQL: " + sql)
    if not ok and p.returncode == 0:
        raise AssertionError("Unsafe SQL unexpectedly succeeded: " + sql)
    return p.stdout.strip(), p.stderr

def signed(user, sql, role="authenticated"):
    return f"SET ROLE {role}; SET request.jwt.claim.sub = '{user}'; {sql}"

def doc(title):
    result = dict(D)
    result["plans"] = [dict(D["plans"][0], title=title)]
    return json.dumps(result, separators=(",", ":")).replace("'", "''")

def save(expected, title):
    return f"select public.prism_v2_schedule_save({expected}, '{doc(title)}'::jsonb);"

def read():
    return "select public.prism_v2_schedule_read();"

# Verify hardened function ownership and role grants in disposable database.
meta,_=exec_sql("""select rolcanlogin,rolbypassrls,rolsuper,rolcreaterole
from pg_catalog.pg_roles where rolname='prism_v2_executor';""")
assert meta=='f|f|f|f',f'Unsafe privileged role: {meta}'
owners,_=exec_sql("""select pg_catalog.pg_get_userbyid(p.proowner)
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname='prism_v2_private' and p.proname in ('schedule_read','schedule_save')
order by p.proname;""")
assert owners.splitlines()==['prism_v2_executor','prism_v2_executor'],owners
grants,_=exec_sql("""select
pg_catalog.has_table_privilege('authenticated','public.prism_v2_workout_schedules','SELECT'),
pg_catalog.has_table_privilege('authenticated','public.prism_v2_workout_schedules','INSERT'),
pg_catalog.has_table_privilege('authenticated','public.prism_v2_workout_schedules','UPDATE'),
pg_catalog.has_table_privilege('prism_v2_executor','public.prism_v2_workout_schedules','UPDATE'),
pg_catalog.has_schema_privilege('prism_v2_executor','prism_v2_private','CREATE'),
pg_catalog.pg_has_role('authenticated','prism_v2_executor','MEMBER');""")
assert grants=='f|f|f|t|f|f',f'Unapproved grants: {grants}'
exec_sql("SET ROLE authenticated; SET ROLE prism_v2_executor;",ok=False)

# Independent owner isolation and authenticated save/reload.
out, _ = exec_sql(signed(A, save(0, "Legs")))
assert json.loads(out)["revision"] == 1
assert json.loads(exec_sql(signed(A, read()))[0])["document"]["plans"][0]["title"] == "Legs"
assert exec_sql(signed(B, read()))[0] == ""
exec_sql(signed(B, save(0, "Upper")))
assert json.loads(exec_sql(signed(B, read()))[0])["document"]["plans"][0]["title"] == "Upper"

# Concurrent *first* insert: only one request can create the row.
C = "33333333-3333-4333-8333-333333333333"
exec_sql("insert into auth.users(id) values ('" + C + "');")
startup_one = signed(C, "begin; " + save(0, "First A") + " select pg_sleep(2); commit;")
startup_two = signed(C, save(0, "First B"))
a_process = subprocess.Popen(BASE, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=ENV)
a_process.stdin.write(startup_one)
a_process.stdin.close()
a_process.stdin = None
time.sleep(0.5)
b_process = subprocess.run(BASE, input=startup_two, text=True, capture_output=True, env=ENV, timeout=20)
a_stdout, a_stderr = a_process.communicate(timeout=20)
assert a_process.returncode == 0, a_stderr
assert b_process.returncode != 0, "Concurrent initial insert unexpectedly succeeded"
assert json.loads(exec_sql(signed(C, read()))[0])["revision"] == 1
assert json.loads(exec_sql(signed(C, read()))[0])["document"]["plans"][0]["title"] == "First A"

# Direct reads are forbidden too, so authenticated clients must use the
# narrow account-scoped RPC rather than selecting someone else's row.
exec_sql(signed(A, "select user_id, document from public.prism_v2_workout_schedules;"), ok=False)

# No client table DML, even when signed in.
exec_sql(signed(A, "update public.prism_v2_workout_schedules set revision=999;"), ok=False)
exec_sql(signed(A, "delete from public.prism_v2_workout_schedules;"), ok=False)

# No anonymous wrapper access even if attacker injects a claim.
exec_sql(signed(A, read(), role="anon"), ok=False)
exec_sql(signed(A, save(1, "Attack"), role="anon"), ok=False)

# Rejected stale revision, and no modification of previously saved workout.
exec_sql(signed(A, save(0, "Stale")), ok=False)
assert json.loads(exec_sql(signed(A, read()))[0])["document"]["plans"][0]["title"] == "Legs"
exec_sql(signed(A, save(1, "Legs and Core")))
assert json.loads(exec_sql(signed(A, read()))[0])["revision"] == 2

# Reject invalid assignments and duplicate custom workout identifiers.
bad = dict(D, assigned=["not-a-workout", None, None, None, None, None, None])
exec_sql(signed(A, "select public.prism_v2_schedule_save(2, '" + json.dumps(bad) + "'::jsonb);"), ok=False)
dup = dict(D, plans=[D["plans"][0], D["plans"][0]])
exec_sql(signed(A, "select public.prism_v2_schedule_save(2, '" + json.dumps(dup) + "'::jsonb);"), ok=False)

# Invalid exercise IDs must not enter the account's cloud workout document.
bad_ex = dict(D, plans=[dict(D["plans"][0], ids=["leg-press", "not-a-real-movement"])])
exec_sql(signed(A, "select public.prism_v2_schedule_save(2, '" + json.dumps(bad_ex) + "'::jsonb);"), ok=False)
assert json.loads(exec_sql(signed(A, read()))[0])["revision"] == 2

# Catalog checker is an internal implementation detail, not callable by clients.
exec_sql(signed(A, "select prism_v2_private.is_supported_exercise('leg-press');"), ok=False)
exec_sql(signed(A, "select prism_v2_private.is_supported_exercise('not-a-real-movement');"), ok=False)

# Complete recurring document: overrides and dated repeating plans persist.
scheduled = dict(D,
    overrides={"2026-11-20": "custom-a"},
    recurring=[{"start":"2026-11-13","end":"2027-01-29","workoutId":"custom-a","weeks":12}])
out, _ = exec_sql(signed(A, "select public.prism_v2_schedule_save(2, '" + json.dumps(scheduled) + "'::jsonb);"))
assert json.loads(out)["revision"] == 3
assert json.loads(exec_sql(signed(A, read()))[0])["document"]["recurring"][0]["start"] == "2026-11-13"
# Every invalid case must reject atomically, without changing the verified row.
bad_cases = [
 dict(scheduled, overrides={"2026-02-30":"custom-a"}),
 dict(scheduled, overrides={"2026-11-20":"missing-workout"}),
 dict(scheduled, recurring=[{"start":"2026-11-13","end":"2026-11-06","workoutId":"custom-a"}]),
 dict(scheduled, recurring=[{"start":"2026-11-13","end":None,"workoutId":"missing-workout"}]),
 dict(scheduled, recurring=[{"start":"not-a-date","end":None,"workoutId":"custom-a"}]),
 dict(scheduled, recurring=[{"start":"2026-11-13","end":None,"workoutId":"custom-a","weeks":0}]),
 dict(scheduled, recurring=[{"start":"2026-11-13","end":None,"workoutId":"custom-a","weeks":12.5}]),
 dict(scheduled, recurring={"start":"2026-11-13"}),
 dict(scheduled, overrides=["2026-11-20"]),
]
for bad in bad_cases:
    exec_sql(signed(A, "select public.prism_v2_schedule_save(3, '" + json.dumps(bad) + "'::jsonb);"), ok=False)
assert json.loads(exec_sql(signed(A, read()))[0])["revision"] == 3
assert json.loads(exec_sql(signed(A, read()))[0])["document"]["overrides"]["2026-11-20"] == "custom-a"

# Two independent connections: one transaction holds the row lock while another
# tries to update against the same checkpoint, then must fail on commit of first.
first = signed(A, "begin; " + save(3, "Transaction One") + " select pg_sleep(2); commit;")
second = signed(A, save(3, "Transaction Two"))
p = subprocess.Popen(BASE, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=ENV)
assert p.stdin is not None
p.stdin.write(first)
p.stdin.close()
p.stdin = None
time.sleep(0.5)
stale = subprocess.run(BASE, input=second, text=True, capture_output=True, env=ENV, timeout=20)
stdout, stderr = p.communicate(timeout=20)
assert p.returncode == 0, stderr
assert stale.returncode != 0, "Concurrent stale write incorrectly succeeded"
assert json.loads(exec_sql(signed(A, read()))[0])["document"]["plans"][0]["title"] == "Transaction One"
assert json.loads(exec_sql(signed(A, read()))[0])["revision"] == 4
print("PASS: isolated PG owner isolation, permissions, stale CAS, first-save race, malformed input, concurrent update")
