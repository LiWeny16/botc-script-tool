# Agent Lessons And Patterns

Purpose: record reusable lessons from review, debugging, validation, and handoff loops.

Write here when:
- A review/debug loop reveals a reusable prevention pattern.
- A validation failure exposes a missing regression check.
- A handoff, dispatch, or context-loading pattern should be repeated or avoided.

Entry format, newest first:

```markdown
## YYYY-MM-DD - Short Lesson Name

- Lesson: the reusable pattern.
- Source: review finding, debug loop, failed verification, or handoff.
- Apply when: the task shape or files where this matters.
- Regression guard: test, validator check, docs update, or manual evidence to keep it from recurring.
```

Keep entries lightweight and actionable. Avoid secrets and speculative lessons.

## 2026-09-11 - dnd-kit falsy id poisons the whole DndContext

- Lesson: `useSortable({ id })` / `useDraggable({ id })` break permanently when `id` is `undefined`. `DndContext` sets `activeRef.current = id` before instantiating the sensor, and its guard is `if (activeRef.current == null) return;` plus `if (activeRef.current !== null) return;` on the activator — so one `undefined` id leaves the ref stuck and **every later drag in that DndContext is silently ignored** (no `onDragEnd`, no reorder). A card whose id is `undefined` also reports `isDragging` forever because `isDragging = active?.id === id` compares `undefined === undefined`. Symptom seen by users: "sometimes character order cannot be dragged".
- Source: user bug report "有时候角色顺序会遇到无法拖拽的情况"; reproduced with Playwright by loading a script JSON whose character had no `id` — first drag produced `over: null`, every following drag in that team never reached `onDragEnd`.
- Apply when: any dnd-kit sortable surface (`CharacterSection`, `NightOrder`, `SecondPageSortableItem`) derives ids from user-supplied JSON.
- Regression guard: `CharacterSection` maps ids through a unique/truthy `sortableIds` helper and resolves drag events by index; verify by dragging a card next to an id-less character, then dragging again (must still reorder) — normal scripts and the 21-drag sweep must keep working.
- Second lesson from the same loop: `ScriptStore.reorderCharacters` matched via `isSameCharacter` (normalized ids, e.g. `fang_gu`/`fanggu`), which cloned one character and dropped the other. Always match exact ids first and splice from a pool so each character is consumed once.
