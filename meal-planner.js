/* MYLIFTCOACH 7-day meal planner · estimates, not dietary advice */
(function(){
"use strict";
const KEY="myliftcoachMealPlannerV1";
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
["Protein yogurt & banana",320,28,["Greek yogurt","Bananas"],["dairy"],"Snack"]
].map(([name,kcal,protein,ingredients,allergens,type])=>({name,kcal,protein,ingredients,allergens,type}));
const types=["Breakfast","Lunch","Dinner","Snack"];
let state={};
function read(){try{let v=JSON.parse(localStorage.getItem(KEY)||"{}");return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}catch{return {}}}
function persist(){localStorage.setItem(KEY,JSON.stringify(state))}
function datePlus(d,n){let x=new Date(d+"T12:00:00");x.setDate(x.getDate()+n);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")}
function startDate(){return typeof localDay==="function"?localDay():new Date().toISOString().slice(0,10)}
function target(){const v=typeof dailyCalorieTarget==="function"?Number(dailyCalorieTarget(startDate())):0;return Number.isFinite(v)&&v>=1200&&v<=5000?v:2200}
function allowed(m){let excluded=state.excluded||[];return !m.allergens.some(x=>excluded.includes(x))&&!(excluded.includes("meat")&&/Chicken|Turkey/.test(m.name))&&!(excluded.includes("fish")&&/Salmon/.test(m.name))}
function mealEntry(m,p){return {name:m.name,type:m.type,kcal:Math.round(m.kcal*p),protein:Math.round(m.protein*p),servings:p,ingredients:m.ingredients}}
function swapMeal(dayDate,index){if(!paidAccess())return;const day=state.days?.find(d=>d.date===dayDate),old=day?.items[index];if(!old)return;const options=meals.filter(m=>m.type===old.type&&allowed(m)&&m.name!==old.name);if(!options.length)return;const next=options[(state.revision||0)%options.length];day.items[index]=mealEntry(next,Math.max(.5,Math.min(2.5,Math.round(old.kcal/next.kcal*4)/4)));state.revision=(state.revision||0)+1;persist();render()}
function changePortion(date,index,p){if(!paidAccess())return;const day=state.days?.find(d=>d.date===date),item=day?.items[index],m=meals.find(v=>v.name===item?.name);if(!m||!Number.isFinite(p)||p<.5||p>2.5)return;day.items[index]=mealEntry(m,p);persist();render()}
function createPlan(){
 if(!paidAccess())return;
 const t=target(), week=state.week||startDate(), revision=(state.revision||0)+1;
 const days=Array.from({length:7},(_,day)=>{
 const weights=[.23,.30,.32,.15]; const items=types.map((type,i)=>{
 let opts=meals.filter(m=>m.type===type&&allowed(m));if(!opts.length)return null;
 let meal=opts[(day+revision+i)%opts.length],mult=Math.round((t*weights[i]/meal.kcal)*4)/4;
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
 let exclusions=el("div");exclusions.style.cssText="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0";
 for(const [value,label] of [["meat","No meat"],["fish","No fish"],["dairy","No dairy"],["nuts","No nuts"],["gluten","No gluten"],["soy","No soy"]]){
 let wrap=el("label"),cb=document.createElement("input");cb.type="checkbox";cb.checked=(state.excluded||[]).includes(value);
 cb.addEventListener("change",()=>{let s=new Set(state.excluded||[]);cb.checked?s.add(value):s.delete(value);state.excluded=[...s];state.days=[];persist();render()});wrap.append(cb,document.createTextNode(" "+label));exclusions.append(wrap);
 }root.append(exclusions);
 if(!Array.isArray(state.days)||!state.days.length){root.append(el("p","Choose Generate 7 days to create your first plan.","small"));return}
 root.append(el("p","Target: "+state.goal.toLocaleString()+" kcal/day · Estimated protein varies by meal · Changes to your calorie goal require regenerating this plan.","small"));
 let grocery=new Map();
 const picker=el("select");picker.setAttribute("aria-label","Select planned day");for(const d of state.days){const option=el("option",d.date);option.value=d.date;picker.append(option)}
 const active=state.days.some(d=>d.date===state.activeDay)?state.activeDay:state.days[0].date;picker.value=active;picker.addEventListener("change",()=>{state.activeDay=picker.value;persist();render()});root.append(el("h4","Choose a day"),picker);
 for(const day of state.days){
 if(day.date!==active){for(const meal of day.items)for(const ingredient of meal.ingredients)grocery.set(ingredient,(grocery.get(ingredient)||0)+meal.servings);continue}
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
 for(const ingredient of item.ingredients)grocery.set(ingredient,(grocery.get(ingredient)||0)+item.servings);
 }
 card.append(el("p","Day total: "+day.items.reduce((s,m)=>s+m.kcal,0)+" kcal · "+day.items.reduce((s,m)=>s+m.protein,0)+" g protein","small"));root.append(card);
 }
 const groceries=el("details");groceries.append(el("summary","Weekly ingredient list · tap to expand"));root.append(groceries);
 const list=el("ul");for(const [name,count] of [...grocery].sort((a,b)=>a[0].localeCompare(b[0])))list.append(el("li",name+" — "+Number(count.toFixed(2))+" meal portions"));
 groceries.append(list,button("Copy grocery list",()=>{let msg=[...grocery].map(([n,c])=>n+" — "+Number(c.toFixed(2))+" meal portions").join("\n");if(navigator.clipboard?.writeText)navigator.clipboard.writeText(msg).catch(()=>prompt("Copy list",msg));else prompt("Copy list",msg)}));
 root.append(el("p","This is a starter recipe rotation, not a complete recipe library. Ingredient counts are estimates, not shopping-unit quantities. Exclusion filters cover listed ingredients only; check packaging for cross-contact.","small"));
}
window.mlcRefreshMealPlanner=render;
function init(){const food=document.getElementById("foodScreen");if(!food||document.getElementById("mlcMealPlanner"))return;state=read();let root=el("div",undefined,"card");root.id="mlcMealPlanner";food.insertBefore(root,food.children[1]);render()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();