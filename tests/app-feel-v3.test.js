const fs=require('fs');const assert=require('assert');const css=fs.readFileSync('app-feel.css','utf8');const js=fs.readFileSync('app-feel.js','utf8');
for(const forbidden of ['localStorage','sessionStorage','supabase','PRISMDeviceStore','AdaptiveFeedback','CoachDecision','fetch('])assert(!js.includes(forbidden),`app-feel.js must not use ${forbidden}`);
assert(css.includes('.finish-workout'),'workout action polish missing');assert(css.includes('.tracking'),'tracking focus polish missing');assert(css.includes('safe-area-inset-bottom'),'safe area missing');assert(css.includes('prefers-reduced-motion'),'reduced motion missing');
console.log('App Feel V3 workout-flow/isolation checks passed');
