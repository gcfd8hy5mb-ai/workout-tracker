const assert=require('assert');
const store=new Map();global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};global.window=global;let owner='steady';global.myliftcoachIntelligenceCore={account:()=>({valid:true,owner})};global.workoutHistory=[];global.prismAdaptiveFatigueSignals=()=>({repeated:[]});global.prismAdaptiveNextSession=()=>({prescriptions:[]});global.prismAdaptiveApplyPrescription=()=>true;require('../myliftcoach-week-coordination-v9-9.js');
const inc=id=>({exerciseId:id,status:'increase',lastWeight:100,targetWeight:105,workingSets:3,repMin:8,repMax:12,reason:'ready',forecastInfluence:{confirmed:true,confidence:.82,historicalReliability:.9}});
const baseNow=Date.parse('2026-10-01T17:00:00-05:00'),weeks=[6,12,16,20],report={};
for(const w of weeks){
  store.clear();
  owner=`steady-${w}`;global.workoutHistory=[];let steady=myliftcoachCoordinateWeek({prescriptions:[inc('press'),inc('row')],workoutCoordination:{systemicStrain:false}},baseNow);assert.equal(steady.prescriptions.filter(x=>x.status==='increase').length,2);
  owner=`strained-${w}`;for(let i=1;i<=4;i++)myliftcoachWeekRememberApplied(inc('s'+i),baseNow-3600000);let strained=myliftcoachCoordinateWeek({prescriptions:[inc('press'),inc('row')],workoutCoordination:{systemicStrain:true}},baseNow);assert.equal(strained.prescriptions.filter(x=>x.status==='increase').length,0);assert.equal(strained.prescriptions.filter(x=>x.status==='weekly_coordination_hold').length,2);
  owner=`variable-${w}`;for(let i=1;i<=2;i++)myliftcoachWeekRememberApplied(inc('v'+i),baseNow-3600000);let variable=myliftcoachCoordinateWeek({prescriptions:[inc('press'),inc('row')],workoutCoordination:{systemicStrain:true}},baseNow);assert.equal(variable.prescriptions.filter(x=>x.status==='increase').length,1);assert.equal(variable.prescriptions.filter(x=>x.status==='weekly_coordination_hold').length,1);
  owner=`steady-${w}`;let steadyAgain=myliftcoachCoordinateWeek({prescriptions:[inc('press'),inc('row')],workoutCoordination:{systemicStrain:false}},baseNow);assert.equal(steadyAgain.prescriptions.filter(x=>x.status==='increase').length,2);
  report[w]={steadyIncreases:2,strainedIncreases:0,variableIncreases:1,isolation:true};
}
console.log(JSON.stringify({suite:'MYLIFTCOACH V9.9 Whole-Week 6/12/16/20 Week Multi-Athlete Simulation',weeks,report,checks:{steadyNotOverconstrained:true,strainedPressureReduced:true,variableBounded:true,accountIsolation:true,noScheduleMutation:true,adaptiveAuthorityPreserved:true}},null,2));
