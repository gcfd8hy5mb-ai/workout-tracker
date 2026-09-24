import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
SERVICE_WORKER = (ROOT / "sw.js").read_text(encoding="utf-8")


class WorkoutTrackerTests(unittest.TestCase):
    def test_finishing_workout_saves_once_and_shows_summary(self):
        self.assertEqual(INDEX.count('id="finishWorkoutButton"'), 1)
        self.assertNotIn('id="completeWorkoutButton"', INDEX)
        self.assertIn('completedExercises=[...new Set([...completedExercises,...session.exercises.map(ex=>', INDEX)
        self.assertIn('showWorkoutSummary(session);', INDEX)
        self.assertIn('id="completionScreen"', INDEX)

    def test_exercise_details_remain_available(self):
        for detail in ("ex.image", "ex.muscle", "ex.how", "ex.tips", "ex.mistakes"):
            self.assertIn(detail, INDEX)
        self.assertIn("function finishWorkout()", INDEX)
        self.assertIn('localStorage.setItem("workoutHistoryV52"', INDEX)

    def test_local_images_exist_and_are_cached(self):
        image_paths = set(re.findall(r'image:"([^"]+)"', INDEX))
        self.assertTrue(image_paths)
        for image_path in image_paths:
            self.assertTrue((ROOT / image_path).is_file(), image_path)
            self.assertIn(f'"./{image_path}"', SERVICE_WORKER)

    def test_pages_assets_use_relative_urls(self):
        self.assertIn('<link rel="manifest" href="manifest.json">', INDEX)
        self.assertIn('navigator.serviceWorker.register("./sw.js")', INDEX)
        manifest = (ROOT / "manifest.json").read_text(encoding="utf-8")
        self.assertIn('"start_url": "./"', manifest)

    def test_progress_is_in_side_menu(self):
        self.assertNotIn('id="tabProgress"', INDEX)
        self.assertNotIn("showWorkoutTab('progress')", INDEX)
        self.assertNotIn('id="workoutProgressContent"', INDEX)
        self.assertEqual(INDEX.count('id="navProgress"'), 1)
        self.assertIn('id="sideMenu" class="side-menu"', INDEX)
        self.assertNotIn('class="bottom-nav"', INDEX)
        self.assertIn('id="navProgress" onclick="showOverallProgress()"', INDEX)
        self.assertIn('showScreen("overallProgressScreen");setBottomNav("Progress")', INDEX)

    def test_workout_and_menu_destinations(self):
        self.assertEqual(len(re.findall(r"day[1-4]:\{title:", INDEX)), 4)
        for tab in ("Workout", "Timer"):
            self.assertIn(f'id="tab{tab}"', INDEX)
        self.assertNotIn('id="tabHistory"', INDEX)
        self.assertNotIn('id="workoutHistoryContent"', INDEX)
        for destination in ("Home", "Workout", "Manage", "Progress", "History", "Timer", "Water", "Food", "Weight", "Goals"):
            self.assertEqual(INDEX.count(f'id="nav{destination}"'), 1)
        self.assertIn('["Workout","Timer"].forEach', INDEX)
        self.assertIn('menu.inert=true', INDEX)

    def test_daily_tracking_and_weight_history_are_saved(self):
        self.assertIn('localStorage.getItem("dailyTrackingV1")', INDEX)
        self.assertIn('localStorage.setItem("dailyTrackingV1",JSON.stringify(tracking))', INDEX)
        for screen in ("waterScreen", "foodScreen", "goalsScreen", "weightScreen"):
            self.assertIn(f'id="{screen}"', INDEX)
        self.assertIn('tracking.weight.push({id:newTrackingId(),day,value:', INDEX)
        self.assertIn('function weightEntriesNewestFirst()', INDEX)

    def test_backup_and_restore_include_every_data_group(self):
        for key in ("completedExercisesV5", "customWorkoutsV5", "workoutHistoryV52", "workoutGoalsV1", "dailyTrackingV1"):
            self.assertIn(key, INDEX.split('const backupKeys=', 1)[1].split('};', 1)[0])
        self.assertIn('backup.format!=="workout-tracker-backup"', INDEX)
        self.assertIn('if(!confirm("Replace the workout and tracking data on this phone with this backup?"))return;', INDEX)
        self.assertIn('location.reload();', INDEX)

    def test_today_view_and_past_day_logs(self):
        self.assertIn('id="todayDashboard"', INDEX)
        self.assertIn('workoutHistory.find(session=>plans.some(plan=>plan.key===session.workoutKey))', INDEX)
        self.assertIn('"Suggested":', INDEX)
        self.assertIn('const target=dailyCalorieTarget(day);', INDEX)
        self.assertIn('className="today-meter"', INDEX)
        self.assertIn('action:"Log water",open:showWater', INDEX)
        self.assertIn('action:"Log food",open:showFood', INDEX)
        self.assertIn('estimatedCalorieGoal({age:tracking.calorieAge', INDEX)
        self.assertIn('id="waterDay" type="date"', INDEX)
        self.assertIn('id="foodDay" type="date"', INDEX)
        self.assertIn('selectedDay("water")', INDEX)
        self.assertIn('selectedDay("food")', INDEX)

    def test_food_shortcuts_and_water_units(self):
        self.assertIn('id="foodFavorites"', INDEX)
        self.assertIn('id="foodRecent"', INDEX)
        self.assertIn('function repeatFood(name,calories)', INDEX)
        self.assertIn('function setWaterUnit(unit)', INDEX)
        self.assertIn('tracking.waterUnit==="oz"?Math.round(rawWater*29.5735):rawWater', INDEX)

    def test_manage_workouts_moved_into_menu(self):
        home = INDEX.split('<section id="home">', 1)[1].split('</section>', 1)[0]
        self.assertNotIn('id="dataReset"', home)
        self.assertNotIn('id="customButtons"', home)
        self.assertIn('id="navManage" onclick="showManageWorkouts()"', INDEX)
        self.assertIn('id="manageWorkoutScreen"', INDEX)
        self.assertIn('function showManageWorkouts()', INDEX)

    def test_food_calories_are_calculated_from_servings(self):
        self.assertIn('function estimateFoodCalories(food,servings)', INDEX)
        self.assertIn('Math.round(food.grams*food.kcal100/100*servings)', INDEX)
        self.assertIn('id="foodChoice" onchange="updateFoodEstimate()"', INDEX)
        self.assertIn('food?estimateFoodCalories(food,servings)', INDEX)
        self.assertIn('id="customFoodFields" class="hidden"', INDEX)

    def test_goal_uses_saved_weight_and_selected_training_goal(self):
        self.assertIn('value="fat-loss"', INDEX)
        self.assertIn('const latest=weightEntriesNewestFirst()[0]', INDEX)
        self.assertIn('goalFactors={muscle:1.08,strength:1.04,"fat-loss":.90,consistency:1}', INDEX)
        self.assertIn('function saveCalorieSettings(event)', INDEX)
        self.assertIn('function dailyCalorieTarget(day)', INDEX)
        self.assertIn('tracking.calorieWorkout={day:localDay(),key:activeWorkoutKey,title,minutes}', INDEX)
        self.assertIn('tracking.calorieMode=mode;tracking.calorieGoal=mode==="manual"?manual:null', INDEX)

    def test_basic_presets_appear_only_when_requested(self):
        self.assertNotIn('id="presetButtons"', INDEX)
        self.assertNotIn('id="presetHeading"', INDEX)
        self.assertIn('if(workoutGoals.basic){', INDEX)
        self.assertIn('Object.entries(presetWorkouts).forEach(([key,day])=>{', INDEX)
        self.assertIn('id="homeProgressCard"', INDEX)
        self.assertIn('classList.toggle("hidden",!workoutGoals||workoutGoals.skipped)', INDEX)

    def test_mobile_header_and_drawer_are_accessible(self):
        self.assertRegex(INDEX, r"header\{[\s\S]*?position:fixed")
        self.assertIn('aria-controls="sideMenu" aria-expanded="false"', INDEX)
        self.assertIn('id="headerToday" class="header-today" onclick="goHome()"', INDEX)
        self.assertIn('headerToday").classList.toggle("hidden",id==="setupScreen")', INDEX)
        self.assertIn('--header-height:72px', INDEX)
        self.assertIn('class="menu-version">Version 9.1</small>', INDEX)
        self.assertIn('id="sideMenu" class="side-menu" aria-label="Main menu" aria-hidden="true" inert', INDEX)
        self.assertIn('.side-menu.open{transform:translateX(0);visibility:visible}', INDEX)
        self.assertIn('event.key==="Escape"', INDEX)
        self.assertIn('button.setAttribute("aria-current","page")', INDEX)

    def test_buttons_only_animate_brief_color_changes(self):
        button_rule = re.search(r"button\{([^}]*)\}", INDEX).group(1)
        self.assertIn("transition:color .1s ease-out,background-color .1s ease-out", button_rule)
        for disallowed in ("scale(", "translate(", "box-shadow", "width"):
            self.assertNotIn(disallowed, button_rule)
        self.assertIn("button:active{transform:none;filter:none}", INDEX)
        self.assertIn(".day-button:active,.action-button:not(.primary):active", INDEX)
        self.assertIn(".back:active", INDEX)
        self.assertIn(".workout-tab:active", INDEX)
        self.assertIn(".finish-workout:active", INDEX)

    def test_progress_and_release_version_are_not_animated(self):
        self.assertIn(".progress-fill{height:100%;width:0;background:#111;transition:none}", INDEX)
        self.assertIn('class="menu-version">Version 9.1</small>', INDEX)
        self.assertIn('const CACHE_NAME = "workout-tracker-v9.1";', SERVICE_WORKER)

    def test_saved_data_storage_keys_remain_compatible(self):
        for storage_key in ("completedExercisesV5", "customWorkoutsV5", "workoutHistoryV52", "overloadTargetsV1", "workoutGoalsV1"):
            self.assertIn(storage_key, INDEX)


if __name__ == "__main__":
    unittest.main()
