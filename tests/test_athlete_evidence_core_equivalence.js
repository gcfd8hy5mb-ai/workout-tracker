const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const intelligence=fs.readFileSync('myliftcoach-intelligence-core.js','utf8');
const evidence=fs.readFileSync('myliftcoach-athlete-evidence-core.js','utf8');
const foundation=fs.readFileSync('athlete-learning-engine.js','utf8');
const contextCode=fs.readFileSync('athlete-context-learning-v8.js','utf8');
const doseCode=fs.readFileSync('athlete-dose-response-v8_2.js','utf8');
const recoveryCode=fs.readFileSync('athlete-recovery-lag-v8_3.js','utf8');
const progressionCode=fs.readFileSync('athlete-progression-response-v8_4.js','utf8');
function sandbox(){const window={};const ctx={window,console,setTimeout:()=>0,Date,Object,JSON,Number,String,Boolean,Math,Array,RegExp};vm.createContext(ctx);return {window,ctx};}
for(const [name,code,unavailable,api,needsFoundation] of [['context',contextCode,'MYLIFTCOACH_ATHLETE_CONTEXT_LEARNING_UNAVAILABLE','myliftcoachAthleteExerciseContexts',true],['dose',doseCode,'MYLIFTCOACH_ATHLETE_DOSE_UNAVAILABLE','myliftcoachAthleteDoseProfile',true],['recovery',recoveryCode,'MYLIFTCOACH_ATHLETE_RECOVERY_UNAVAILABLE','myliftcoachAthleteRecoveryProfile',false],['progression',progressionCode,'MYLIFTCOACH_ATHLETE_PROGRESSION_UNAVAILABLE','myliftcoachAthleteProgressionProfile',true]]){
 const missing=sandbox();vm.runInContext(code,missing.ctx);assert.equal(missing.window[unavailable],'shared_core_missing',`${name} must fail closed without shared cores`);assert.equal(missing.window[api],undefined,`${name} must not install legacy standalone APIs`);
 const prod=sandbox();vm.runInContext(intelligence,prod.ctx);vm.runInContext(evidence,prod.ctx);if(needsFoundation)vm.runInContext(foundation,prod.ctx);vm.runInContext(code,prod.ctx);assert.equal(typeof prod.window[api],'function',`${name} must install through production cores`);assert.equal(prod.window[unavailable],undefined);
}
assert(!contextCode.includes('shared?.clamp||'),'context fallback clamp must be removed');assert(!contextCode.includes('kit?kit.'),'context standalone toolkit branches must be removed');
assert(!doseCode.includes('shared?.clamp||'),'dose fallback clamp must be removed');assert(!doseCode.includes('kit?kit.'),'dose standalone toolkit branches must be removed');
assert(!recoveryCode.includes('shared?.clamp||'),'recovery fallback clamp must be removed');assert(!recoveryCode.includes('kit?kit.'),'recovery standalone toolkit branches must be removed');
assert(!recoveryCode.includes('const ageDays='),'recovery standalone age calculation must be removed');assert(!recoveryCode.includes('const freshness='),'recovery standalone freshness calculation must be removed');
assert(!contextCode.includes('function install(attempt=0)'),'context legacy wrapper installer must be removed');assert(!doseCode.includes('function install(attempt=0)'),'dose legacy wrapper installer must be removed');
assert(!progressionCode.includes('shared?.clamp||'),'progression must use shared evidence core');assert(!progressionCode.includes('kit?kit.'),'progression must not include standalone toolkit branches');
const cfg=fs.readFileSync('supabase-config.js','utf8');
const intelPos=cfg.indexOf('myliftcoach-intelligence-core.js?v=1.3'),sharedPos=cfg.indexOf('myliftcoach-athlete-evidence-core.js?v=1'),ctxPos=cfg.indexOf('athlete-context-learning-v8.js?v=8.0.1'),dosePos=cfg.indexOf('athlete-dose-response-v8_2.js?v=8.2.1'),recoveryPos=cfg.indexOf('athlete-recovery-lag-v8_3.js?v=8.3.1'),progressionPos=cfg.indexOf('athlete-progression-response-v8_4.js?v=8.4');
assert(intelPos>0&&sharedPos>intelPos&&ctxPos>sharedPos&&dosePos>sharedPos&&recoveryPos>sharedPos&&progressionPos>recoveryPos,'production cores must load before all Athlete evidence models');
console.log('Athlete context/dose/recovery/progression shared-core dependency and fail-closed behavior pass.');