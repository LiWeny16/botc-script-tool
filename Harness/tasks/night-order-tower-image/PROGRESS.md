# night-order-tower-image — PROGRESS

## Current Goal

Make tower background images (`back_tower2.png` etc.) customizable: opacity, drag, resize, delete, add custom images, stored locally (not in JSON export).

## Phase

Current: Second Plan — awaiting user approval

## Heartbeat

Last beat: 2026-06-27 (exploration complete, plan written)
Current phase: Second Plan (ready for review)
Current blocker: awaiting user approval of PLAN.md
Next beat trigger: after user approves / implementation starts
Failure count: 0
Recovery action: none

## Tasks

| # | Task | Owner | Verify | Status |
|---|------|-------|--------|--------|
| 1 | Explore tower image usage | subagent (explorer) | findings in PLAN.md | ✅ Done |
| 2 | Explore UIConfigStore + storage | subagent (explorer) | findings | ✅ Done |
| 3 | Explore drag/resize patterns | subagent (explorer) | findings | ✅ Done |
| 4 | Synthesize and write second plan | main agent | PLAN.md written | ✅ Done |
| 5 | Data layer (types + IndexedDB) | implementer | tsc pass | Pending |
| 6 | TowerImageOverlay component | implementer | tsc pass | Pending |
| 7 | Replace hardcoded towers in ScriptRenderer | implementer | build | Pending |
| 8 | Settings UI in UISettingsDrawer | implementer | build | Pending |
| 9 | Build + verify | verifier | evidence | Pending |

## Agent Handoffs

| Agent | Role | Context Pack | Result |
|-------|------|-------------|--------|
| subagent-1 | explorer | Tower image locations | Returned — 3 rendering contexts, current opacity/position values |
| subagent-2 | explorer | UIConfigStore + storage | Returned — IndexedDB pattern (fontStorage template), TowerImage type design |
| subagent-3 | explorer | Drag/resize patterns | Returned — vanilla JS drag (CharacterLibraryCard), resize (InputPanel), slider patterns |

## Key Architecture Decisions

- **Storage**: IndexedDB (new DB `botc-tower-images-db`) for base64 image data, metadata in UIConfig localStorage
- **Drag**: Vanilla JS mousedown/mousemove/mouseup + RAF (follow CharacterLibraryCard pattern)
- **Resize**: Corner drag handle (follow InputPanel resize pattern)
- **Scope**: 4 files changed + 2 new files
