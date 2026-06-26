# night-order-tower-image — PLAN

## Goal

Replace hardcoded `back_tower.png` / `back_tower2.png` with user-manageable tower images: adjustable opacity, drag left/right, pinch/resize, delete, add custom images. Stored in local settings (IndexedDB), not in JSON export.

## Architecture Overview

```
┌─ Store ──────────────────────────────────────────┐
│ UIConfigStore                                     │
│   towerImages: TowerImage[]  (metadata, in-memory)│
│ TowerImageStorage (IndexedDB, binary dataUrl)     │
└───────────────────────────────────────────────────┘
         │ read                           ▲ write
         ▼                               │
┌─ Renderer ───────────────┐  ┌─ Settings UI ───────┐
│ ScriptRenderer.tsx        │  │ UISettingsDrawer    │
│  TowerImageOverlay (new)  │  │  Add/Delete/Upload  │
│  - drag left/right        │  │  Opacity slider     │
│  - resize handles         │  │  Scale slider       │
│  - delete button          │  │  Position X slider  │
│  - opacity from config    │  │                     │
└───────────────────────────┘  └────────────────────┘
```

## Acceptance Criteria

- [ ] Default `back_tower.png` (opacity 0.4) and `back_tower2.png` (opacity 0.8) preserved as initial state
- [ ] Opacity slider in settings controls each image's transparency
- [ ] Images draggable left/right within night order bar bounds (bottom-aligned)
- [ ] Images resizable via corner drag handle
- [ ] Delete button (with restore default)
- [ ] Add button (+) to upload new tower images (IndexedDB)
- [ ] Both PAGE 2 and PAGE 3 night order layouts supported
- [ ] Settings stored locally only — NOT saved in script JSON export
- [ ] Build + typecheck pass

## Subagent Synthesis

### Agents used
- Explorer 1: Tower image usage in night order
- Explorer 2: UIConfigStore + local storage patterns
- Explorer 3: Drag/resize patterns in codebase

### Findings accepted

1. **Tower image locations** (3 contexts to modify):
   - PAGE 2 (line ~1005-1038): absolute `<CharacterImage>` for `back_tower.png` (20%, 0.4) and `back_tower2.png` (50%, 0.8)
   - PAGE 3 two-page mode (line ~1278-1313): same images with `pointerEvents: 'none'`
   - CSS background layers (line ~349-360): `back_tower.png 18%` + `back_tower2.png 42%` — these should be REMOVED from CSS bg and moved to `<img>` overlays

2. **Storage pattern**: Follow `customFonts` pattern — metadata in UIConfig (localStorage), binary dataUrl in IndexedDB (new store)

3. **Drag implementation**: Vanilla JS mousedown/mousemove/mouseup + RAF (from CharacterLibraryCard pattern) — simpler than @dnd-kit for free-form positioning with bounds

4. **Resize**: InputPanel.tsx pattern — corner handle with global mousemove/mouseup

5. **Existing libraries**: framer-motion for transitions, no new dependencies needed

