const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const access=html.split('/* PRISM ACCESS:')[1].split('/* STORAGE —')[0];
const photo=html.slice(html.indexOf('const allProgressPhotos=()=>'),html.indexOf('/* GLOBAL HISTORY */'));
const savedPhotos=[{id:'previous-pro-photo',day:'2026-09-01',weight:180,data:{}}];
const savedEntitlement=new Map([['prismEntitlementV1',JSON.stringify({tier:'beta',betaView:'free'})]]);
const counts={reads:0,writes:0},previews=[],screens=[];
const list={children:[],replaceChildren(){this.children=[]},appendChild(child){this.children.push(child)},innerHTML:''};
const comparison={children:[],classList:{add(){},remove(){}},replaceChildren(){this.children=[]},appendChild(child){this.children.push(child)}};
const makeNode=tag=>tag==='canvas'?{width:0,height:0,getContext:()=>({drawImage(){}}),toBlob:callback=>callback({image:true})}:{children:[],className:'',textContent:'',setAttribute(){},appendChild(child){this.children.push(child)},append(...children){this.children.push(...children)}};
const photoInput={files:[{type:'image/jpeg',size:1000}],value:'chosen'};
const context=vm.createContext({
localStorage:{getItem:key=>savedEntitlement.get(key)??null,setItem:(key,value)=>savedEntitlement.set(key,value)},
document:{addEventListener(){},getElementById:id=>id==='prismBetaAccess'?null:id==='photoList'?list:id==='photoComparison'?comparison:{textContent:''},createElement:makeNode},
showScreen:id=>screens.push(id),setBottomNav(){},showProPreview:key=>previews.push(key),
photoOperation:async(mode,action)=>{if(mode==='readonly'){counts.reads++;return savedPhotos.slice()}counts.writes++;action({put:record=>{savedPhotos.push(record);return record},delete:id=>{const index=savedPhotos.findIndex(p=>p.id===id);if(index>=0)savedPhotos.splice(index,1)}});return null},
photoObjectUrls:[],selectedPhotoIds:[],URL:{createObjectURL:()=>`blob:test`,revokeObjectURL(){}},
createImageBitmap:async()=>({width:500,height:500,close(){}}),weightEntriesNewestFirst:()=>[],localDay:()=> '2026-09-25',newTrackingId:()=> 'new-photo',
prismPhases:[{type:'cut',startDate:'2026-08-01',endDate:'2026-10-01'}],PRISM_GOAL_NAMES:{cut:'Cut'},
console
});
vm.runInContext('/* PRISM ACCESS:'+access,context);
context.showProPreview=key=>previews.push(key);
vm.runInContext(photo,context);
(async()=>{
assert.equal(vm.runInContext('PRISM_ACCESS.features.photo_comparison',context),'pro');
assert.equal(vm.runInContext('Object.hasOwn(PRISM_ACCESS.features,"photo_storage")',context),false,'one canonical photo feature key');
await context.showProgressPhotos();
assert.deepEqual(previews,['photo_comparison']);assert.deepEqual(screens,[]);assert.equal(counts.reads,0,'Free cannot read saved photos');
await context.addProgressPhoto({target:photoInput});assert.equal(counts.writes,0,'Free cannot add photos');
context.setBetaPreview('pro');await context.showProgressPhotos();
assert.equal(screens.at(-1),'photosScreen');assert.equal(counts.reads,1);assert.equal(list.children.length,1);
assert.match(list.children[0].children[1].textContent,/Cut phase/,'show actual goal phase for dated photo');
photoInput.value='chosen';await context.addProgressPhoto({target:photoInput});assert.equal(savedPhotos.length,2,'Pro can add a photo');
context.setBetaPreview('free');await context.showProgressPhotos();assert.equal(savedPhotos.length,2,'downgrade preserves photos');assert.equal(counts.reads,2,'Free does not read photos after downgrade');
context.setBetaPreview('pro');await context.showProgressPhotos();assert.equal(list.children.length,2,'returning to Pro restores photo history');
console.log('Progress Photos: Free lock, Pro access, saved photos, and phase labels: OK');
})().catch(error=>{console.error(error);process.exitCode=1});
