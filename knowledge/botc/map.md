# BOTC Knowledge Map

> 企业级知识库索引 — 人机共读。Agent 启动时强制加载此文件，用于导航整个知识体系。

## 知识库架构

```
Tier 1: 核心注入 (每次对话强制注入 system prompt，~500 tokens)
  ├── 游戏模型 (角色类型、昼夜循环、胜负条件)
  ├── 机制标签速查表 (poisoned/drunk/madness/registration...)
  └── 设计启发速查 (信息经济、死亡节奏、伪装空间)

Tier 2: 本地文档 (Agent 通过 search_knowledge / get_knowledge_topic 按需检索)
  ├── core-rules.md          核心规则模型
  ├── mechanics-ontology.md  机制本体论与标签体系
  ├── rules-reference.md 🆕  综合规则参考（设置/阶段/状态/隐性规则/术语表）
  ├── script-design.md       剧本设计启发法
  ├── ai-generation-playbook.md  AI生成工作流
  ├── storyteller-guide.md 🆕  说书人操作指南（技巧+YBD清单）
  ├── rules-changelog.md 🆕  规则变动日志（能力调整+相克更新）
  ├── sources.md             来源与使用政策
  ├── data-contract.md       数据契约(知识库↔代码)
  └── README.md              知识库使用说明

Tier 3: 官方百科 (Agent 通过 fetch_wiki 工具实时获取)
  └── clocktower-wiki.gstonegames.com
```

---

## 文档目录

### core-rules.md
- **路径**: `knowledge/botc/core-rules.md`
- **大小**: 3.7 KB
- **优先级**: ⭐⭐⭐ CRITICAL — 每次注入
- **描述**: AI 理解 BOTC 所需的最小概念模型
- **覆盖主题**:
  - 角色类型 (Townsfolk/Outsider/Minion/Demon/Traveller/Fabled)
  - 核心循环 (Night → Day → Death)
  - 胜负条件
  - 说书人权威
  - 信息完整性 (醉酒/中毒/假信息/注册)
  - 设置效果 (Setup Effects)
  - 夜晚行动顺序
- **官方来源**: `tpi-script-wiki`, `tpi-scripts-page`
- **本地数据**: `src/data/sources/roles.json`
- **官方百科对应页**:
  - `https://clocktower-wiki.gstonegames.com/index.php?title=规则概要`
  - `https://clocktower-wiki.gstonegames.com/index.php?title=重要细节`

### mechanics-ontology.md
- **路径**: `knowledge/botc/mechanics-ontology.md`
- **大小**: 3.9 KB
- **优先级**: ⭐⭐⭐ CRITICAL — 每次注入标签速查表
- **描述**: 角色分类标签和交互风险等级体系
- **覆盖主题**:
  - 核心状态标签 (death/execution/drunk/poisoned/false_info/registration/alignment_change/character_change/madness/extra_evil/outsider_modification/demon_bluff/public_claim/private_info/global_info/st_choice)
  - 队伍功能标签 (Townsfolk/Outsider/Minion/Demon 功能分类)
  - 交互风险等级 (low/medium/high/requires_jinx/avoid_for_new_players)
- **官方来源**: 本地角色数据 + 官方剧本指南
- **官方百科对应页**:
  - `https://clocktower-wiki.gstonegames.com/index.php?title=角色能力类别总览`
  - `https://clocktower-wiki.gstonegames.com/index.php?title=术语汇总`

### script-design.md
- **路径**: `knowledge/botc/script-design.md`
- **大小**: 4.0 KB
- **优先级**: ⭐⭐ HIGH — 设计任务时检索
- **描述**: 剧本构建和平衡启发法
- **覆盖主题**:
  - 剧本即承诺 (Script as a Promise)
  - 标准结构 (13/4/4/4)
  - 六轴平衡 (信息/死亡节奏/伪装空间/外来者压力/设置不确定性/说书人负担)
  - 信息经济 (Information Economy)
  - 邪恶伪装空间 (Evil Bluffing)
  - 死亡与节奏 (Death and Tempo)
  - 复杂度预算 (玩家/说书人/交互)
  - 相克审查清单 (Jinx Review)
  - AI 输出要求
- **官方来源**: `tpi-script-wiki`, `tpi-scripts-page`
- **官方百科对应页**:
  - `https://clocktower-wiki.gstonegames.com/index.php?title=设计师的平衡天书`
  - `https://clocktower-wiki.gstonegames.com/index.php?title=相克规则`

