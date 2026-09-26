(() => {
  "use strict";

  const cfg = window.PRISM_SUPABASE_CONFIG;
  if (!cfg?.url || !cfg?.publishableKey) return;

  const API = `${cfg.url}/rest/v1/prism_backups`;
  const AUTH = `${cfg.url}/auth/v1`;
  const SESSION_KEY = "prismSupabaseSessionV1";
  const APP_VERSION = "beta39";
  const EXCLUDED_KEYS = new Set([SESSION_KEY]);

  const headers = (token, extra = {}) => ({
    apikey: cfg.publishableKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extra
  });

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  function writeSession(session) {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }

  function snapshotLocalStorage() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || EXCLUDED_KEYS.has(key)) continue;
      data[key] = localStorage.getItem(key);
    }
    return { localStorage: data };
  }

  function restoreLocalStorage(backup) {
    const data = backup?.localStorage;
    if (!data || typeof data !== "object") throw new Error("Backup does not contain PRISM local data.");
    Object.entries(data).forEach(([key, value]) => {
      if (!EXCLUDED_KEYS.has(key) && typeof value === "string") localStorage.setItem(key, value);
    });
  }

  async function authRequest(path, body) {
    const response = await fetch(`${AUTH}/${path}`, {
      method: "POST",
      headers: { apikey: cfg.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.msg || json.message || json.error_description || "Authentication failed.");
    return json;
  }

  async function signUp(email, password) {
    const json = await authRequest("signup", { email, password });
    if (json.access_token) writeSession(json);
    return json;
  }

  async function signIn(email, password) {
    const json = await authRequest("token?grant_type=password", { email, password });
    writeSession(json);
    return json;
  }

  function signOut() { writeSession(null); }

  async function currentUser() {
    const session = readSession();
    if (!session?.access_token) return null;
    const response = await fetch(`${AUTH}/user`, { headers: headers(session.access_token) });
    if (!response.ok) return null;
    return response.json();
  }

  async function backupNow() {
    const session = readSession();
    const user = await currentUser();
    if (!session?.access_token || !user?.id) throw new Error("Sign in to PRISM Cloud first.");
    const payload = {
      user_id: user.id,
      app_version: APP_VERSION,
      backup_version: 1,
      backup_data: snapshotLocalStorage(),
      client_updated_at: new Date().toISOString()
    };
    const response = await fetch(`${API}?on_conflict=user_id`, {
      method: "POST",
      headers: headers(session.access_token, { Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify(payload)
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.message || "Cloud backup failed.");
    return Array.isArray(json) ? json[0] : json;
  }

  async function getBackup() {
    const session = readSession();
    const user = await currentUser();
    if (!session?.access_token || !user?.id) throw new Error("Sign in to PRISM Cloud first.");
    const response = await fetch(`${API}?user_id=eq.${encodeURIComponent(user.id)}&select=*`, {
      headers: headers(session.access_token)
    });
    const json = await response.json().catch(() => []);
    if (!response.ok) throw new Error(json.message || "Could not load cloud backup.");
    return json[0] || null;
  }

  async function restoreBackup({ reload = true } = {}) {
    const row = await getBackup();
    if (!row) throw new Error("No PRISM cloud backup exists for this account yet.");
    restoreLocalStorage(row.backup_data);
    if (reload) location.reload();
    return row;
  }

  window.PRISMCloud = Object.freeze({
    signUp,
    signIn,
    signOut,
    currentUser,
    backupNow,
    getBackup,
    restoreBackup,
    hasSession: () => !!readSession()?.access_token
  });

  window.dispatchEvent(new CustomEvent("prism-cloud-ready"));
})();
