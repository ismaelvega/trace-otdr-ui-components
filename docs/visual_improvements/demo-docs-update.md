# Demo and Docs Visual Update

Date: 2026-03-03
Milestone: 11

## Demo Updates Completed

Updated `apps/demo` to match the shipping visual language:

- Added structured demo shell with header, contextual page description, and tokenized control panel
- Replaced inline demo styles with `apps/demo/src/main.css`
- Added responsive layout behavior for controls and content panels
- Added comparison-mode guidance when fewer than two traces are loaded
- Improved vanilla iframe presentation with theme-consistent styling

Primary files:

- `apps/demo/src/main.tsx`
- `apps/demo/src/main.css`

## Docs Updates Completed

Added/updated visual-refresh documentation under `docs/visual_improvements`:

- `visual-improvements-plan.md` (source plan + completion updates)
- `baseline-audit.md` (before state and prioritized issues)
- `accessibility-qa.md` (focus/contrast/motion checks)
- `final-signoff.md` (release-readiness verification)

## Visual Design Rationale

- Increased hierarchy via semantic surface/border/header tokens
- Improved dense-data readability with tabular numerals and numeric alignment
- Reduced chart/map clutter while increasing selected/hovered context clarity
- Kept all behavior/data flows backward compatible and deterministic
