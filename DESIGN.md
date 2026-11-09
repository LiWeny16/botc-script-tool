# Design System: Blood on the Clocktower Script Generator

**Project ID:** `local-source`

This document is the visual and interaction source of truth for the application. It is derived from the existing React, MUI, and Emotion implementation rather than a Stitch project. New UI should reuse these tokens and component rules instead of introducing local variants.

## 1. Visual Theme & Atmosphere

The application should feel like a compact desktop publishing tool crossed with a printed Blood on the Clocktower script: parchment textures, deep heraldic colors, restrained controls, and dense information. The editing chrome is quiet and utilitarian; the script canvas carries the decorative character.

The interface prioritizes direct manipulation. Selected or editable objects reveal a fine green dashed frame, small corner handles, and a compact control strip. Controls must remain visually subordinate to the script artwork while staying obvious enough to discover with a pointer, keyboard, or touch.

Motion is restrained. High-frequency interactions use short opacity or background-color transitions rather than staged animation. Layout continuity is more important than entrance effects.

## 2. Color Palette & Roles

### Canvas and Surfaces

- **Warm parchment canvas** (`#F6F1DC`): Main application backdrop around the script.
- **Neutral working surface** (`#F5F5F5`): Neutral page and fallback surface.
- **Dialog surface** (`#FCFCFC`): All MUI dialog papers.
- **Parchment ink** (`#2C2416`): Primary text on parchment.
- **Secondary parchment ink** (`#3D3226`): Dense script metadata and secondary labels.
- **Layout control paper** (`rgba(251, 246, 231, 0.97)`): Move, resize, and menu controls.

### Interaction and Semantics

- **Townsfolk blue** (`#0078BA`): Good-team identity, primary links, and neutral primary actions.
- **Minion red** (`#A32222`): Evil-team identity and destructive emphasis.
- **Fabled gold** (`#D4AF37`): Fabled-team identity and ornamental emphasis.
- **Loric emerald** (`#359026`): Loric-team identity.
- **Traveler purple** (`#B463AA`): Traveler-team identity.
- **Layout green** (`#607963`): Layout frame border.
- **Control border brass** (`#A58D68`): Layout control border.
- **Control ink** (`#465F4C`): Icons inside layout controls.
- **Alignment guide cyan** (`#00929F`): Drag snapping guides.
- **Canvas action black** (`#171717`): Shared top and bottom add buttons.
- **Dialog backdrop** (`rgba(18, 24, 35, 0.42)`): MUI modal scrim.

Color must never be the only state signal. Hover, focus, disabled, selection, and destructive states also require a border, icon, label, or opacity change.

## 3. Typography Rules

- **Application UI:** Use the existing source-han/serif stack from `THEME_FONTS.fontFamily`; fall back to Segoe UI, Microsoft YaHei, PingFang SC, and system sans-serif where CJK coverage requires it.
- **Script artwork:** Preserve the configured script title, special-rule, state-rule, and custom-font selections. Do not force the UI font onto printable script content.
- **Dialog title:** `1.125rem`, weight `700`, line-height `1.3`.
- **Dialog body:** `0.875rem`, line-height `1.65`.
- **Dense helper text:** `0.75rem` to `0.8125rem`.
- **Letter spacing:** Keep at `0`; do not tighten headings or controls.
- **Wrapping:** Use `text-wrap: balance` for short headings and `overflow-wrap: anywhere` for user-authored names and rules.
- **Numbers:** Use tabular numerals for counters, timers, dimensions, and continuously changing values.

## 4. Component Styling

### Buttons

- Visible icon controls use the existing MUI icon set or Lucide icons; do not mix custom outline icons on the same surface.
- Standard action buttons have a minimum height of `40px`, a `6px` radius, no default shadow, and no uppercase text transform.
- Press feedback uses `scale(0.96)` only. Do not use smaller press scales.
- Dense desktop edit controls are `26 × 26px`; the more control is `24 × 24px`. Expand coarse-pointer hit areas without enlarging the visible buttons or changing content layout.
- Destructive actions use semantic red; routine layout menu actions remain neutral.

### Shared Canvas Add Button

