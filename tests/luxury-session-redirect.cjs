const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const guard=html.match(/function destination\(\)\{[\s\S]*?\}catch\(e\)\{\}/)?.[0];
assert.ok(guard,'real login entry must contain a session redirect guard');
const exp=Math.floor(Date.now()/1000)+3600;
for(const [name,session,expected] of [
 ['expired',{access_token:'a',user:{id:'b'},expires_at:1},false],
 ['missingExpiry',{access_token:'a',user:{id:'b'}},false],
 ['badJson','{oops',false],
 ['valid',{access_token:'a',user:{id:'b'},expires_at:exp},true],
 ['missingOwner',{access_token:'a',expires_at:exp},false]
]){
 let navigated=null;
 const value=typeof session==='string'?session:JSON.stringify(session);
 const location={href:'https://preview.example/index.html',replace:url=>{navigated=url}};
 vm.runInNewContext(guard,{window:{localStorage:{getItem:()=>value}},location,URL,Date,Math,Number,JSON});
 assert.equal(!!navigated,expected,name);
 console.log('PASS',name);
}
