import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
SERVICE_WORKER = (ROOT / "sw.js").read_text(encoding="utf-8")


class WorkoutTrackerTests(unittest.TestCase):
    def test_uses_one_workout_completion_control(self):
        self.assertEqual(INDEX.count('id="completeWorkoutButton"'), 1)
        self.assertNotIn("toggleComplete(", INDEX)
        self.assertIn("function toggleWorkoutComplete()", INDEX)
        self.assertIn("ids.every(id=>completedExercises.includes(id))", INDEX)

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

    def test_progress_is_only_in_bottom_navigation(self):
        self.assertNotIn('id="tabProgress"', INDEX)
        self.assertNotIn("showWorkoutTab('progress')", INDEX)
        self.assertNotIn('id="workoutProgressContent"', INDEX)
        self.assertEqual(INDEX.count('id="navProgress"'), 1)
        self.assertIn('id="navProgress" onclick="showOverallProgress()"', INDEX)
        self.assertIn('showScreen("overallProgressScreen");setBottomNav("Progress")', INDEX)

    def test_workout_and_bottom_navigation_destinations(self):
        self.assertEqual(len(re.findall(r"day[1-4]:\{title:", INDEX)), 4)
        for tab in ("Workout", "History", "Timer"):
            self.assertIn(f'id="tab{tab}"', INDEX)
        for destination in ("Home", "Workout", "Progress", "History", "Timer"):
            self.assertEqual(INDEX.count(f'id="nav{destination}"'), 1)
        self.assertIn('["Workout","History","Timer"].forEach', INDEX)

    def test_mobile_bars_stay_fixed_and_navigation_only_changes_color(self):
        self.assertRegex(INDEX, r"header\{[\s\S]*?position:fixed")
        self.assertRegex(INDEX, r"\.bottom-nav\{[\s\S]*?position:fixed")
        self.assertIn("transition:color .12s ease-out;transform:none;filter:none", INDEX)
        self.assertIn(".nav-button:active{color:var(--blue);transform:none;filter:none}", INDEX)
        self.assertIn('button.setAttribute("aria-current","page")', INDEX)


if __name__ == "__main__":
    unittest.main()
