# Jinx 相克数据审计报告

日期：2026-08-28
审计对象：`src/data/sources/jinx{zh,en,es,de}.json`（经 `src/data/jinx.ts` 归一化后供全应用使用）
审计基准：
- 官方中文：https://clocktower-wiki.gstonegames.com/index.php?title=相克规则 （集石钟楼百科，2025-11 版）
- 官方英文：wiki.bloodontheclocktower.com 各角色页 Related Jinxes（实时抓取）

## 执行状态（2026-08-28 更新）

| 项目 | 状态 | 说明 |
|---|---|---|
| 0. 僵怖↔主谋 误挂亡骨魔规则 | ✅ 已修复 | zh/en/es/de 4 语言 + jinx_diff_result.json |
| P1. 打更人 id (`dayangren`→`dagengren`) | ✅ 已修复 | zh/en/es 修正 id；de 补 2 条缺失；en/es/de 文本角色名统一为官方英文名 **Firewatcher**（roles.json 核实），旧 `Dayangren` 全部清除 |
| P3. modern 文本过时 | ✅ 已修复（zh/en 双版本化） | 8 组配对做成 reason（现代官方文本）+ reasonLegacy（旧文本）；利维坦↔驱魔人 en 同步补"上个夜晚"（留旧文本为 legacy） |
| P4. 缺失官方规则 17 对 | ✅ 已补充（zh） | 仅 zh 补充（中文百科原文）；en/es/de 无官方翻译文本，未补（见 P4 说明） |
| P2. 过时 jinx（卡扎力 6 条 + 暴乱↔狂热者） | ⏸ 未处理 | 官方已删除，需确认后删除或降级 legacy（本轮未获授权） |
| P5. 存疑项（暴乱↔半仙、戏子"（改）"7 条） | ⏸ 未处理 | 按用户指示"不确定的不加"，保持现状 |
| P6. 已核实非问题 | — | 无需处理 |

**本轮验证**：4 文件 JSON 解析通过；mastermind↔zombuul 全语言为空、mastermind↔vigormortis 全语言在位；riot/leviathan↔dagengren 全语言在位；P4 17 对在 zh 全部在位；P3 各对 reason≠legacy；`tsc -b` 通过。

## 数据流与影响范围

```
jinx{zh,en,es,de}.json ──> src/data/jinx.ts(parseJinxSource/toZhCanonicalCharacterId)
     ──> src/utils/scriptGenerator.ts:699 生成剧本时按剧本角色自动挂接 jinx
     ──> UI 展示：CharacterCard.tsx（卡片 jinx 图标+文本）、JinxSection.tsx、CharacterEditDialog.tsx
     ──> AI 代理：src/utils/agentTools/jinxTools.ts（get_jinx_info / list_jinx）
```

- 存档剧本（docs/scripts、public/scripts）JSON 内不落 jinx 字段，运行时重新推导，修改源文件即可全链路生效。
- `jinx_diff_result.json` 为派生的开发比对产物（已同步本次已修项）。
- `python/add_jinx_en.py`、`scripts/compare_jinx.py` 为一次性脚本，不含受影响映射；`compare_jinx.py` 中 `'dayangren': 'dagengren'` 提示作者已知该拼写差异（但应用内 `characterIdMapping.ts` 未收录，见 P1）。

---

## 已修复（本次会话，已完成并验证）

### 0. 僵怖(Zombuul) ↔ 主谋(Mastermind) 误挂亡骨魔(Vigormortis) 规则
- 官方正确规则：**亡骨魔(Vigormortis) ↔ 主谋(Mastermind)** —— "A Mastermind that has their ability keeps it if the Vigormortis dies."（官方两站均已核实；僵怖与主谋没有任何相克）
- 原数据：zh/en/es 的 mastermind 条目搭档写为 `zombuul`；en/es 文本被改写成 Zombuul 版，zh 文本正确（亡骨魔）但配对错，de 整条缺失。
- 修改：jinxZh/En/Es 配对 `zombuul`→`vigormortis`（en/es 文本替换为官方文本），jinxDe 补缺失条目，`jinx_diff_result.json` 同步。
- 验证：4 文件 JSON 解析后 mastermind↔zombuul 均为空、mastermind↔vigormortis 均在，`tsc -b` 通过。

---

## 剩余问题（按优先级）

### P1. 打更人 id 拼写错误：`dayangren` vs 官方 `dagengren`（4 语言规则全不显示）

