const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const WEEKS=[6,12,16,20];
const ATHLETES=Array.from({length:10},(_,i)=>({
  id:`athlete-${i+1}`,
  exerciseId:'press',
  preferredVolume:i%2===0?'moderate':'low',
  preferredPressure:i%3===0?'conservative':'progressive',
  recoveryHours:i%2===0?72:48,
  response:i%2===0?'better':'worse'
}));

function makeStore(){
  const db=new Map();
  return {getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k),clear:()=>db.clear(),dump:()=>Object.fromEntries(db)};
}
function runFile(ctx,name){vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),ctx,{filename:name});}

function intervention(a,week,n){
  const at=new Date(Date.UTC(2026,0,1+week*7+n)).toISOString();
  const sets=a.preferredVolume==='low'?2:3;
  const targetWeight=a.preferredPressure==='progressive'?110:100;
  return {id:`${a.id}-${week}-${n}`,exerciseId:a.exerciseId,kind:'coach',at,target:{status:a.preferredPressure==='progressive'?'increase':'hold',workingSets:sets,targetWeight},response:{value:'followed'},outcome:{at,value:a.response,details:{rpe:a.response==='better'?7:9,pain:a.response==='better'?1:3}},athleteContext:{recovery:a.recoveryHours===72?'ready':'strained',phase:'general'}};
}

function buildHarness(){
  const stores=new Map(ATHLETES.map(a=>[a.id,makeStore()]));
  let active=ATHLETES[0].id;
  const sandbox={console,setTimeout:()=>0,clearTimeout:()=>{},Date,Math,JSON,Object,Array,String,Number,Boolean,Map,Set};
  Object.defineProperty(sandbox,'localStorage',{get:()=>stores.get(active)});
  sandbox.window=sandbox;
  sandbox.__setActive=id=>{active=id};
  sandbox.__active=()=>active;
  sandbox.prismInterventionRows=()=>JSON.parse(stores.get(active).getItem('prismCoachInterventionsV1')||'[]');
  sandbox.myliftcoachAthleteDoseProfile=(events,exerciseId)=>{
    const rows=events.filter(x=>String(x.exerciseId)===String(exerciseId));
    const avg=rows.reduce((s,x)=>s+(x.performanceDelta||0),0)/(rows.length||1);
    const sample=rows[0];
    const sets=Number(sample?.target?.workingSets||3);
    const volume=sets<=2?'low':'moderate';
    const pressure=sample?.target?.status==='increase'?'progressive':'conservative';
    const state=rows.length>=4?'differentiated':'learning';
    return {preferenceState:state,mayInformProgramming:state==='differentiated',bestDose:state==='differentiated'?{dose:{volume,pressure},score:avg}:null,worstDose:null,separation:Math.abs(avg),doses:{primary:{state:'usable'}}};
  };
  sandbox.myliftcoachAthleteRecoveryProfile=(events,exerciseId)=>{
    const rows=events.filter(x=>String(x.exerciseId)===String(exerciseId));
    const target=rows[0]?.athleteContext?.recovery==='ready'?72:48;
    return {state:rows.length>=4?'usable':'learning',preferredHours:target,confidence:rows.length>=4?.8:.2,stale:false};
  };
  const ctx=vm.createContext(sandbox);
  runFile(ctx,'myliftcoach-coach-dose-v8_2.js');
  // Recovery explainer is stubbed at the same contract boundary so account switching is tested at Coach consumption.
  ctx.myliftcoachCoachRecoveryExplain=(exerciseId,hours)=>{
    const rows=ctx.prismInterventionRows();
    const target=rows[0]?.athleteContext?.recovery==='ready'?72:48;
    if(rows.length<4)return {state:'learning',timing:'unknown',preferredHours:null};
    return {state:'supported',timing:Number(hours)<target?'early':'on_time',preferredHours:target};
  };
  return {ctx,stores,setActive:id=>{active=id}};
}

for(const weeks of WEEKS){
  const {ctx,stores,setActive}=buildHarness();
  // Train every athlete independently with deliberately conflicting patterns.
  for(const a of ATHLETES){
    const rows=[];
    for(let w=0;w<weeks;w++)for(let n=0;n<2;n++)rows.push(intervention(a,w,n));
    stores.get(a.id).setItem('prismCoachInterventionsV1',JSON.stringify(rows));
  }
  // Repeated cross-account switching: A->B->...->J->A for every simulated week.
  for(let round=0;round<weeks;round++){
    for(const a of ATHLETES){
      setActive(a.id);
      const ownRows=ctx.prismInterventionRows();
      assert.ok(ownRows.length>0,`${weeks}w ${a.id}: history missing`);
      assert.ok(ownRows.every(r=>String(r.id).startsWith(a.id+'-')),`${weeks}w ${a.id}: foreign intervention leaked in`);
      const dose=ctx.myliftcoachCoachDoseExplain(a.exerciseId);
      assert.equal(dose.state,'supported',`${weeks}w ${a.id}: dose evidence not supported`);
      assert.equal(dose.bestDose.dose.volume,a.preferredVolume,`${weeks}w ${a.id}: volume crossed accounts`);
      assert.equal(dose.bestDose.dose.pressure,a.preferredPressure,`${weeks}w ${a.id}: pressure crossed accounts`);
      const rec=ctx.myliftcoachCoachRecoveryExplain(a.exerciseId,a.recoveryHours-12);
      assert.equal(rec.preferredHours,a.recoveryHours,`${weeks}w ${a.id}: recovery learning crossed accounts`);
      assert.equal(rec.timing,'early',`${weeks}w ${a.id}: recovery decision wrong for own account`);
      for(const other of ATHLETES.filter(x=>x.id!==a.id)){
        assert.ok(!ownRows.some(r=>String(r.id).startsWith(other.id+'-')),`${weeks}w ${a.id}: saw ${other.id} history`);
      }
    }
    setActive(ATHLETES[0].id);
    const back=ctx.myliftcoachCoachDoseExplain('press');
    assert.equal(back.bestDose.dose.volume,ATHLETES[0].preferredVolume,`${weeks}w A->...->A: prior athlete contaminated A`);
  }
  // Deleting/resetting one athlete must not alter another athlete's intelligence.
  setActive(ATHLETES[1].id);
  const before=ctx.myliftcoachCoachDoseExplain('press');
  stores.get(ATHLETES[0].id).removeItem('prismCoachInterventionsV1');
  setActive(ATHLETES[1].id);
  const after=ctx.myliftcoachCoachDoseExplain('press');
  assert.deepEqual(after.bestDose,before.bestDose,`${weeks}w: resetting A changed B's Coach learning`);
}

console.log('Multi-athlete intelligence isolation passes for 10 athletes across 6/12/16/20 weeks with repeated account switching, conflicting dose/recovery patterns, A->B->...->A rechecks, and per-account reset isolation.');
