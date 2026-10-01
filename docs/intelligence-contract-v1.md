# MYLIFTCOACH Intelligence Contract V1

The supported runtime interface for intelligence consumers is now `window.myliftcoachIntelligence`.

## Stable responsibilities

- `athlete(exerciseId, events, exerciseMuscles)` aggregates Athlete context, dose-response, recovery timing, and program-foundation evidence.
- `coach(exerciseId, plannedRecoveryHours)` aggregates Coach context, dose, and recovery interpretation.
- `proposal(proposal)` aggregates Coach evidence for a program-change proposal.
- `prescribe(...)` delegates to the fully layered Adaptive Programming prescription and preserves Adaptive as final authority.
- `guardrails()` audits authority and safety boundaries.
- `snapshot(...)` returns a single consolidated Athlete + Coach + guardrail view.

## Authority boundary

Athlete Learning is evidence. Coach interprets evidence. Adaptive Programming remains the only final prescription authority.

Learned evidence must not independently increase load, increase sets, replace a program, reschedule workouts, or add rest days.

## Migration rule

New intelligence consumers should use `window.myliftcoachIntelligence` instead of directly depending on version-specific Athlete/Coach/Adaptive modules. Existing versioned files remain internal implementation layers until a later safe cleanup proves they can be removed without changing behavior.
