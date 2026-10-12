/* MYLIFTCOACH 7-day meal planner · estimates, not dietary advice */
(function(){
"use strict";
const KEY="myliftcoachMealPlannerV1";
let lastOwner=null;
function owner(){return window.PRISMDeviceStore?.owner||"guest"}
function storageKey(){return KEY+":"+owner()}
function refreshOwner(){const current=owner();if(current!==lastOwner){lastOwner=current;state=read()}}
const meals=[
["Eggs, oats & berries",520,30,["Eggs","Oats","Berries"],[],"Breakfast"],
["Greek yogurt, banana & almonds",430,30,["Greek yogurt","Bananas","Almonds"],["nuts","dairy"],"Breakfast"],
["Tofu scramble & toast",480,28,["Tofu","Wholegrain bread","Spinach"],["soy","gluten"],"Breakfast"],
["Chicken, rice & broccoli",650,52,["Chicken breast","Rice","Broccoli"],[],"Lunch"],
["Turkey & bean bowl",620,44,["Ground turkey","Black beans","Rice"],[],"Lunch"],
["Lentil quinoa bowl",580,28,["Lentils","Quinoa","Bell peppers"],[],"Lunch"],
["Salmon, potatoes & greens",730,48,["Salmon","Potatoes","Green beans"],["fish"],"Dinner"],
["Chicken fajita bowl",710,55,["Chicken breast","Rice","Bell peppers"],[],"Dinner"],
["Chickpea veggie curry",690,27,["Chickpeas","Rice","Coconut milk"],[],"Dinner"],
["Cottage cheese & fruit",280,26,["Cottage cheese","Berries"],["dairy"],"Snack"],
["Hummus, carrots & pita",310,12,["Hummus","Carrots","Pita bread"],["gluten"],"Snack"],
["Protein yogurt & banana",320,28,["Greek yogurt","Bananas"],["dairy"],"Snack"],
["Spinach egg breakfast wrap",470,32,["Eggs","Spinach","Corn tortillas","Salsa"],[],"Breakfast"],
["Berry protein overnight oats",510,34,["Oats","Greek yogurt","Berries","Chia seeds"],["dairy"],"Breakfast"],
["Turkey breakfast hash",540,43,["Ground turkey","Potatoes","Eggs","Bell peppers"],[],"Breakfast"],
["Peanut butter banana oats",490,17,["Oats","Peanut butter","Bananas"],["nuts"],"Breakfast"],
["Grilled chicken burrito bowl",680,53,["Chicken breast","Black beans","Rice","Salsa"],[],"Lunch"],
["Tuna chickpea salad",580,47,["Tuna","Chickpeas","Cucumber","Olive oil"],["fish"],"Lunch"],
["Tofu edamame rice bowl",620,37,["Tofu","Edamame","Rice","Carrots"],["soy"],"Lunch"],
["Beef quinoa vegetable bowl",710,48,["Lean beef","Quinoa","Broccoli"],[],"Lunch"],
["Turkey meatballs with pasta",730,52,["Ground turkey","Pasta","Tomato sauce","Spinach"],["gluten"],"Dinner"],
["Shrimp vegetable stir fry",650,49,["Shrimp","Rice","Bell peppers","Broccoli"],["shellfish"],"Dinner"],
["Beef taco bowl",720,48,["Lean beef","Black beans","Rice","Salsa"],[],"Dinner"],
["Tofu peanut noodle bowl",690,32,["Tofu","Rice noodles","Peanut butter","Carrots"],["soy","nuts"],"Dinner"],
["Baked chicken sweet potato plate",700,57,["Chicken breast","Sweet potatoes","Green beans","Olive oil"],[],"Dinner"],
["Hard boiled eggs and fruit",300,19,["Eggs","Apples"],[],"Snack"],
["Edamame and oranges",270,19,["Edamame","Oranges"],["soy"],"Snack"],
["Tuna and rice cakes",320,28,["Tuna","Rice cakes"],["fish"],"Snack"]
].map(([name,kcal,protein,ingredients,allergens,type])=>({name,kcal,protein,ingredients,allergens,type}));
// Approximate raw shopping amounts per reference recipe serving, not nutrition database measurements.
const recipeQuantities={
"Eggs, oats & berries":[["Eggs",2,"each"],["Oats",70,"g"],["Berries",120,"g"]],
"Greek yogurt, banana & almonds":[["Greek yogurt",220,"g"],["Bananas",1,"each"],["Almonds",28,"g"]],
"Tofu scramble & toast":[["Tofu",180,"g"],["Wholegrain bread",2,"slices"],["Spinach",60,"g"]],
"Chicken, rice & broccoli":[["Chicken breast",180,"g"],["Rice",75,"g dry"],["Broccoli",180,"g"]],
"Turkey & bean bowl":[["Ground turkey",160,"g"],["Black beans",140,"g drained"],["Rice",60,"g dry"]],
"Lentil quinoa bowl":[["Lentils",75,"g dry"],["Quinoa",65,"g dry"],["Bell peppers",120,"g"]],
"Salmon, potatoes & greens":[["Salmon",200,"g"],["Potatoes",300,"g"],["Green beans",160,"g"]],
"Chicken fajita bowl":[["Chicken breast",200,"g"],["Rice",75,"g dry"],["Bell peppers",150,"g"]],
"Chickpea veggie curry":[["Chickpeas",180,"g drained"],["Rice",75,"g dry"],["Coconut milk",140,"mL"]],
"Cottage cheese & fruit":[["Cottage cheese",220,"g"],["Berries",100,"g"]],
"Hummus, carrots & pita":[["Hummus",100,"g"],["Carrots",140,"g"],["Pita bread",1,"each"]],
"Protein yogurt & banana":[["Greek yogurt",250,"g"],["Bananas",1,"each"]],
"Spinach egg breakfast wrap":[["Eggs",3,"each"],["Spinach",60,"g"],["Corn tortillas",2,"each"],["Salsa",60,"g"]],
"Berry protein overnight oats":[["Oats",65,"g"],["Greek yogurt",200,"g"],["Berries",120,"g"],["Chia seeds",15,"g"]],
"Turkey breakfast hash":[["Ground turkey",130,"g"],["Potatoes",200,"g"],["Eggs",1,"each"],["Bell peppers",80,"g"]],
"Peanut butter banana oats":[["Oats",75,"g"],["Peanut butter",30,"g"],["Bananas",1,"each"]],
"Grilled chicken burrito bowl":[["Chicken breast",180,"g"],["Black beans",130,"g drained"],["Rice",65,"g dry"],["Salsa",60,"g"]],
"Tuna chickpea salad":[["Tuna",150,"g"],["Chickpeas",140,"g drained"],["Cucumber",120,"g"],["Olive oil",15,"mL"]],
"Tofu edamame rice bowl":[["Tofu",180,"g"],["Edamame",140,"g"],["Rice",60,"g dry"],["Carrots",100,"g"]],
"Beef quinoa vegetable bowl":[["Lean beef",170,"g"],["Quinoa",80,"g dry"],["Broccoli",180,"g"]],
"Turkey meatballs with pasta":[["Ground turkey",200,"g"],["Pasta",90,"g dry"],["Tomato sauce",140,"g"],["Spinach",60,"g"]],
"Shrimp vegetable stir fry":[["Shrimp",210,"g"],["Rice",80,"g dry"],["Bell peppers",120,"g"],["Broccoli",120,"g"]],
"Beef taco bowl":[["Lean beef",170,"g"],["Black beans",120,"g drained"],["Rice",60,"g dry"],["Salsa",70,"g"]],
"Tofu peanut noodle bowl":[["Tofu",200,"g"],["Rice noodles",90,"g dry"],["Peanut butter",28,"g"],["Carrots",130,"g"]],
"Baked chicken sweet potato plate":[["Chicken breast",200,"g"],["Sweet potatoes",280,"g"],["Green beans",170,"g"],["Olive oil",12,"mL"]],
"Hard boiled eggs and fruit":[["Eggs",3,"each"],["Apples",1,"each"]],
"Edamame and oranges":[["Edamame",180,"g"],["Oranges",1,"each"]],
"Tuna and rice cakes":[["Tuna",120,"g"],["Rice cakes",3,"each"]]
};
function groceryTotals(days){const totals=new Map();for(const day of days||[])for(const item of day.items||[]){const p=Number(item.servings);if(!Number.isFinite(p)||p<=0)continue;for(const [name,amount,unit] of recipeQuantities[item.name]||[]){const key=name+"|"+unit;const previous=totals.get(key)||{name,unit,amount:0};previous.amount+=amount*p;totals.set(key,previous)}}return [...totals.values()].sort((a,b)=>a.name.localeCompare(b.name))}
function groceryLabel(entry){const number=Math.ceil(entry.amount*4)/4;return entry.name+" — "+Number(number.toFixed(2))+" "+entry.unit}
const types=["Breakfast","Lunch","Dinner","Snack"];
let state={};
function read(){
 const synced=typeof tracking!=="undefined"&&tracking?.mealPlanner;
 if(synced&&typeof synced==="object"&&!Array.isArray(synced))return JSON.parse(JSON.stringify(synced));
 try{const v=JSON.parse(window.localStorage.getItem(storageKey())||"{}");return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}catch{return {}}
}
function persist(){
 // Save to the same account-scoped tracking source as food logs and workout schedules.
 // This source participates in the existing authenticated cloud backup/restore.
 if(typeof tracking!=="undefined"&&typeof saveTracking==="function"){
  tracking.mealPlanner=JSON.parse(JSON.stringify(state));saveTracking();
 }
 window.localStorage.setItem(storageKey(),JSON.stringify(state));
}
function datePlus(d,n){let x=new Date(d+"T12:00:00");x.setDate(x.getDate()+n);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")}
function startDate(){return typeof localDay==="function"?localDay():new Date().toISOString().slice(0,10)}
function target(){const v=typeof dailyCalorieTarget==="function"?Number(dailyCalorieTarget(startDate())):0;return Number.isFinite(v)&&v>=1200&&v<=5000?v:2200}
function proteinTarget(){const n=Number(state.proteinGoal);return Number.isFinite(n)&&n>=60&&n<=250?n:0}
function allowed(m){
 const excluded=state.excluded||[];
 const ingredients=m.ingredients.join(" ").toLowerCase();
 const contains={
  meat:/\b(chicken|turkey|beef|pork|bacon)\b/,
  fish:/\b(salmon|tuna|fish|cod)\b/,
  shellfish:/\b(shrimp|prawns|crab)\b/,
  dairy:/\b(yogurt|milk|cheese|butter|cream)\b/,
  nuts:/\b(almonds|walnuts|cashews|nuts|peanuts|peanut butter)\b/,
  gluten:/\b(bread|toast|pita|wheat|pasta)\b/,
  soy:/\b(tofu|soy|tempeh)\b/
 };
 return !excluded.some(x=>m.allergens.includes(x)||contains[x]?.test(ingredients));
}
function mealEntry(m,p){return {name:m.name,type:m.type,kcal:Math.round(m.kcal*p),protein:Math.round(m.protein*p),servings:p,ingredients:m.ingredients}}
function swapMeal(dayDate,index){refreshOwner();if(!paidAccess())return;const day=state.days?.find(d=>d.date===dayDate),old=day?.items[index];if(!old)return;const options=meals.filter(m=>m.type===old.type&&allowed(m)&&m.name!==old.name);if(!options.length)return;const next=options[(state.revision||0)%options.length];day.items[index]=mealEntry(next,Math.max(.5,Math.min(2.5,Math.round(old.kcal/next.kcal*4)/4)));state.revision=(state.revision||0)+1;persist();render()}
function changePortion(date,index,p){refreshOwner();if(!paidAccess())return;const day=state.days?.find(d=>d.date===date),item=day?.items[index],m=meals.find(v=>v.name===item?.name);if(!m||!Number.isFinite(p)||p<.5||p>2.5)return;day.items[index]=mealEntry(m,p);persist();render()}
function createPlan(){
 refreshOwner();if(!paidAccess())return;
 const t=target(), week=state.week||startDate(), revision=(state.revision||0)+1;
 const days=Array.from({length:7},(_,day)=>{
 const weights=[.23,.30,.32,.15]; const items=types.map((type,i)=>{
 let opts=meals.filter(m=>m.type===type&&allowed(m));if(!opts.length)return null;
 let calorieShare=t*weights[i],proteinShare=proteinTarget()*weights[i];
 opts=opts.slice().sort((a,b)=>Math.abs(a.protein/a.kcal-proteinShare/calorieShare)-Math.abs(b.protein/b.kcal-proteinShare/calorieShare));
 let meal=proteinTarget()?opts[(day+revision)%Math.min(2,opts.length)]:opts[(day+revision+i)%opts.length],mult=Math.round((calorieShare/meal.kcal)*4)/4;
 mult=Math.max(.5,Math.min(2.5,mult));
 return mealEntry(meal,mult);
 });return {date:datePlus(week,day),items:items.filter(Boolean)};
 });
 state={...state,week,revision,goal:t,days};persist();render();
}
function el(tag,content,cls){const x=document.createElement(tag);if(content!==undefined)x.textContent=content;if(cls)x.className=cls;return x}
function button(label,fn){let b=el("button",label);b.type="button";b.addEventListener("click",fn);return b}
function paidAccess(){return typeof prismEntitlement!=="undefined"&&["pro","lifetime_pro"].includes(prismEntitlement.tier)&&["storekit","manual_grant","account_sync"].includes(prismEntitlement.source)}
function render(){
 refreshOwner();
 const root=document.getElementById("mlcMealPlanner");if(!root)return;root.replaceChildren();
 if(!paidAccess()){
 root.append(el("h3","7-day meal planner · PRO"),el("p","Automatic weekly meal plans, portions and grocery lists are for paid Pro members. Manual food and calorie tracking remain free.","small"));
 root.append(button("See MYLIFTCOACH Pro",()=>{if(typeof showPrismPro==="function")showPrismPro()}));
 return;
 }
 root.append(el("h3","7-day meal planner · PRO"),el("p","Build a weekly plan around your current calorie target. Macro counts and ingredients are estimates; verify labels, portions, allergens and dietary needs.","small"));
 let controls=el("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:8px;align-items:center";
 let date=el("input");date.type="date";date.value=state.week||startDate();date.setAttribute("aria-label","First day of plan");
 date.addEventListener("change",()=>{if(!date.value)return;state.week=date.value;createPlan()});
 controls.append(date,button(state.days?.length?"Regenerate 7 days":"Generate my week",createPlan));root.append(controls);
 const proteinRow=el("div");proteinRow.style.cssText="margin:10px 0";const proteinLabel=el("label","Daily protein target (g) · optional");const proteinInput=el("input");proteinInput.type="number";proteinInput.min="60";proteinInput.max="250";proteinInput.step="5";proteinInput.placeholder="Example: 150";proteinInput.value=proteinTarget()||"";proteinInput.setAttribute("aria-label","Daily protein target in grams");proteinInput.addEventListener("change",()=>{const n=Number(proteinInput.value);state.proteinGoal=proteinInput.value!==""&&Number.isFinite(n)&&n>=60&&n<=250?n:null;persist();render()});proteinRow.append(proteinLabel,proteinInput,el("p","A planning preference, not a prescribed requirement. Regenerate to apply your target; recipe limits may prevent an exact match.","small"));root.append(proteinRow);
 let exclusions=el("div");exclusions.style.cssText="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0";
 for(const [value,label] of [["meat","No meat"],["fish","No fish"],["shellfish","No shellfish"],["dairy","No dairy"],["nuts","No nuts"],["gluten","No gluten"],["soy","No soy"]]){
 let wrap=el("label"),cb=document.createElement("input");cb.type="checkbox";cb.checked=(state.excluded||[]).includes(value);
 cb.addEventListener("change",()=>{let s=new Set(state.excluded||[]);cb.checked?s.add(value):s.delete(value);state.excluded=[...s];state.days=[];persist();render()});wrap.append(cb,document.createTextNode(" "+label));exclusions.append(wrap);
 }root.append(exclusions);
 if(!Array.isArray(state.days)||!state.days.length){root.append(el("p","Choose Generate 7 days to create your first plan.","small"));return}
 root.append(el("p","Target: "+state.goal.toLocaleString()+" kcal/day · Protein preference: "+(proteinTarget()?proteinTarget()+" g/day":"not set")+" · Actual daily totals may differ · Regenerate after changing goals.","small"));
 const grocery=groceryTotals(state.days);
 const picker=el("select");picker.setAttribute("aria-label","Select planned day");for(const d of state.days){const option=el("option",d.date);option.value=d.date;picker.append(option)}
 const active=state.days.some(d=>d.date===state.activeDay)?state.activeDay:state.days[0].date;picker.value=active;picker.addEventListener("change",()=>{state.activeDay=picker.value;persist();render()});root.append(el("h4","Choose a day"),picker);
 for(const day of state.days){
 if(day.date!==active)continue
 let card=el("div",undefined,"card");card.style.marginTop="10px";card.append(el("h4",day.date));
 for(const [index,item] of day.items.entries()){
 const line=el("div");line.style.cssText="padding:7px 0;border-bottom:1px solid var(--line)";
 line.append(el("strong",item.type+": "+item.name),el("p",item.kcal+" kcal · "+item.protein+" g protein · "+item.servings+"× reference portion","small"));
 const actions=el("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0";actions.append(button("Swap meal",()=>swapMeal(day.date,index)));const portion=el("select");portion.setAttribute("aria-label","Portions for "+item.name);for(const p of [.5,.75,1,1.25,1.5,1.75,2,2.25,2.5]){const opt=el("option",p+" portions");opt.value=String(p);portion.append(opt)}portion.value=String(item.servings);portion.addEventListener("change",()=>changePortion(day.date,index,Number(portion.value)));actions.append(portion);line.append(actions);
 line.append(button("Log this meal today",()=>{
 if(typeof tracking==="undefined"||typeof saveTracking!=="function"||typeof renderFood!=="function")return;
 const today=startDate(),name=item.name+" (meal plan)";
 if(!confirm("Log "+item.name+" ("+item.kcal+" estimated calories) for today?"))return;
 if(!Array.isArray(tracking.food))return;
 tracking.food.push({id:typeof newTrackingId==="function"?newTrackingId():String(Date.now()),day:today,name,calories:item.kcal});
 saveTracking();renderFood();const notice=document.getElementById("foodLogFeedback");if(notice)notice.textContent="Planned meal added to today's food log.";
 }));card.append(line);

 }
 card.append(el("p","Day total: "+day.items.reduce((s,m)=>s+m.kcal,0)+" kcal · "+day.items.reduce((s,m)=>s+m.protein,0)+" g protein","small"));root.append(card);
 }
 const groceries=el("details");groceries.append(el("summary","Weekly ingredient list · tap to expand"));root.append(groceries);
 const list=el("ul");for(const entry of grocery){
  const key=entry.name+"|"+entry.unit;
  const row=el("li"),label=el("label"),check=document.createElement("input");
  check.type="checkbox";check.checked=Boolean(state.groceryChecked?.[key]);
  check.setAttribute("aria-label","Got "+entry.name);
  check.addEventListener("change",()=>{if(!state.groceryChecked)state.groceryChecked={};if(check.checked)state.groceryChecked[key]=true;else delete state.groceryChecked[key];persist();label.style.textDecoration=check.checked?"line-through":"none"});
  label.style.textDecoration=check.checked?"line-through":"none";
  label.append(check,document.createTextNode(" "+groceryLabel(entry)));
  row.append(label);list.append(row);
 }
 groceries.append(el("p","Check off items as you shop. Your checklist saves with your meal plan.","small"));
 groceries.append(list,button("Reset shopping checklist",()=>{state.groceryChecked={};persist();render()}));
 groceries.append(list,button("Copy grocery list",()=>{let msg=[...grocery].map(entry=>groceryLabel(entry)).join("\n");if(navigator.clipboard?.writeText)navigator.clipboard.writeText(msg).catch(()=>prompt("Copy list",msg));else prompt("Copy list",msg)}));
 root.append(el("p","This is a rotating recipe library with illustrative nutrition values, not a verified recipe database. Shopping amounts are estimates based on raw recipe ingredients. Check packaging, cooking yield and recipe details. Exclusion filters cover listed ingredients only; check packaging for cross-contact.","small"));
}
window.mlcRefreshMealPlanner=render;
function init(){const food=document.getElementById("foodScreen");if(!food||document.getElementById("mlcMealPlanner"))return;refreshOwner();let root=el("div",undefined,"card");root.id="mlcMealPlanner";food.insertBefore(root,food.children[1]);render()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();