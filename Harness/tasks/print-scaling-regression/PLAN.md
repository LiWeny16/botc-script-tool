# print-scaling-regression — PLAN

Task-level implementation plan and evidence. Main agent writes after second planning; implementer reads before coding.

## Goal

诊断「PDF 打印缩放无法调整」regression 的根因,确认是否由上次 push 的两个 commit 引入:
- `b40cb22` build: migrate to Vite 8 + fix runtime warnings(vite 7 rolldown-vite → vite 8 rolldown + plugin-react v6 + zod + framer-motion/key/MobX 修复)
- `edda41d` feat(i18n): complete translation coverage(i18n 翻译 + rebuild docs/)

## Acceptance Criteria

- [ ] 根因定位(具体是哪个 CSS / vite 行为 / 浏览器交互)
- [ ] 证据记录(git diff 片段 / CSS 内容 / 浏览器打印行为)
- [ ] 明确结论:是否 b40cb22/edda41d 引入,还是既有/浏览器因素
- [ ] 给出修复方向(若是 regression)

## Scope

Allowed write set:
- 仅诊断(W0 explore),不写源码。修复留待后续 /wf-max

Forbidden:
- 改任何 src/ 源码
- 回滚 commit(用 git show/diff 分析,不 reset/revert)
- 跑 build/run(只 git/ls/grep)

## Loaded Context

- 关键线索:`docs/assets/index-CEmR0r8w.css`(vite 8 build 产物)grep 命中 `@page|@media print` —— 静态 CSS 含打印规则,需查来源
- 全局打印 CSS:`App.tsx:67 printStyles`(`@page A4 margin:0`、`body * visibility:hidden`、`#script-preview 100vw/100vh`)、`ScriptPreview.tsx:258` 类似
- 打印缩放机制:`PrintDialog` 提示用户在浏览器对话框手动设 53%(`dialog.printScale`),项目内无自动缩放控件
- 已排除:本次 authorImage 功能的 `@media print`(B 列 display)—— 用户确认非这次导致,已恢复

## Subagent Dispatch

| Agent | Mode | Read Set | Write Set | Status |
|-------|------|----------|-----------|--------|
| explore-manager | W0 | src/, docs/, git history (b40cb22, edda41d) | 无(只读综合) | ✅ Done |
| architect-manager | W1 | src/print.css, App.tsx, ScriptPreview.tsx, AllCharacters.tsx, input.ts, PrintDialog.tsx | 无(只读,产出契约) | ✅ Done |
| architect-manager | D-GATE 补充 | W1 子报告 | 发完整 print.css + 文案给 CEO 落盘 CONTRACT.md | In Progress |
| implement-manager | W2 | CONTRACT.md + 现有源文件 | input.ts, print.css, App.tsx, ScriptPreview.tsx(派 implementers) | Pending |
| review-manager | W2R | diff + 打印保证清单 10 条 | review 报告 | Pending |

## D-GATE 决策

- **Q1 @page size**:KEEP `auto !important`(byte-for-byte,自主决策,零行为变化)
- **Q2 #script-preview-3**:ACCEPT fix(统一 showlist 含 -3,/repo/preview 第3页开始打印 = bug fix;commit + PROGRESS 标注此行为变化)
- **不动**:AllCharacters.tsx(route 专用覆盖层,删=regression)、main.tsx(import 顺序)、PrintDialog.tsx(用 t() 引用)

## W2 Dispatch Table

| Implementer | File | 改动 | 依赖 |
|---|---|---|---|
| A | src/utils/i18n/input.ts | 替换 4 处 dialog.printScale(cn/en/es/de) | CONTRACT.md 文案 |
| B1 | src/print.css | 整文件 rewrite(D1 规则集,含 -3 showlist) | CONTRACT.md 完整 CSS |
| B2 | src/App.tsx | 删 50-52、66-175、1096 行 printStyles | CONTRACT.md 行号 |
| B3 | src/pages/ScriptPreview.tsx | 删 256-312 行 GlobalStyles + import 行去 GlobalStyles | CONTRACT.md 行号 |

4 文件 disjoint → 可并行。B 拆分按 CONTRACT 严格执行(implementer 不自决规则,避免 drift)。

## Self-Audit Checklist(D-GATE)

- [x] Q1 决策记录(KEEP auto)
- [x] Q2 决策记录(ACCEPT -3,标注 /repo/preview 变化)
- [x] write-set disjoint:input.ts / print.css / App.tsx / ScriptPreview.tsx
- [x] AllCharacters.tsx / main.tsx / PrintDialog.tsx 明确不动
- [x] @page size flip 风险规避(KEEP auto)
- [ ] 打印行为不变 10 条 → W2R verifier 逐条验(待 W2 后)
- [ ] 用户打印验证 3 routes(/, /repo/preview, /all-characters)(待 W2R 后)

## Subagent Synthesis

Agents used: explore-manager + 6 researchers(print-css-audit, vite-css-diff, commit-build-analysis, commit-i18n-analysis, browser-print-behavior, timeline-evidence)

Findings accepted:
- **决定性**:构建 CSS `docs/assets/index-CEmR0r8w.css` 的 git blob hash `617ac8641f7bb874c35ab9cc4899bca80e651085` 在 `b40cb22~1`/`b40cb22`/`edda41d`/`HEAD` **全部相同**,`git diff` 空(三 agent 独立验证)
- @page 真正来源是 `src/print.css:14`(静态 import,`@page{margin:0!important;padding:0!important;size:auto!important}`),**非** emotion GlobalStyles
- emotion printStyles(App.tsx:67 / ScriptPreview.tsx:256 / AllCharacters.tsx:68)是运行时注入 `<style>`,不在静态 chunk
- 站点 CSS **无法**锁定浏览器 Scale 控件(Chromium issue 415631500 Won't Fix);Scale 变灰仅因 "Fit to page" 模式被选中
- printStyles 源码 9 个月未动(blame→666df021, 2025-10-24);两 commit 未碰任何 CSS/vite.config/PrintDialog

Findings rejected:
- "vite 8 静态提取 emotion GlobalStyles" 假说 —— 证伪(静态 CSS 含 `size:auto` 来自 print.css,不含 emotion 的 `A4 portrait`)

Conflicts(非关键):
- @page 有效 size:`auto`(print.css 的 `!important` 胜出)vs `A4 portrait`(emotion)。无论哪个都不锁 Scale

Decisions:
- **归因:b40cb22 和 edda41d 均未引入此问题**(≥90% 置信,字节级 CSS 相同是硬证据)
- **真因(最可能)**:Chrome/Edge 打印对话框处于 "Fit to page/适应页面" 模式,自定义缩放%框变灰(≈90%,待用户截图 100% 确认)

Residual risk:
- 未排除 JS bundle 变化对 emotion 注入时机的影响(可能性极低)
- 需用户打印对话框截图才能 100% 锁定

## Verification

| Check | Result | Notes |
|-------|--------|-------|
| git blob hash 跨迁移一致 | ✓ | 617ac8641f... 四点相同 |
| git diff b40cb22~1..HEAD(CSS) | ✓ 空 | 三 agent 独立验证 |
| @page 来源 | ✓ | src/print.css:14(静态),非 emotion |
| 站点 CSS 能否锁 Scale | ✗ 不能 | Chromium 415631500 Won't Fix |
| printStyles 源码改动 | ✓ 无 | blame→666df021(2025-10-24) |
