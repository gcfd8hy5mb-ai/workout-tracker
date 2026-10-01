const assert=require('node:assert/strict');
const fs=require('node:fs');

const gesture=fs.readFileSync('myliftcoach-menu-return-swipe.js','utf8');
const loader=fs.readFileSync('supabase-config.js','utf8');

assert.match(gesture,/pendingMenuNavigation=true/,'menu action must mark the next screen as menu-origin');
assert.match(gesture,/menuOrigin=fromMenu/,'each showScreen call must refresh menu-origin state so deeper detail navigation restores native back');
assert.match(gesture,/\.prism-bottom-nav button[\s\S]*menuOrigin=false/,'bottom-tab navigation must clear menu-origin state');
assert.match(gesture,/clientX>EDGE_PX/,'gesture must begin from the left edge');
assert.match(gesture,/dx>=MIN_X/,'gesture must require a meaningful rightward swipe');
assert.match(gesture,/event\.stopImmediatePropagation\(\)[\s\S]*window\.openMenu\(\)/,'menu-return swipe must stop the underlying native swipe-back before opening the drawer');
assert.match(gesture,/\{capture:true,passive:true\}/,'menu-return touch interception must run in capture phase before native swipe-back');

const nativeIndex=loader.indexOf("liftova-native-navigation.js?v=1");
const menuReturnIndex=loader.indexOf("myliftcoach-menu-return-swipe.js?v=1");
assert.ok(nativeIndex>=0,'native navigation must remain loaded');
assert.ok(menuReturnIndex>nativeIndex,'menu-return gesture must load after native navigation so it wraps the final router');

console.log(JSON.stringify({
  suite:'MYLIFTCOACH Menu Return Swipe',
  checks:{
    menuOriginTracked:true,
    deeperDetailRestoresNativeBack:true,
    bottomTabsClearOrigin:true,
    edgeGestureRequired:true,
    nativeSwipeBackSuppressedOnlyForMenuReturn:true,
    loadOrderCorrect:true
  }
},null,2));
