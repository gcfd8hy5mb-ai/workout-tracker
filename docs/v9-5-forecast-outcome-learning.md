# V9.5 Forecast Outcome Learning

V9.5 evaluates only forecast-influenced holds that the athlete actually applies.

## Flow
1. Adaptive Programming proposes an increase.
2. V9.4 may conservatively downgrade it to a one-exposure hold when all original V9.4 gates pass.
3. The intervention is recorded only when the athlete applies that target.
4. The next newer completed exposure is compared with the pre-intervention baseline.
5. The outcome is classified as helpful, neutral, or harmful.
6. Outcome history is scoped by account, exercise, and forecast context.

## Authority limits
- Outcome learning may only reduce or suspend future forecast influence.
- Helpful history cannot relax any V9.4 confidence, calibration, drift, context, or prior-load gate.
- Outcome learning cannot create an increase, reduce below the previous load, add sets, change rep range, or change schedule.
- Adaptive Programming remains final authority.

## Suspension
Repeated harmful results in the same account/exercise/context can suspend forecast influence for that context. Unrelated exercises, contexts, and accounts are not penalized.