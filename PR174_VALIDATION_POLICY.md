# PR #174 replacement validation policy

Do not merge this replacement PR until all required repository checks, including Browser Smoke, are green together.

After the first complete green run, trigger one additional complete validation run without source changes. Merge only after that second consecutive complete green run also succeeds.

Never weaken assertions to obtain green checks. Any genuine failure must be root-fixed and the complete validation sequence restarted.