- Top and bottom add buttons use the same component and dimensions: `44 × 44px`.
- The button is circular, black (`#171717`), with a white plus icon sized `24px`.
- Hover and focus use `#303030` plus a slightly stronger shadow.
- The right edge is fixed at `12px` from the script-page right edge.
- The top add button reserves `64px` of right-side content space when special rules are present.
- The top add menu includes the special-rule action and restores any hidden designer or author avatar. Avatar visibility is a browser setting and does not change script metadata.
- Page-one and page-two bottom add buttons use the same right axis and size.
- The `Author: ...` line is a separate move-only layout target and never moves the author avatar.
- With no special rule, place the author line against the right edge above the first divider. With a special rule, center it under the title on the left. An explicitly selected alignment takes precedence.
- Show a supplied author avatar automatically; keep an empty upload placeholder hidden until restored from the header add menu. Preserve existing visibility choices.
- On desktop the main title is vertically centered beside the credit avatars. Its resize frame changes the text font size (or the image size for an image title); the title editor controls the flourish-to-title size ratio.
- The first-night and other-night side titles drag their own columns vertically and open independent title editors on double-click. Character icons retain their separate reorder gesture.
- When a special-rule parchment is present, the title defaults to `78%` of its grid column so long titles wrap before touching the rule panel.

### First-Night Legend Ornament

- The ornament asset is `public/imgs/images/sources/night-legend-cloud-v1.png`, an isolated transparent taupe cloud with no leaves or built-in text.
- Keep the cloud against the page edge.
- Never bake text into the PNG. The legend text remains editable DOM layered over the cartouche.
- Legend text uses `uiConfigStore.characterNameFont`, matching character names on the script, and scales with the ornament width.
- Crop to the visible cloud, keep its aspect ratio fixed, and size the interaction frame to that crop. Default the cloud to `14%` of paper width, centered on the bottom edge.
- Keep the plaque interior quiet enough for localized text, including longer German and Spanish labels.
- Poisoned/drunk and madness explanations are paragraphs of one editable rich-text component per page. Old list text joins the same component while its original data remains available for compatibility.
- Explanation blocks default to `60%` width on desktop and `90%` on narrow screens, can resize to the paper width, and open the rich-text editor on double-click. Newly generated scripts start with one explanation and cloud, both removable and restorable.
- The gray filigree uses `public/imgs/images/background/back_tower2.png` and remains optional; the restored golden town is a default `public/imgs/images/background/back_town.png` layer.
- The default credit avatars sit slightly lower to clear the upper leaves. The left tower defaults to 80% size and the town silhouette to 45% opacity; preserve deliberately customized settings when updating these defaults.

### Layout Frame

- Frame inset is `-3px`; border is `1px dashed #607963`; radius is `4px`.
- The frame is hidden until the owning object is hovered, focused, dragging, or otherwise active.
- Eight resize zones are available: four edges and four corners. Corner handles are `26 × 26px` on desktop and `36 × 36px` on coarse pointers.
- Edge hit zones are `16px` thick and inset from corners to avoid overlapping corner zones.
- Move an object by dragging its content; there is no separate move handle.
- Editable objects reveal an edit button and a smaller more-actions button on hover or focus; other objects reveal only more. Keep controls outside small objects when space permits, and avoid covering neighboring content.
- A state explanation card places its compact actions alongside the first line without adding an empty row. Special-rule scrolls with several independent rules attach actions to the active row.
- Control and frame interactivity must never start the owning object's drag when the user presses a control button.

### Context Menu

- All draggable top and bottom objects use the same MUI `Menu` host.
- The menu can open from a pointer context menu, the more-actions button, `ContextMenu`, or `Shift+F10`.
- Menu entries are always ordered: Edit, Reset layout, Delete.
- Unavailable actions remain visible but disabled, so menus retain a predictable shape and destructive actions cannot be triggered accidentally.
- Edit changes content or opens the corresponding editor. Reset changes layout only. Delete removes removable content.
- Core titles expose Edit/Reset; credit avatars can be hidden and restored from the top add menu.
- Special rules, images, unified explanations, and tower images expose all three actions when the content is removable.
- Menu surface uses an `8px` radius, subtle structural border, and `0 12px 32px rgba(31, 41, 34, 0.18)` shadow.

### MUI Dialogs

All MUI dialogs inherit the shared theme from `src/theme/dialogTheme.ts`.

- Paper radius: `8px`; full-screen dialogs use `0`.
- Desktop margin: `16px`; mobile margin: `12px`.
- Maximum paper height: `calc(100% - 32px)` desktop and `calc(100% - 24px)` mobile.
- Dialog paper uses `#FCFCFC`, no background image, and the shared layered shadow.
- Dialog title padding: `20px 24px 12px`; mobile: `16px 16px 10px`.
- Dialog content padding: `16px 24px`; mobile: `14px 16px`.
- Dialog actions padding: `16px 24px`; mobile: `14px 16px`.
- Dialog content owns vertical scrolling. Horizontal overflow is hidden and overscroll is contained.
- Page scroll locking is disabled for MUI dialogs; `scrollbar-gutter: stable` remains on the document.
- Do not wrap a dialog paper in a Framer Motion component that changes its underlying mount identity. MUI opacity and transform transitions are sufficient.

