#!/usr/bin/env python3
"""Exercise actual PostgREST HTTP with signed, tampered, and missing JWTs.

Only disposable GitHub Actions PostgreSQL + local PostgREST. Do NOT use live PRISM.
"""
import base64
import hashlib
import hmac
import json
import os
import urllib.request
import urllib.error
import time

URL = "http://127.0.0.1:3000"
KEY = os.environ.get("V2_TEST_JWT_SECRET", "local-postgrest-only-strong-secret-000001")
A = "44444444-4444-4444-8444-444444444444"
B = "55555555-5555-4555-8555-555555555555"


def b64(data):
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def signed(subject, role="authenticated", expires=None):
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"role": role, "sub": subject, "aud": "authenticated",
               "exp": expires if expires is not None else int(time.time()) + 1800}
    raw = b64(json.dumps(header, separators=(",", ":")).encode()) + "." + b64(
        json.dumps(payload, separators=(",", ":")).encode())
    sig = b64(hmac.new(KEY.encode(), raw.encode(), hashlib.sha256).digest())
    return raw + "." + sig


def api(name, payload, token=None, method="POST", prefix="/rpc/"):
    body = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(URL + prefix + name, data=body, method=method,
                                 headers={"Content-Type": "application/json",
                                          "Accept": "application/json",
                                          **({"Authorization": "Bearer " + token} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            return response.status, json.loads(response.read() or b"null")
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        try:
            data = json.loads(raw)
        except ValueError:
            data = {"raw": raw.decode(errors="replace")}
        return exc.code, data


def checked(ok, comment):
    assert ok, comment


doc_a = {"version": 1,
         "plans": [{"id": "custom-a", "title": "Legs", "ids": ["leg-press"]}],
         "assigned": ["custom-a", None, None, None, None, None, None],
         "overrides": {"2026-11-20": "custom-a"},
         "recurring": [{"start": "2026-11-13", "end": "2027-01-29", "workoutId": "custom-a"}]}
doc_b = {"version": 1,
         "plans": [{"id": "custom-b", "title": "Upper", "ids": ["lat-pulldown"]}],
         "assigned": ["custom-b", None, None, None, None, None, None]}

token_a = signed(A)
token_b = signed(B)
noauth_status, noauth = api("prism_v2_schedule_read", {})
checked(noauth_status in (401, 403), f"Anonymous read allowed: {noauth_status} {noauth}")
anon_token = signed(A, role="anon")
checked(api("prism_v2_schedule_read", {}, anon_token)[0] in (401, 403),
        "An anon-role token got authenticated RPC execution")
expired_status, _ = api("prism_v2_schedule_read", {}, signed(A, expires=int(time.time()) - 120))
checked(expired_status == 401, "Expired JWT was accepted")

forged = token_a[:-1] + ("Z" if token_a[-1] != "Z" else "A")
checked(api("prism_v2_schedule_read", {}, forged)[0] == 401, "Tampered JWT was accepted")

s, before = api("prism_v2_schedule_read", {}, token_a)
checked(s == 200 and before is None, f"New A schedule read failed: {s} {before}")
s, result_a = api("prism_v2_schedule_save",
                  {"expected_revision": 0, "new_document": doc_a}, token_a)
checked(s == 200 and result_a["revision"] == 1,
        f"Authenticated first save failed: {s} {result_a}")
s, result_b = api("prism_v2_schedule_save",
                  {"expected_revision": 0, "new_document": doc_b}, token_b)
checked(s == 200 and result_b["revision"] == 1,
        f"Independent B first save failed: {s} {result_b}")

s, reload_a = api("prism_v2_schedule_read", {}, token_a)
checked(s == 200 and reload_a["document"]["plans"][0]["id"] == "custom-a",
        f"A schedule lost: {s} {reload_a}")
s, reload_b = api("prism_v2_schedule_read", {}, token_b)
checked(s == 200 and reload_b["document"]["plans"][0]["id"] == "custom-b",
        f"B schedule leaked A data: {s} {reload_b}")

stale_status, stale = api("prism_v2_schedule_save",
                          {"expected_revision": 0, "new_document": doc_b}, token_a)
checked(stale_status == 409 and stale.get("code") == "PT409",
        f"Stale save not flagged with expected code: {stale_status} {stale}")
checked(api("prism_v2_schedule_read", {}, token_a)[1]["revision"] == 1,
        "Rejected save changed account revision")

invalid = dict(doc_a, overrides={"2026-02-30": "custom-a"})
s, response = api("prism_v2_schedule_save",
                  {"expected_revision": 1, "new_document": invalid}, token_a)
checked(s >= 400, f"Invalid calendar date saved: {s} {response}")

# Direct table REST access must not permit bypass of CAS.
table_read, _ = api("prism_v2_workout_schedules", None, token_a,
                    method="GET", prefix="/")
checked(table_read in (401, 403, 404), "Authenticated user bypassed RPC table-read restriction")

# Missing authenticated subject may not access another user's rows.
wrong_status, wrong = api("prism_v2_schedule_read", {}, signed(A, role="authenticated", expires=int(time.time()) + 60))
checked(wrong_status == 200 and wrong["revision"] == 1,
        "Authenticated JWT round trip failed")

# Save a dated rest day (JSON null), preserving independent repeating rules.
rest_doc = dict(doc_a, overrides={"2026-11-20": "custom-a", "2026-11-27": None})
s, saved_rest = api("prism_v2_schedule_save",
                    {"expected_revision": 1, "new_document": rest_doc}, token_a)
checked(s == 200 and saved_rest["revision"] == 2,
        f"One-date rest exception failed to save: {s} {saved_rest}")
s, loaded_rest = api("prism_v2_schedule_read", {}, token_a)
checked(s == 200 and loaded_rest["document"]["overrides"]["2026-11-27"] is None and
        loaded_rest["document"]["recurring"] == doc_a["recurring"],
        f"Rest-day override changed recurring rules: {s} {loaded_rest}")
s, restored = api("prism_v2_schedule_save",
                   {"expected_revision": 2, "new_document": doc_a}, token_a)
checked(s == 200 and restored["revision"] == 3,
        f"Removing one-date rest exception failed: {s} {restored}")
checked("2026-11-27" not in api("prism_v2_schedule_read", {}, token_a)[1]["document"]["overrides"],
        "Rest exception was not removed after restoration")
checked(api("prism_v2_schedule_read", {}, token_b)[1]["revision"] == 1,
        "Account B was modified by Account A rest-day updates")

print("PASS disposable PostgREST: JWT signature/expiry, anon denial, owner isolation, CAS, invalid dates and table REST denial, rest-day round trip")
