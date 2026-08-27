# print-preview-header-layout — PLAN

Task-level implementation plan and evidence. Main agent writes after second planning; implementer reads before coding.

## Goal

Make the print preview maintain a stable first-page aspect ratio across computers, remove the unexpected top spacing, and let users manually drag/resize the author avatar block, title block, and special-rule block inside the script page header. Persist the new header layout controls to browser localStorage and expose matching PDF export settings.

## Acceptance Criteria

- [ ] Preview uses a fixed script page aspect ratio/height instead of browser-dependent rendered width.
- [ ] Print output and preview share the same page/header geometry as closely as the existing print pipeline allows.
- [ ] Author avatar block, title block, and special-rule block can be dragged and scaled within the first-page script boundary.
- [ ] Header spacing between page top/title and title/first role section can be adjusted with visible drag handles in preview, but all handles are invisible in print/PDF.
- [ ] New layout values persist in browser localStorage and are surfaced in the PDF export settings.
- [ ] Verification includes type/build checks and a browser-visible preview/export smoke check when feasible.

## Scope

Allowed write set:
- `Harness/PLAN.md`
- `Harness/PROGRESS.md`
- `Harness/tasks/print-preview-header-layout/*`
- UI/layout source files directly responsible for preview, print/PDF export settings, header rendering, and persisted UI config

Forbidden:
- `docs/`
- `pnpm-lock.yaml` unless dependency changes are required
- unrelated character data, script parsing, repository browser, or SEO generation changes

## Loaded Context

- `CLAUDE.md`
- `Harness/MEMORY.md`
- `Harness/README.md`
- `Harness/PROGRESS.md`
- `Harness/PLAN.md`
- `Harness/WF.md`
- `Harness/lifecycle.md`
- `Harness/Arch.md`
- `Harness/subagents.md`
- `Harness/dispatch.md`
- `responsible-vibe` skill
- `designing-beautiful-websites` skill

## Subagent Dispatch

| Agent | Mode | Read Set | Write Set | Status |
|-------|------|----------|-----------|--------|
| planner fallback / Pascal | read-only | Harness docs, architecture, relevant source discovered by bounded search | none | Returned |
| architect fallback / Popper | read-only | relevant stores/components/print CSS after discovery | none | Returned |
| test-writer fallback / Godel | read-only | relevant scripts/package/test config | none | Returned |

## Subagent Synthesis

Agents used: Pascal (planner/source map), Popper (architecture), Godel (verification).

Findings accepted:
- `ScriptRenderer` owns the first-page DOM and the hardcoded author/title/special-rule header positions.
- `UIConfigStore` is the correct localStorage persistence owner under `botc-ui-config`.
- The preview/print mismatch comes from screen `#script-preview { width: 100% }` versus print `100vw/100vh` rules duplicated in `App.tsx` and `print.css`.
- The unexpected top spacing is internal layout: `#main_script` top padding plus title wrapper top margin.
- Browser print is triggered from `App.tsx`; `PrintDialog` is instructional only.
- Verification should include TypeScript, lint, and browser media/viewport smoke checks. There is no existing test script, but Playwright is installed.

Findings rejected:
- Storing header layout in exported script JSON. The user asked for browser-local PDF/export settings, so the state belongs in UI config.

Conflicts:
- Current print CSS labels output as A4 portrait, while the screenshots show a wide first-page preview. The implementation will preserve the existing app's wide first-page screen shape by making the preview a stable landscape page box, while leaving browser print page setup instructions to the existing print dialog.

Decisions:
- Add `printHeaderLayout` to `UIConfigStore` with page ratio, top spacing, title-to-content gap, and percent-based block rectangles for `credits`, `title`, and `specialRules`.
- Add a focused reusable header layout box inside `ScriptRenderer` or a small sibling component. It will use pointer events, percent storage, clamping to the page box, resize handles, and `data-testid`s.
- Existing `titleHeightMd` remains for backward compatibility; the new title block scale/position controls wrapper geometry.
- Add PDF export settings controls near the existing title-height slider for top gap, title-to-content gap, page preview height/ratio-related reset, and header layout reset.
- Hide all new edit controls with a dedicated print class in both print style locations.
- After user screenshot review, use a fixed A4 landscape screen canvas (`1358 x 960px` by default, user-adjustable height with width recalculated by A4 ratio) and `297mm x 210mm` in print instead of viewport-height-driven preview sizing.
- Replace always-visible circular controls with hover-only canvas controls, right-click layer ordering, and eight-direction resize handles.
- Move the title flourish into the title block so it travels with the title text/image.
- Place the author signature just above the first role divider line, with its bottom edge close to the line instead of centered over it.

Residual risk:
- Browser print preview itself is not fully automatable. Use Playwright `emulateMedia('print')` for handle invisibility and a manual smoke check for the browser print dialog if feasible.

## Verification

| Check | Result | Notes |
|-------|--------|-------|
| `pnpm exec tsc -b --pretty false` | Passed | Ran after latest A4 canvas height and author-signature revisions. |
| `pnpm lint` | Passed with warnings | 0 errors, 165 existing warnings. |
| `git diff --check` | Passed | No whitespace errors. |
| Browser visual review | User-provided screenshots | Used screenshots instead of Playwright per user request; revised control visibility, title flourish behavior, special-rule resizing, fixed A4 canvas sizing, preview height, and author-signature placement. |
