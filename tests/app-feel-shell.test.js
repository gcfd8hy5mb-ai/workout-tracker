'use strict';
const fs=require('fs');
const assert=require('assert');

const css=fs.readFileSync('app-feel.css','utf8');
const js=fs.readFileSync('app-feel.js','utf8');
const loader=fs.readFileSync('persistence/photo-scope.js','utf8');

assert(css.includes('prefers-reduced-motion:reduce'),'app shell must respect reduced motion');
assert(css.includes('safe-area-inset-left'),'app shell must respect iPhone safe areas');
assert(js.includes('display-mode: standalone'),'app shell must detect installed PWA mode');
assert(js.includes('visualViewport'),'app shell must account for iOS viewport/keyboard changes');
assert(loader.includes("app-feel.css?v=1"),'presentation stylesheet must load');
assert(loader.includes("app-feel.js?v=1"),'presentation behavior must load');

// Guardrail: the presentation layer must not own product/training persistence.
for(const forbidden of ['localStorage','sessionStorage','PRISMDeviceStore','AdaptiveFeedback','AdaptiveSetCoach','supabase']){
  assert(!js.includes(forbidden),`app-feel.js must not reference ${forbidden}`);
  assert(!css.includes(forbidden),`app-feel.css must not reference ${forbidden}`);
}
console.log('App Feel V1 isolation contract passed.');
