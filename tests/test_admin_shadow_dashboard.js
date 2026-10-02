const assert=require('assert');
const fs=require('fs');
for(const file of ['myliftcoach-shadow-cloud.js','myliftcoach-admin-shadow-dashboard-v4.js','myliftcoach-startup-smooth.js']){
  const source=fs.readFileSync(file,'utf8');
  assert.doesNotThrow(()=>new Function(source),`${file} must parse`);
  assert(!/service[_-]?role/i.test(source),`${file} must never contain a service-role key`);
}
const sync=fs.readFileSync('myliftcoach-shadow-cloud.js','utf8');
assert(sync.includes('myliftcoach_shadow_events'),'shadow telemetry must write only to the dedicated RLS table');
assert(sync.includes('s.user.id'),'shadow telemetry must bind writes to the authenticated session user');
const dashboard=fs.readFileSync('myliftcoach-admin-shadow-dashboard-v4.js','utf8');
assert(dashboard.includes('myliftcoach_admins?select=user_id'),'owner access must be checked through the protected admin table');
assert(dashboard.includes('myliftcoach_shadow_admin_events'),'dashboard must read the sanitized security-invoker view');
assert(!dashboard.includes('/rpc/'),'dashboard must not depend on a privileged RPC');
assert(dashboard.includes("decision_type||'unknown'"),'dashboard readiness must group by exact decision type');
assert(dashboard.includes("context||'global'"),'dashboard readiness must group by exact decision context');
assert(dashboard.includes('count<8'),'V10.3.6 minimum observed-outcome gate must remain');
assert(dashboard.includes('meanReliability<.75'),'V10.3.6 reliability gate must remain');
assert(dashboard.includes('meanConfidence<.72'),'V10.3.6 confidence gate must remain');
assert(dashboard.includes('weightedError>.38'),'V10.3.6 weighted-error gate must remain');
assert(dashboard.includes('successRate<.58'),'V10.3.6 success-rate gate must remain');
assert(dashboard.includes('qualifiedCategories'),'athlete summary must report qualified categories rather than a blended readiness score');
const loader=fs.readFileSync('myliftcoach-startup-smooth.js','utf8');
assert(loader.includes('myliftcoach-shadow-cloud.js?v=1'),'shadow telemetry must load in production');
assert(loader.includes('myliftcoach-admin-shadow-dashboard-v4.js?v=1'),'category-specific owner dashboard must load in production');
assert(!loader.includes('myliftcoach-admin-shadow-dashboard-v3.js'),'old blended readiness dashboard must no longer load');
console.log('MYLIFTCOACH category-specific owner shadow dashboard security regression passed');