/* MYLIFTCOACH V9.7 — multi-signal decision arbitration.
   Resolves conflicts among Adaptive, recovery, fatigue, plateau, forecast and outcome-history signals.
   The arbitrator may preserve or make a prescription more conservative; it may never create or enlarge progression. */
const MYLIFTCOACH_ARBITRATION_VERSION='9.7';
function myliftcoachArbitrationSafe(fn,f=null){try{const v=fn();return v==null?f:v}catch{return f}}
function myliftcoachArbitrationExplain(exerciseId){return myliftcoachArbitrationSafe(()=>typeof window.myliftcoachCoachForecastExplain==='function'?window.myliftcoachCoachForecastExplain(String(exerciseId??'')):null,null);}
function myliftcoachArbitrationHardHold(status){return ['recovery_hold','recovery_timing_hold','fatigue_learning_hold','plateau_hold','feedback_hold','progression_hold','forecast_hold'].includes(String(status||''));}
function myliftcoachArbitrationRank(p,explanation){const f=p?.forecastInfluence||{},ctx=explanation?.context||{},rows=[];
 rows.push({signal:'adaptive',priority:100,state:String(p?.status||'hold'),authoritative:true});
 if(['recovery_hold','recovery_timing_hold'].includes(String(p?.status)))rows.push({signal:'recovery',priority:120,state:'hold',hard:true});
 if(String(p?.status)==='fatigue_learning_hold'||ctx.fatigueState==='high')rows.push({signal:'fatigue',priority:118,state:'caution',hard:String(p?.status)==='fatigue_learning_hold'});
 if(String(p?.status)==='plateau_hold')rows.push({signal:'plateau',priority:116,state:'hold',hard:true});
 if(String(p?.status)==='feedback_hold')rows.push({signal:'completed_outcome_feedback',priority:114,state:'hold',hard:true});
 if(explanation)rows.push({signal:'forecast',priority:70,state:String(explanation.forecastSignal||'unknown'),confidence:Number(explanation.confidence)||0,reliability:Number(explanation.historicalReliability)||0});
 if(f.outcomeProfile)rows.push({signal:'caution_outcome_history',priority:82,state:f.outcomeProfile.suspended?'suspended':String(f.outcomeProfile.state||'learning'),trustFactor:Number(f.outcomeProfile.trustFactor??1)});
 if(f.confirmationOutcomeProfile)rows.push({signal:'positive_outcome_history',priority:80,state:f.confirmationOutcomeProfile.suspended?'suspended':String(f.confirmationOutcomeProfile.state||'learning'),trustFactor:Number(f.confirmationOutcomeProfile.trustFactor??1)});
 return rows.sort((a,b)=>b.priority-a.priority);
}
function myliftcoachArbitratePrescription(p){if(!p)return p;const explanation=myliftcoachArbitrationExplain(p.exerciseId),forecast=String(explanation?.forecastSignal||p?.forecastInfluence?.forecastSignal||'unknown'),status=String(p.status||'hold'),hardHold=myliftcoachArbitrationHardHold(status),ctx=explanation?.context||{},reasonCodes=[],rankedSignals=myliftcoachArbitrationRank(p,explanation);let conflict=false,winner='adaptive_programming',decision='preserve';
 if(hardHold&&forecast==='increase'){
  conflict=true;winner=status.includes('recovery')?'recovery':status.includes('fatigue')||ctx.fatigueState==='high'?'fatigue':status.includes('plateau')?'plateau':status==='feedback_hold'?'completed_outcome_feedback':'adaptive_caution';
  if(winner==='recovery')reasonCodes.push('recovery_overrides_progression');
  else if(winner==='fatigue')reasonCodes.push('fatigue_overrides_positive_forecast');
  else if(winner==='plateau')reasonCodes.push('plateau_overrides_positive_forecast');
  else reasonCodes.push('adaptive_hard_hold_preserved');
 }
 if(status==='increase'&&['hold','reduce'].includes(forecast)){
  conflict=true;
  if(p?.forecastInfluence?.changed){winner='forecast_caution';decision='conservative_hold';reasonCodes.push('prediction_conflict_resolved');}
  else {winner='adaptive_programming';reasonCodes.push('caution_forecast_below_action_threshold');}
 }
 if(status==='increase'&&forecast==='increase'){
  winner='adaptive_programming';reasonCodes.push(p?.forecastInfluence?.confirmed?'positive_forecast_confirms_adaptive':'positive_forecast_supports_adaptive');
 }
 if(p?.forecastInfluence?.outcomeProfile?.suspended||p?.forecastInfluence?.confirmationOutcomeProfile?.suspended)reasonCodes.push('outcome_history_reduces_trust');
 if(!reasonCodes.length)reasonCodes.push('adaptive_authority_preserved');
 const arbitration={version:MYLIFTCOACH_ARBITRATION_VERSION,authority:'adaptive_programming',conflict,winner,decision,reasonCodes,rankedSignals,liveContext:{fatigueState:ctx.fatigueState||null,recoveryTiming:ctx.recoveryTiming||null},guardrails:{mayPreserveOrBecomeMoreConservative:true,mayNeverCreateIncrease:true,mayNeverIncreaseMagnitude:true,mayNeverAddSets:true,mayNeverExpandRepRange:true,mayNeverChangeSchedule:true,hardRecoveryFatiguePlateauHoldsWin:true,adaptiveProgrammingFinalAuthority:true}};
 return {...p,decisionArbitration:arbitration};
}
function myliftcoachInstallArbitration(){if(typeof window.liftovaFeedbackAdjust!=='function')return false;if(window.liftovaFeedbackAdjust.__myliftcoachArbitrationV97)return true;const base=window.liftovaFeedbackAdjust;const wrapped=function(p){return myliftcoachArbitratePrescription(base(p));};wrapped.__myliftcoachArbitrationV97=true;wrapped.__base=base;window.liftovaFeedbackAdjust=wrapped;return true;}
function myliftcoachWaitForArbitration(attempt=0){if(myliftcoachInstallArbitration())return;if(attempt<60&&typeof setTimeout==='function')setTimeout(()=>myliftcoachWaitForArbitration(attempt+1),100);}
window.myliftcoachArbitratePrescription=myliftcoachArbitratePrescription;window.myliftcoachDecisionArbitrationVersion=MYLIFTCOACH_ARBITRATION_VERSION;window.myliftcoachInstallArbitration=myliftcoachInstallArbitration;
myliftcoachWaitForArbitration();