| 证据 | 位置 |
|---|---|
| 角色 id | `characters.ts:1494` → `"dagengren"`；`roles.json:2444` 同 |
| jinx 数据用错拼写 | jinxZh.json、jinxEn.json、jinxEs.json 各 2 处 `dayangren`（行号见文末附录），jinxDe.json 为 0 处 |

影响配对（官方规则，因 id 不一致而 `hasJinx` 永远查不到，全语言不显示）：
- 暴乱(riot) ↔ 打更人(dagengren)： "如果暴乱提名并处决了打更人上个夜晚猜测的其中一名玩家，善良阵营获胜。"
- 利维坦(leviathan) ↔ 打更人(dagengren)：同上

修复建议：3 个文件 `dayangren`→`dagengren`；jinxDe.json 补缺这 2 条；`characterIdMapping.ts` 可选加 别名兜底。

> ✅ 已执行（2026-08-28）：zh/en/es id 修正；jinxDe 补 2 条；en/es/de 文本中角色名改为官方英文名 **Firewatcher**（`roles.json:2444` 核实，官方 id `dagengren` / 英文名 `Firewatcher` / 中文名 打更人）。该角色英文名与 id 不同拼写，属官方设定，勿再"统一"成同名。
> ⚠️ `characterIdMapping.ts` 未加别名：正向映射 `dayangren→dagengren` 会反向把 `dagengren` 归一化成 `dayangren`，与数据键冲突，勿加。

### P2. 官方已删除的过时 jinx（modern 槽位残留，建议删除）

以下配对不存于官方两站任何当前页面，属旧版官方数据残留（en/es/zh 一致存在）：

| 配对 | 现存文本（摘） |
|---|---|
| 卡扎力 ↔ 半仙 | "The Kazali can turn the Banxian into an evil Minion." |
| 卡扎力 ↔ 唱诗男孩 | "cannot choose the King … if a Choirboy is in play" |
| 卡扎力 ↔ 莽夫 | "can choose that the Goon player is one of their evil Minions" |
| 卡扎力 ↔ 和尚 | "turn players neighboring the Heshang into evil Minions" |
| 卡扎力 ↔ 巡山人 | "Damsel … Huntsman is in play, a good player becomes the Damsel" |
| 卡扎力 ↔ 士兵 | "can choose that the Soldier player is one of their evil Minions" |
| 暴乱 ↔ 狂热者 | "狂热者在被提名后必须立马发起提名，即使自己已死亡。" |

官方依据：Kazali 页（当前仅 赏金猎人/提线木偶/召唤师 3 条）、Zealot 页（仅 Cannibal/Legion/Vizier）、中文相克规则页（均无）。

修复建议：4 语言删除上述 7 对（共 28 条）；如担心老玩家依赖旧文本，可先只删 modern 保留 legacy 字段（当前这些条目均无 reasonLegacy，需先补充 legacy 版本再降级）。

### P3. modern 文本放成了旧版文本（文本级错误，建议替换）

| 配对 | 仓库 modern 文本问题 | 官方当前文本 |
|---|---|---|
| 魔术师 ↔ 军团 | 旧版"一同唤醒/可注册为邪恶"（en/zh 同） | "If the Magician is in play, during the Demon info step, Legion wake in separate groups. Each group learns which players are good, but does not learn the Magician." / 中文见百科 |
| 数学家 ↔ 酒鬼 | "可能会得知"(en: might learn) | "learns"（会得知） |
| 数学家 ↔ 提线木偶 | 同上（marionette 条目内 "might learn"） | "learns" |
| 数学家 ↔ 悟道者 | "可能会得知"（zh） | "会得知" |
| 小怪宝 ↔ 罂粟种植者 | 中文"如果罂粟种植者在场" | "如果小怪宝和罂粟种植者都存活…" |
| 暴乱 ↔ 巡察 / 利维坦 ↔ 巡察 | 旧版"巡察保护的玩家免疫所有邪恶阵营负面效果"（en/zh 同） | "提名并处决了巡察上个夜晚保护的其中一名玩家，善良阵营获胜。" |
| 利维坦 ↔ 驱魔人 | 中文缺"上个夜晚" | "处决了驱魔人上个夜晚选择的那名玩家" |
| 入殓师 ↔ 红唇女郎 | 旧措辞（en/zh 同） | "如果即将出现两名存活的恶魔，其中之一是由红唇女郎转变的，红唇女郎不会变成恶魔。" |

修复建议：zh 以中文百科为准、en 以官方 wiki 文本为准分别替换（约 8 组 × 2 语言）。

