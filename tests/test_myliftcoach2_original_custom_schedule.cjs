const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../persistence/storage-model.js'),api=require('../myliftcoach2/original-custom-schedule.js');
const workouts=[{id:123,name:'Monday Legs',exercises:['leg-press','leg-curl']},{id:456,name:'Upper',exercises:['machine-chest-press']}];
const monday={name:'Monday Legs',exercises:['leg-press','leg-curl']},upper={name:'Upper',exercises:['machine-chest-press']};
const tracking={customSchedule:{'2026-11-16':upper},customRecurringSchedule:[{...monday,start:'2026-11-09',end:'2026-12-07',weeks:4}]};
const valid=['leg-press','leg-curl','machine-chest-press'];
test('one-time date wins over a matching weekly custom plan',()=>{
 const data=api.normalize(workouts,tracking,valid);
 assert.equal(api.resolve(data,'2026-11-16').plan.title,'Upper');
 assert.equal(api.resolve(data,'2026-11-23').plan.title,'Monday Legs');
 assert.equal(api.resolve(data,'2026-12-14').plan,null);
});
test('same exact custom name without matching exercises is not treated as scheduled',()=>{
 const data=api.normalize(workouts,{customSchedule:{'2026-11-16':{name:'Monday Legs',exercises:['machine-chest-press']}}},valid);
 const result=api.resolve(data,'2026-11-16');
 assert.equal(result.kind,'unmatched');assert.equal(result.plan,null);
});
test('latest weekly rule wins; one-time never repeats',()=>{
 const t={customSchedule:{'2026-11-17':upper},customRecurringSchedule:[{...monday,start:'2026-11-02',end:null},{...upper,start:'2026-11-09',end:null}]};
 const data=api.normalize(workouts,t,valid);
 assert.equal(api.resolve(data,'2026-11-16').plan.title,'Upper');
 assert.equal(api.resolve(data,'2026-11-17').plan.title,'Upper');
 assert.equal(api.resolve(data,'2026-11-24').plan,null);
});
test('separately restores original cloud workouts and tracking without write calls',async()=>{
 const snapshot={customWorkoutsV5:JSON.stringify(workouts),dailyTrackingV1:JSON.stringify(tracking)};
 const rows=await model.normalize(snapshot),user='00000000-0000-4000-8000-000000000001',methods=[];
 const fetcher=async(url,opt)=>{
  methods.push(opt.method);
  const parsed=new URL(url),table=parsed.pathname.split('/').pop().replace('prism_account_',''),source=parsed.searchParams.get('source_key').slice(3);
  return {ok:true,json:async()=>rows.filter(row=>row.table===table&&row.source_key===source).map(row=>({...row,user_id:user}))};
 };
 const data=await api.load({endpoint:'https://example.supabase.co',publishableKey:'public',accessToken:'test',userId:user,fetcher,validExerciseIds:valid});
 assert.equal(api.resolve(data,'2026-11-16').plan.title,'Upper');
 assert.ok(methods.every(x=>x==='GET'));
});
test('rejects cross-account cloud data',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>[{user_id:'wrong',source_key:'customWorkoutsV5'}]});
 await assert.rejects(api.load({endpoint:'https://example.supabase.co',publishableKey:'public',accessToken:'test',userId:'right',fetcher,validExerciseIds:valid}),/ownership mismatch/);
});
