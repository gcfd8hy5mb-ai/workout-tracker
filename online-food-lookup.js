/* Optional online branded-food lookup. Manual and offline logging remain free. */
(function(){
"use strict";
const HOST="https://world.openfoodfacts.org";
let current=[],lastRequest=0;
function node(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e}
function valid(p){
 const n=p?.nutriments||{};const c=Number(n["energy-kcal_100g"]);
 if(!p?.product_name||!Number.isFinite(c)||c<0||c>900)return null;
 const product={id:String(p.code||""),name:String(p.product_name).slice(0,140),brand:String(p.brands||"").slice(0,100),calories:c,protein:Number(n.proteins_100g)||0,carbs:Number(n.carbohydrates_100g)||0,fat:Number(n.fat_100g)||0};
 return product;
}
function elements(){return {q:document.getElementById("onlineFoodQuery"),results:document.getElementById("onlineFoodResults"),status:document.getElementById("onlineFoodStatus"),amount:document.getElementById("onlineFoodGrams")}}
function status(msg){const e=elements().status;if(e)e.textContent=msg}
function render(items){const e=elements().results;if(!e)return;e.replaceChildren();current=items;
 for(const item of items){const row=node("div");row.style.cssText="padding:9px 0;border-bottom:1px solid var(--line)";
 const b=node("button",item.name+(item.brand?" · "+item.brand:"")+" · "+Math.round(item.calories)+" kcal/100g");
 b.type="button";b.addEventListener("click",()=>{const grams=Number(elements().amount?.value);if(!Number.isFinite(grams)||grams<1||grams>2000){status("Enter 1–2000 grams.");return}if(typeof tracking==="undefined"||typeof saveTracking!=="function"||typeof newTrackingId!=="function"){status("Food logging is unavailable.");return}
 const calories=Math.round(item.calories*grams/100);
 tracking.food.push({id:newTrackingId(),day:typeof selectedDay==="function"?selectedDay("food"):new Date().toISOString().slice(0,10),name:item.name+" · "+grams+" g"+(item.brand?" · "+item.brand:""),calories});
 try{saveTracking();if(typeof renderFood==="function")renderFood();status("Added "+item.name+" · "+calories+" calories to your food log.")}catch{tracking.food.pop();status("Could not save the food. Try again.")}});
 row.append(b);e.append(row)}
}
async function request(url){
 if(Date.now()-lastRequest<1200){status("Please wait a moment before searching again.");return}
 lastRequest=Date.now();status("Searching packaged foods…");render([]);
 try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);let response;try{response=await fetch(url,{signal:controller.signal,headers:{Accept:"application/json"}})}finally{clearTimeout(timer)}
 if(!response.ok)throw Error("Service status "+response.status);
 const data=await response.json();const items=(Array.isArray(data.products)?data.products:[data.product]).map(valid).filter(Boolean).slice(0,15);
 render(items);status(items.length?items.length+" products found. Choose a product to log its grams.":"No verified calorie records found. Use manual entry instead.");
 }catch{status("Online search is unavailable. You can still log foods manually.");}
}
function search(){const q=elements().q?.value.trim();if(!q||q.length<3){status("Enter at least three characters.");return}
 // Open Food Facts currently supports keyword queries via legacy v1; no requests on each keystroke.
 const params=new URLSearchParams({search_terms:q,search_simple:"1",action:"process",json:"1",page_size:"15",fields:"code,product_name,brands,nutriments"});
 request(HOST+"/cgi/search.pl?"+params);
}
function lookup(){const barcode=(document.getElementById("onlineBarcode")?.value||"").replace(/\s+/g,"");if(!/^\d{8,14}$/.test(barcode)){status("Enter an 8–14 digit barcode.");return}
 request(HOST+"/api/v2/product/"+encodeURIComponent(barcode)+".json?fields=code,product_name,brands,nutriments");
}
function init(){const food=document.getElementById("foodScreen");if(!food||document.getElementById("onlineFoodLookup"))return;const block=node("div");block.id="onlineFoodLookup";block.className="card";
 block.append(node("h3","Search packaged foods · FREE"),node("p","Search Open Food Facts by product name or barcode. Entries are community-maintained; verify nutrition labels. Requires internet.","small"));
 const name=node("input");name.id="onlineFoodQuery";name.placeholder="Brand or product name";name.setAttribute("aria-label","Search packaged foods");name.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();search()}});block.append(name);
 const searchBtn=node("button","Search foods");searchBtn.type="button";searchBtn.addEventListener("click",search);block.append(searchBtn);
 const barcode=node("input");barcode.id="onlineBarcode";barcode.inputMode="numeric";barcode.placeholder="Barcode numbers";barcode.setAttribute("aria-label","Barcode numbers");block.append(barcode);
 const barcodeBtn=node("button","Find barcode");barcodeBtn.type="button";barcodeBtn.addEventListener("click",lookup);block.append(barcodeBtn);
 const label=node("label","Amount eaten (grams)");label.htmlFor="onlineFoodGrams";block.append(label);const grams=node("input");grams.id="onlineFoodGrams";grams.type="number";grams.min="1";grams.max="2000";grams.value="100";grams.inputMode="decimal";block.append(grams);
 const info=node("p");info.id="onlineFoodStatus";info.className="small";info.setAttribute("role","status");info.setAttribute("aria-live","polite");block.append(info);
 const results=node("div");results.id="onlineFoodResults";block.append(results);
 block.append(node("p","Source: Open Food Facts contributors (ODbL). Check the packaging for accurate serving size and allergens.","small"));
 const list=document.getElementById("foodListTitle");food.insertBefore(block,list||null)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();