### ai-generation-playbook.md
- **路径**: `knowledge/botc/ai-generation-playbook.md`
- **大小**: 3.3 KB
- **优先级**: ⭐⭐ HIGH — 生成/审查任务时检索
- **描述**: AI 生成或审查剧本的推荐工作流
- **覆盖主题**:
  - 定义 Brief (目标群体/风格/人数)
  - 构建候选 (Build a Candidate)
  - 标签化机制 (Tag Mechanics)
  - 健康检查 (Script Health)
  - 相克与数据验证 (Jinx and Data Validation)
  - 二次审查 (Second-Pass Review)
  - 最终产出 (Final Artifacts)
  - Prompt 模板
- **官方来源**: 本地角色数据 + 相克数据 + 官方剧本指南
- **官方百科对应页**:
  - `https://clocktower-wiki.gstonegames.com/index.php?title=“规则”与“理念”——关于角色能力互动的说明`

### sources.md
- **路径**: `knowledge/botc/sources.md`
- **大小**: 2.1 KB
- **优先级**: ⭐ MEDIUM — 溯源时检索
- **描述**: 数据来源政策、归属和法律边界
- **覆盖主题**:
  - 主要来源清单 (官方Wiki/GitHub/本地数据)
  - 来源处理规则
  - 本地数据边界
- **官方百科对应页**:
  - `https://clocktower-wiki.gstonegames.com/index.php?title=首页`

### data-contract.md
- **路径**: `knowledge/botc/data-contract.md`
- **大小**: 2.5 KB
- **优先级**: ⭐ MEDIUM — 数据验证时检索
- **描述**: 知识库与本地代码数据的映射契约
- **覆盖主题**:
  - 结构化数据文件索引
  - 角色字段说明
  - 多语言字典构建流程
  - 相克数据使用规范
  - 未来 JSON 产出物建议

### rules-reference.md 🆕
- **路径**: `knowledge/botc/rules-reference.md`
- **优先级**: ⭐⭐⭐ CRITICAL — 规则查询时检索
- **描述**: 综合官方百科的完整规则参考（规则概要+重要细节+术语汇总+隐性规则）
- **覆盖主题**:
  - 初始设置流程 (10步)
  - 夜晚/白天阶段详解
  - 角色能力10条规则
  - 状态系统 (存活/死亡、阵营/角色、醉酒/中毒、疯狂)
  - 7条隐性规则 (同时触发、不能最大、循环中毒、角色唯一、死亡顺序、过时不候、角色详解限制)
  - 核心术语表 (~40个术语)
- **官方百科对应页**: 规则概要、重要细节、术语汇总、隐性规则

### storyteller-guide.md 🆕
- **路径**: `knowledge/botc/storyteller-guide.md`
- **优先级**: ⭐⭐ HIGH — 说书人/设计任务时检索
- **描述**: 说书人操作指南（给说书人的建议+可以但不建议）
- **覆盖主题**:
  - 17条操作技巧 (提前结束、确认选择、假装移动标记、犯错处理等)
  - 7条趣味建议 (不破坏规则、让玩家决定、处理消极行为等)
  - YBD清单 (基础规则4项 + 暗流涌动/黯月初升/梦殒春宵/实验性角色)
- **官方百科对应页**: 给说书人的建议、可以但不建议

### rules-changelog.md 🆕
- **路径**: `knowledge/botc/rules-changelog.md`
- **优先级**: ⭐ MEDIUM — 最新信息查询时检索
- **描述**: 官方规则变动追踪（Steven设计日志+官方百科公示）
- **覆盖主题**:
  - 15+角色能力调整 (国王、小怪宝、气球驾驶员、瘟疫医生、痢蛭等)
  - 2025年10月相克规则重大更新
  - ~20条新增相克 + ~11条调整相克
  - 利维坦系列相克调整
  - 华灯初上系列变动
- **官方百科对应页**: 规则调整提前公示、相克规则

### README.md
- **路径**: `knowledge/botc/README.md`
- **大小**: 1.9 KB
- **优先级**: ⭐ LOW — 首次加载时检索
- **描述**: 知识库用途、推荐阅读顺序、使用目标
- **覆盖主题**:
  - 使用场景 (Use Cases)
  - 推荐阅读顺序
  - 非目标 (Non-Goals)
  - 推荐 AI 指令

---

## 官方百科页面索引

Agent 可通过 `fetch_wiki` 工具动态获取以下页面内容：

