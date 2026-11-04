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

## 2026-11-04 - JSON is the source of truth for the script

- Lesson: `App` regenerates the whole script whenever `originalJson` changes (`useEffect` on `[language, originalJson, ...]` -> `generateScript` -> `setScript`). So every store mutation must also patch the JSON correctly (`updateCharacterInJson`, `removeCharacterFromJson`, `reorderCharactersInJson`, ...): if the JSON patch misses, the next regeneration **undoes the UI change**, which looks like "my edit snaps back" even though the store did apply it. While debugging an edit that reverts, instrument `Storage.prototype.setItem` for `botc-script-data` and check which JSON patch ran last.
- Second half: the JSON editor surfaces this to users now — `JsonEditor` validates as you type (line/column + plain-language hint), and the input panel warns about duplicated / missing character ids before generation silently drops them.
- Apply when: adding any new mutation to `ScriptStore`, or debugging "change applied then reverted" reports.
- Regression guard: after adding a mutation, reorder/edit/delete an id-less character and reload the page — the result must survive the regeneration.

## 2026-11-04 - Character identity: "no id" is not an id

- Lesson: `id` is the identity key for the official dictionary, night order, drag & drop, and the JSON round-trip, but hand-written scripts may omit it. Any comparison that treats "no id" as a value (`undefined === undefined`) silently merges distinct characters: `generateScript` dropped every id-less character after the first, `reorderCharactersInJson` (a `Map` keyed by id) deleted one of them on any drag, and `removeCharacterFromJson` deleted all of them at once. Proven with Playwright: two id-less custom characters -> one rendered; after one reorder drag the JSON kept a single entry and the remaining card switched to the other character's data.
- Rule now enforced: an empty/absent id **never** matches another character; exact id wins over the normalized id (`fang_gu` <-> `fanggu`); a live object also matches by reference. All of that lives in `src/data/utils/characterIdentity.ts` (`hasCharacterId`, `matchesCharacterId`, `findCharacterIndex`) — use these instead of ad-hoc `c.id === x` / `isSameCharacter(c.id, x)`.
- Renaming is supported but validated: `CharacterEditDialog` has an explicit "Character ID" field (and the JSON editor accepts `id`), empty/malformed/colliding ids are rejected, and `ScriptStore.sanitizeCharacterIdChange` drops an invalid id while still applying the rest of the edit.
- Reordering passes the ordered **character objects** (`reorderCharacters(team, Character[])`), never ids, so id-less or duplicated-id characters cannot be swapped or dropped on the way through the store.
- Regression guard: two id-less characters must both render; dragging one past the other must keep both JSON entries with their own name/ability; deleting one must leave the other; run `npx tsc -b` and an eslint pass.

## 2026-11-04 - dnd-kit autoscroll runs away to the top of the page

- Lesson: dnd-kit's built-in `AutoScroller` treats the outer 20% of the scroll container as a hot zone (≈150px on a 720px window) and scrolls the *page* (`Element.scrollBy` on `documentElement`) for as long as the pointer stays in it — dragging a card that sits near the top scrolls the whole page to the very top. Worse, the 5ms scroll interval can survive the drop: the effect that would clear it only runs when the AutoScroller's deps change, so a drop that lands inside the hot zone leaves the page scrolling up with no pointer held (`aria-pressed` already cleared, interval still firing).
- Source: user bug report "拖动那些可能没有id的角色的时候会一直auto scrolling up, 一直滚动到页面最上面"; reproduced with Playwright by instrumenting `Element.prototype.scrollBy` + `window.setInterval` — after the drop a leaked 5ms interval kept calling `scrollBy(0, -5.8)` and pinned the page at `scrollY = 0`.
- Apply when: any `DndContext` whose sortables live on a long page (`CharacterSection`, `NightOrder`, second-page components).
- Regression guard: `CharacterSection` now passes `autoScroll={false}` and drives `useDragAutoScroll` (`src/hooks/useDragAutoScroll.ts`, 64px edge band, rAF loop cancelled on drop/cancel/pointerup/unmount). Verify by holding a drag at y≈25 (page must scroll up smoothly and stop on release) and at y≈300 (page must not move), then `window.scrollTo(0, 1200)` after the drop — the page must stay put.

## 2026-09-11 - dnd-kit falsy id poisons the whole DndContext

- Lesson: `useSortable({ id })` / `useDraggable({ id })` break permanently when `id` is `undefined`. `DndContext` sets `activeRef.current = id` before instantiating the sensor, and its guard is `if (activeRef.current == null) return;` plus `if (activeRef.current !== null) return;` on the activator — so one `undefined` id leaves the ref stuck and **every later drag in that DndContext is silently ignored** (no `onDragEnd`, no reorder). A card whose id is `undefined` also reports `isDragging` forever because `isDragging = active?.id === id` compares `undefined === undefined`. Symptom seen by users: "sometimes character order cannot be dragged".
- Source: user bug report "有时候角色顺序会遇到无法拖拽的情况"; reproduced with Playwright by loading a script JSON whose character had no `id` — first drag produced `over: null`, every following drag in that team never reached `onDragEnd`.
- Apply when: any dnd-kit sortable surface (`CharacterSection`, `NightOrder`, `SecondPageSortableItem`) derives ids from user-supplied JSON.
- Regression guard: `CharacterSection` maps ids through a unique/truthy `sortableIds` helper and resolves drag events by index; verify by dragging a card next to an id-less character, then dragging again (must still reorder) — normal scripts and the 21-drag sweep must keep working.
- Second lesson from the same loop: `ScriptStore.reorderCharacters` matched via `isSameCharacter` (normalized ids, e.g. `fang_gu`/`fanggu`), which cloned one character and dropped the other. Always match exact ids first and splice from a pool so each character is consumed once.
