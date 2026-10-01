const assert=require('assert');
const fs=require('fs');
const doc=fs.readFileSync('docs/intelligence-contract-v1.md','utf8');
assert(doc.includes('window.myliftcoachIntelligence'));
assert(doc.includes('Adaptive Programming remains the only final prescription authority'));
assert(doc.includes('New intelligence consumers should use'));
console.log('intelligence contract docs regression passed');