### Findings rejected
- Using @dnd-kit for tower image drag — overkill, vanilla JS is simpler for this single-element use case
- ReactFlow — not applicable here (it's for canvas-based editing)

### Decisions
- **Phase 1**: Data model + storage (TowerImage type, IndexedDB, UIConfigStore methods)
- **Phase 2**: Renderer (replace hardcoded towers with dynamic TowerImageOverlay in both pages)
- **Phase 3**: Settings UI (UISettingsDrawer section: add/delete/upload, opacity/scale/position sliders per image)
- Keep initial defaults matching current hardcoded values

### Residual risk
- MEDIUM: CSS background tower layers need to be removed — may affect page layout on non-night-order pages
- LOW: IndexedDB pattern already proven with fonts — low risk

## Implementation Plan

### Step 1: Data Layer
**Files**: `src/stores/UIConfigStore.ts`, `src/utils/towerImageStorage.ts` (new)

- Add `TowerImage` interface: `{ id, url, x, y, scale, opacity, isDefault }`
- Add `towerImages: TowerImage[]` to `UIConfig` with 2 defaults (back_tower, back_tower2)
- Create `TowerImageStorage` class (model on `FontStorage`) for IndexedDB
- Add methods: `addTowerImage`, `removeTowerImage`, `updateTowerImage`, `saveTowerImages`, `loadTowerImages`

### Step 2: TowerImageOverlay Component
**File**: `src/components/TowerImageOverlay.tsx` (new)

- Renders a single tower image with:
  - Drag: mousedown → mousemove (RAF) → mouseup, X-axis only, clamped to parent bounds
  - Resize: corner handle → drag to scale (min 0.2, max 2.0)
  - Delete: hover-revealed delete icon button (top-right)
  - Opacity from config
- Accepts: `image: TowerImage`, `onUpdate`, `onDelete`, `containerRef`

### Step 3: Replace hardcoded towers in ScriptRenderer
**File**: `src/components/ScriptRenderer.tsx`

- PAGE 2: Replace 2 hardcoded `<CharacterImage>` tower elements with `towerImages.map(img => <TowerImageOverlay>)`
- PAGE 3: Same replacement
- CSS background: Remove tower references from `storytellerPageBackgroundImage` (keep only `mainBackgroundUrl`)
- Add "+" button at the bottom of the night order bar to add new tower images

### Step 4: Settings UI
**File**: `src/components/UISettingsDrawer.tsx`

- New accordion section "Tower Images"
- Per-image: position X slider, opacity slider, scale slider, delete button
- Upload button (FileReader → IndexedDB)
- "Restore defaults" button

### Step 5: Verification
- TypeScript check
- Vite build
- Manual: drag towers, resize, change opacity, add/delete, check both pages

## D-GATE Dispatch Table

| Worker | File | Type | Owner |
|--------|------|------|-------|
| W1 | `src/utils/towerImageStorage.ts` | NEW | Worker |
| W2 | `src/stores/UIConfigStore.ts` | MODIFY | Worker |
| W3 | `src/components/TowerImageOverlay.tsx` | NEW | Worker |
| W4 | `src/components/ScriptRenderer.tsx` | MODIFY | Worker |
| W5 | `src/components/UISettingsDrawer.tsx` | MODIFY | Worker |

Manager: 1 (`implement-manager`) → 5 Workers, single-message dispatch.

### Shared Contract (defined by Manager)
```typescript
// TowerImage interface (to be added to UIConfigStore)
interface TowerImage {
  id: string;
  url: string;       // base64 data URL or static path
  x: number;         // left offset as percentage (0-100)  
  y: number;         // bottom offset as percentage (0-100)
  scale: number;     // 0.2 - 2.0
  opacity: number;   // 0.0 - 1.0
  isDefault: boolean; // true for built-in towers
}

// Default tower images
const DEFAULT_TOWERS: TowerImage[] = [
  { id: 'back_tower', url: '/imgs/images/background/back_tower.png', x: 0, y: 0, scale: 1.0, opacity: 0.4, isDefault: true },
  { id: 'back_tower2', url: '/imgs/images/background/back_tower2.png', x: 36, y: 0, scale: 1.0, opacity: 0.8, isDefault: true },
];
```

## Verification

| Check | Expected | Notes |
|-------|----------|-------|
| TypeScript | 0 errors | |
| Vite build | success | |
| Default towers render | back_tower (0.4) + back_tower2 (0.8) visible | |
| Drag left/right | bounded within night order bar | |
| Resize | scale changes via drag handle | |
| Delete | image removed, restore defaults brings it back | |
| Add custom image | uploaded, stored in IndexedDB, renders | |
| Settings persist | survives page refresh | |
| Not in JSON export | towerImages not in normalizedJson | |
| Both pages | PAGE 2 and PAGE 3 both functional | |