### 游戏规则
| 页面 | URL | 对应知识文档 |
|------|-----|-------------|
| 规则概要 | `/index.php?title=规则概要` | core-rules.md |
| 重要细节 | `/index.php?title=重要细节` | core-rules.md |
| 术语汇总 | `/index.php?title=术语汇总` | mechanics-ontology.md |
| 给说书人的建议 | `/index.php?title=给说书人的建议` | script-design.md |
| 相克规则 | `/index.php?title=相克规则` | script-design.md |
| 规则解释 | `/index.php?title=规则解释` | core-rules.md |
| 夜晚行动顺序一览 | `/index.php?title=夜晚行动顺序一览` | core-rules.md |
| 隐性规则 | `/index.php?title=钟楼谜团隐性规则汇总` | core-rules.md |
| 可以但不建议 | `/index.php?title=哪些是"可以但不建议"` | script-design.md |
| 规则调整提前公示 | `/index.php?title=规则调整提前公示` | core-rules.md |

### 角色
| 页面 | URL | 说明 |
|------|-----|------|
| 暗流涌动 | `/index.php?title=暗流涌动` | TB 全角色 |
| 黯月初升 | `/index.php?title=黯月初升` | BMR 全角色 |
| 梦殒春宵 | `/index.php?title=梦殒春宵` | S&V 全角色 |
| 旅行者 | `/index.php?title=旅行者` | 全旅行者 |
| 传奇角色 | `/index.php?title=传奇角色` | 全传奇角色 |
| 实验性角色 | `/index.php?title=实验性角色` | 实验性合集 |
| 奇遇角色 | `/index.php?title=奇遇角色` | 奇遇合集 |
| 华灯初上 | `/index.php?title=华灯初上` | 国风系列 |
| 角色能力类别总览 | `/index.php?title=角色能力类别总览` | 按能力分类 |

### 拓展阅读
| 页面 | URL |
|------|-----|
| 规则与理念 | `/index.php?title="规则"与"理念"——关于角色能力互动的说明` |
| 设计师的平衡天书 | `/index.php?title=设计师的平衡天书` |
| 创作幕后-超越暗流涌动 | `/index.php?title=创作幕后——超越暗流涌动` |
| 成为一个好说书人的经历 | `/index.php?title=成为一个好说书人的经历` |
| 创作幕后-逻辑混乱 | `/index.php?title=创作幕后——逻辑一片混乱？` |
| 染是策略游戏 | `/index.php?title=染·钟楼谜团是一款策略游戏` |
| 国内玩家错误理解 | `/index.php?title=设计师总结的国内玩家对染的错误理解` |
| 疯狂规则如何运作 | `/index.php?title=疯狂规则如何运作？——疯狂的小精灵` |
| 说书人的创造力 | `/index.php?title=有关说书人的创造力--有趣的巫师` |
| 钟楼笔记-相克更新 | `/index.php?title=钟楼笔记：相克更新` |

---

## Agent 检索策略

### 启动时 (强制注入)
```
1. map.md 本文件摘要 (文档目录 + 检索策略)
2. 核心游戏模型 (< 200 tokens)
3. 机制标签速查表 (< 150 tokens)
4. 设计启发速查 (< 150 tokens)
```

### 对话中 (按需检索)
```
用户提到具体规则 → search_knowledge (本地) + fetch_wiki (官方)
用户要求设计剧本 → search_knowledge("script design") + get_knowledge_topic("Script Design Heuristics")
用户讨论具体角色 → search_characters + get_jinx_info + fetch_wiki(该角色所属剧本)
用户要求审查剧本 → get_knowledge_topic("AI Generation Playbook") + get_knowledge_topic("Mechanics Ontology")
```

### 动态 Wiki 获取
```
fetch_wiki("规则概要")       → 获取官方规则概要全文
fetch_wiki("暗流涌动")       → 获取暗流涌动全部角色
fetch_wiki("相克规则")       → 获取最新官方相克规则
fetch_wiki("术语汇总")       → 获取术语定义
```

---

## 来源归属

| 数据 | 来源 | 许可 |
|------|------|------|
| 角色 JSON | bra1n/townsquare (GitHub) | 开源 |
| 中文角色文本 | clocktower.gstonegames.com | 集石官方 |
| 西班牙语翻译 | bra1n/townsquare (GitHub) | 开源 |
| 官方规则/角色说明 | clocktower-wiki.gstonegames.com | 集石 + TPI |
| 知识库文档 | 本项目手工维护 | 项目内部使用 |
| 本地相克数据 | `src/data/sources/jinx*.json` | 项目内置 |