### P4. 缺失的官方 jinx（中文百科收录、仓库 4 语言全无；属数据缺口）— 17 对

| 角色 A | 角色 B | 官方文本（摘要） |
|---|---|---|
| 狸猫(limao) | 教授(professor) | 与使用过能力的教授交换角色，新教授仍然失去能力 |
| 狸猫(limao) | 报丧女妖(banshee) | 交换不触发报丧女妖能力 |
| 狸猫(limao) | 科学怪人(boffin) | 恶魔获得狸猫能力与"太子"交换的处理 |
| 鸩(zhen) | 罂粟种植者(poppygrower) | 鸩选中罂粟种植者不会使其中毒 |
| 鸩(zhen) | 半仙(banxian) | 半仙中毒并死亡 |
| 孟婆(mengpo) | 罂粟种植者(poppygrower) | 孟婆选中即得知并死亡 |
| 孟婆(mengpo) | 红唇女郎(scarletwoman) | 恶魔选择死亡时的交换处理 |
| 蛊雕(gudiao) | 炼金术士(alchemist) | 炼金术士无法获得蛊雕能力 |
| 蛊雕(gudiao) | 魔术师(magician) | 蛊雕会跳过魔术师 |
| 蛊雕(gudiao) | 食人魔(ogre) | 蛊毒玩家被当作邪恶蛊雕 |
| 蛊雕(gudiao) | 瘟疫医生(plaguedoctor) | 说书人获得蛊雕能力的处理 |
| 瘟疫医生(plaguedoctor) | 赶尸人(ganshiren) | 改由爪牙获得能力 |
| 瘟疫医生(plaguedoctor) | 养蛊人(yangguren) | 同上 |
| 戏子(xizi) | 提线木偶(marionette) | 互为克星，只能有一个在场 |
| 戏子(xizi) | 蛊雕(gudiao) | 互为克星，只能有一个在场 |
| 典狱长(dianyuzhang) | 召唤师(summoner) | 第二晚可召唤典狱长替代第三晚 |
| 姑获鸟(guhuoniao) | 亡魂(wraith) | 姑获鸟无法获得亡魂能力时改为亡魂保留 |

注：全部为华灯初上/2025 实验角色（`edition: custom`），这些角色已存在于 characters.ts 但无对应 jinx。

> ✅ 已执行（2026-08-28）：17 对已按中文百科原文补齐进 jinxZh.json（新增 owner 条目：limao/zhen/mengpo/gudiao/plaguedoctor/dianyuzhang；追加：xizi、guhuoniao）。
> en/es/de 未补：这些配对无官方英文/西语/德语文本（华灯角色无英文 wiki 页），遵循"不确定的不加"原则；待集石官方多语言数据发布后再补。

### P5. 存疑项（资料冲突，未定论，暂不动）

- 暴乱 ↔ 半仙：zh/en/es 有（无 legacy），文本"当且仅当暴乱提名了半仙…"；中文百科未收录，半仙无英文 wiki 页 → 建议向集石侧确认后处置。
- 戏子"（改）"系列 7 条（科学怪人/落难少女/国王/小怪宝/疯子/书生/告密者）：文本含"（改）"标记，疑为戏子改版后的新版官方规则，中文百科（2025-11 版）未更新 → 建议核对新版中文百科后处置。

### P6. 已核实为“非问题”（不必处理）

- 提线木偶 ↔ 落难少女/罂粟种植者/告密者/亡魂：官方英文 wiki 收录（对应文案与仓库一致），仅中文百科页未收录。
- 工程师/帽匠 ↔ 军团、"无神论者 ↔ 戏子" 等措辞差异：与官方英文原文一致，中文百科为简写，无需改。

---

## 建议的后续动作（供选择）

1. P1 修正（4 文件 + 可选别名）——工作量小、收益明确
2. P2 删除 7 对过时 jinx（4 语言）——注意核对 legacy 字段策略
3. P3 文本替换（zh/en 为主）
4. P4 补齐 17 对 × 4 语言——工作量大，建议按 zh → en → es/de 顺序分批进行
5. 仓库根部残留误命名文件 `c?Learni…jinx_diff_compact.json`（旧比对产物），可删除

## 附录：P1 相关行号

- jinxZh.json：`"id": "dayangren"` 2 处（暴乱、利维坦条目内）
- jinxEn.json：第 297、690 行
- jinxEs.json：2 处（同 en）
- jinxDe.json：无该配对