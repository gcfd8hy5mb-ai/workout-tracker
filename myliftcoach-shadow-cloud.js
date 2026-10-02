/* MYLIFTCOACH shadow telemetry sync. Account-scoped writes only. */
(()=>{'use strict';
const session=()=>{try{return JSON.parse(window.localStorage.getItem('prismSupabaseSessionV1')||'null')}catch{return null}};
const config=()=>window.PRISM_SUPABASE_CONFIG||null;
async function upsert(kind,rows){const s=session(),c=config();if(!s?.access_token||!s?.user?.id||!c?.url||!c?.publishableKey||!Array.isArray(rows)||!rows.length)return false;const body=rows.slice(-500).filter(r=>r&&r.id).map(r=>({user_id:s.user.id,event_id:String(r.id),event_kind:kind,occurred_at:r.at||new Date().toISOString(),payload:r}));if(!body.length)return false;const res=await fetch(new URL('/rest/v1/myliftcoach_shadow_events?on_conflict=user_id,event_id',c.url),{method:'POST',cache:'no-store',headers:{apikey:c.publishableKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)});return res.ok}
async function sync(){const s=session();if(!s?.user?.id)return false;try{await Promise.all([upsert('shadow_decision',window.myliftcoachV104ShadowRows?.()||[]),upsert('decision_quality',window.myliftcoachDecisionQualityRows?.()||[]),upsert('calibration',window.myliftcoachAutonomyCalibrationRows?.()||[])]);return true}catch{return false}}
window.myliftcoachShadowCloudSync=sync;
window.addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sync()});
setTimeout(sync,1500);setInterval(sync,30000);
})();