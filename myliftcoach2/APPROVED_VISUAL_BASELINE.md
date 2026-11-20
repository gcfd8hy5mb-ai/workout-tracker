# MYLIFTCOACH 2.0 approved design — immutable source reference

Source repository: `gcfd8hy5mb-ai/MYLIFTCOACH-2.0`

Reference commit: `3530c049589637041c829a4cbcf080a6c86dc6dc` (2026-11-16).

Archived source branch: `archive/approved-nov16-original-visual-reference`.

Previous working 2.0 checkpoint: `gcfd8hy5mb-ai/workout-tracker` branch `archive/myliftcoach2-before-exact-visual-restoration` at `522b713c516e1107bd9fdd075b462663f9cbbe1d`.

Visual source assets at reference commit (Git blob hashes, verified identical with existing beta asset-sourcing commit):

- `assets/approved-vertical-marble-sharp.webp`: `5b6250ea7c243cdf24765454be4d631008733b5d`
- `assets/hero-dumbbells-photo.jpg`: `370afa9027e67292450e219119a6b554ea609b37`
- `assets/myliftcoach-mark.svg`: `b9c664126ea4de9691a73f993e1ad1d679cce31e`

Historical stylesheets:

1. `styles.css`: `d836c8146a17fe4e96b91ca1fc4fc52bced66be3`
2. `theme-option-one.css`: `b91bde3e89b6c11316b3f750898c2feee7252705`
3. `reference-mobile.css`: `aeaac6f085809c815f270ddedd0f8925ef624888`
4. `premium-reference.css`: `9f642f6b31abada715ef0ba5e983b4be6c7dc188`
5. `refinement-v2.css`: `7873c9a1a1c7fb8c8f1b369c2dd31944054a00e4`
6. `home-rebuild.css`: `9809021e19dd1244fecddfde3bbd8b7442fc1f60`

Historical source Home layout is in `index.html` with Git blob SHA `69e5b89c3d61e68abc7542c1d060b8c37bafa89c`. The exact original header has `homeMenuBtn`, `homeAccountBtn`, `reference-home-brand`, six SVG-icon shortcut cards, and a compact photographic workout hero.

## Restore strategy and guardrails

- Do not continue visual approximation layers: avoid loading `approved-video-fidelity.css` or the superseded `charcoal-gold.css`.
- Use original Home markup and source styling (with only selector changes needed to recognize the 2.0 page state); keep new weekly board and original-history controls below the approved Home composition.
- Preserve new 2.0 Coach, schedules, cloud history, beta entitlements, original account isolation, and exercise catalog functions.
- No deployment, production replacement, or branch merge without visual comparison and regression testing.
- The untouched historical `styles.css` differs from the current 2.0 base stylesheet due to modern workout functionality; do not wholesale replace it without checking those features.
- Visual fidelity remains unverified on physical iPhone until acceptance.
