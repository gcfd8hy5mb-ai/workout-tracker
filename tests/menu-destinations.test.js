const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

const routes=[
  ['navHome','goHome','home'],
  ['navWorkout','showWorkouts','workoutsScreen'],
  ['navLibrary','showLibrary','libraryScreen'],
  ['navManage','showManageWorkouts','manageWorkoutScreen'],
  ['navTimer','showGlobalTimer','globalTimerScreen'],
  ['navProgress','showOverallProgress','overallProgressScreen'],
  ['navCalendar','showWorkoutCalendar','calendarScreen'],
  ['navRecords','showPersonalRecords','recordsScreen'],
  ['navMeasurements','showMeasurements','measurementsScreen'],
  ['navPhotos','showProgressPhotos','photosScreen'],
  ['navWater','showWater','waterScreen'],
  ['navFood','showFood','foodScreen'],
  ['navWeight','showWeight','weightScreen'],
  ['navGoals','showTrackingGoals','goalsScreen'],
  ['navProfile','showProfile','profileScreen'],
  ['navSettings','showSettings','profileScreen'],
  ['navHelp','showHelp','helpScreen'],
  ['navBackup','showDataBackup','manageWorkoutScreen']
];

for(const [id,handler,target] of routes){
  assert.match(html,new RegExp(`id=["']${id}["'][^>]*onclick=["']${handler}\\(\\)["']`),`${id} must invoke ${handler}()`);
  assert.match(html,new RegExp(`function\\s+${handler}\\s*\\(`),`${handler} must be defined`);
  assert.match(html,new RegExp(`id=["']${target}["']`),`${target} screen must exist`);
}

assert.match(html,/function\s+showScreen\s*\(id\)[\s\S]*?closeMenu\(\)/,'screen navigation must close the drawer');
assert.match(html,/function\s+showSettings\s*\(\)[\s\S]*?profileSettings/,'Settings must land on the settings section');
assert.match(html,/function\s+showDataBackup\s*\(\)[\s\S]*?dataBackupSection/,'Data & Backup must land on the backup section');
assert.match(html,/function\s+closeMenu\s*\(\)[\s\S]*?menuToggle[^\n]*focus/,'closing the drawer should restore focus to the menu button');
assert.match(html,/touchend[\s\S]*?dx<\s*-65[\s\S]*?closeMenu\(\)/,'drawer must support swipe-to-close');

console.log(`Verified ${routes.length} menu destinations and drawer return behavior.`);