### A4 Export and Print

- Image export and system printing share the same MUI dialog, A4 preview, and browser-stored export scale. Both entry points remain available and the selected output mode is obvious.
- Reuse the live A4 preview in the editor and output dialog. Open it immediately; only generate high-resolution images after a download or print action, with cancellable progress.
- Show the entire page by default, with previous/next page controls, Ctrl/⌘ + wheel zoom, drag-to-pan, fit-page, and fit-width actions. Preview zoom must never change the exported layout.
- The small A4 thumbnail opens the larger preview by double-click, click, or keyboard activation and must not be selectable.
- Use the same layout and overflow check for preview, PNG export, and print. Stop and explain when content exceeds A4; do not silently shrink or crop it.
- In the A4 layout, reserve only the space needed by bottom-anchored components. Editor-only breathing room must not stretch the page or count as overflow.
- Default character cards use compact vertical padding so the complete example, explanation and cloud fit at the default 54% A4 scale without shrinking text.
- Print the prepared A4 pages through the browser's system dialog, so users can choose a printer or save as PDF. Keep the printing surface lightweight and exclude editor controls.
- Missing images and blocked print windows require a visible recovery action. Preserve the existing image replacement and proxy behavior.

### Inputs and Forms

- Inputs use the established MUI outline treatment with a clear structural border and readable focus ring.
- Form spacing follows the 4/8/12/16/24/32 scale.
- Dense dialog forms may use `size="small"`, but primary actions remain at least `40px` high.
- Validation and destructive states require text or icon feedback in addition to color.

## 5. Layout Principles

- Use a 4/8/12/16/24/32 spacing scale.
- Script page content may be dense; application chrome should remain quiet and predictable.
- Dialog titles, content, and action rows share the same horizontal grid.
- The top and bottom canvas add buttons share the same right-edge axis.
- Floating controls must not cover values, labels, or the final row of scrollable content.
- Cards and framed tool surfaces use an `8px` radius or less. Nested corners must be concentric with their padding.
- Prefer full-width bands and unframed tool regions over nested cards.
- At narrow widths, actions may wrap, but the title and close controls must remain visible.
- Print mode removes all editing frames, menus, add buttons, and alignment guides.

## 6. Drag, Resize, Snap, and Boundary Rules

These rules apply identically to top and bottom draggable objects.

- Drag activation threshold: `3px` scaled page distance.
- Snap threshold: `5px` scaled page distance.
- Snap candidates: page center lines, peer component edges, and peer component center lines.
- Header and lower-page objects snap only to peers in their own area. Their guides stop at the first team divider; pages without a header use the whole page for lower-page guides.
- Boundary behavior: clamp the visible interactive object inside its owning page or paper; decorative title flourishes do not constrain dragging.
- Top layout objects share the header band from the paper's top to the start of role content. The author line may extend to the actual first team divider, so its lower edge can touch the line. The divider adjusts the header height directly when dragged vertically; it has no separate button.
- The page itself may scale. All pointer deltas must be normalized through the measured page scale before persistence.
- Dragging updates the DOM or a local draft only. A store update is committed once when the pointer is released.
- A pointer release without movement must not write layout state.
- Keyboard movement uses arrow keys at `1px`, `Shift+Arrow` at `10px`, and `Home` to reset the active layout.
- Respect element geometry: the cloud stays on the bottom edge and moves horizontally; images retain their aspect ratio; fixed tower decoration follows its existing axis locks.
- Persisted layouts that are outside the current page bounds must be corrected on resize without creating a render loop.

## 7. Performance and Isolation

- The long script preview is a memoized rendering island.
- Dialog open/close state must not update the script preview tree.
- Context-menu state lives in `LayoutContextMenuHost`, outside the script preview tree.
- Pointer movement must not trigger a React render per frame.
- Drag completion may commit one store update, but must not change the preview root identity or remount the script pages.
- Footer component order must remain stable during updates; replacing an item must not append it to the end of the render list.
- Avoid `transition: all`. Animate only the specific properties needed.
- Use `will-change` only for transform, opacity, or filter when a measured first-frame stutter exists.

## 8. Accessibility

- Every icon-only control requires an accessible name and a hover title.
- One resize handle per frame is keyboard-focusable; all pointer handles remain available through expanded hit zones.
- Menus restore focus to their invoking control when dismissed with Escape or the backdrop.
- Focus-visible outlines use the layout green and remain visible against parchment surfaces.
- Coarse-pointer targets expand to at least `44px`.
- Reduced-motion preferences remove nonessential transitions without removing static hover or focus cues.
