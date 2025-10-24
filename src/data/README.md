# 特殊规则模板库

## 概述

`specialRules.ts` 文件包含了特殊规则的模板库，用于在添加自定义规则时提供预设模板。

## 使用方法

### 1. 添加新模板

在 `specialRules.ts` 中的 `specialRuleTemplates` 数组中添加新的模板：

```typescript
{
  id: 'your_rule_id',  // 唯一标识符
  title: {
    'zh-CN': '规则标题',
    'en': 'Rule Title',  // 英文标题应简短
  },
  content: {
    'zh-CN': '规则的详细内容...',
    'en': 'Short rule description...',  // 英文内容也应简洁
  },
  description: {  // 可选：规则的说明
    'zh-CN': '这个规则适用于...',
    'en': 'This rule is for...',
  },
}
```

### 2. 数据格式说明

#### I18nText 接口
```typescript
export interface I18nText {
  'zh-CN'?: string;
  'en'?: string;
}
```

#### SpecialRule 接口
```typescript
export interface SpecialRule {
  id: string;
  title?: string | I18nText;  // 支持纯字符串（向后兼容）或国际化对象
  content?: string | I18nText;
  sourceType?: 'state' | 'status' | 'special_rule';
  sourceIndex?: number;
}
```

### 3. 在 JSON 中的表示

添加新规则后，JSON 格式如下：

```json
{
  "id": "custom_rule_1234567890",
  "team": "special_rule",
  "title": {
    "zh-CN": "第七把交椅",
    "en": "The Seventh Chair"
  },
  "content": {
    "zh-CN": "在游戏开始时，第七个座位是空的...",
    "en": "At game start, the 7th seat is empty..."
  }
}
```

### 4. 向后兼容

系统支持纯字符串格式（向后兼容）：

```json
{
  "id": "custom_rule_old",
  "team": "special_rule",
  "title": "第七把交椅",
  "content": "在游戏开始时，第七个座位是空的..."
}
```

当只有中文时，会自动转换为纯字符串格式保存。

## 注意事项

1. **英文内容长度**：由于卷轴显示空间有限，英文内容应尽量简短
2. **唯一 ID**：每个模板的 `id` 必须唯一
3. **必填字段**：`id`、`title`、`content` 是必填的
4. **多语言支持**：至少提供中文，英文为可选但建议提供

## 示例模板

### 第七把交椅
```typescript
{
  id: 'seventh_chair',
  title: {
    'zh-CN': '第七把交椅',
    'en': 'The Seventh Chair',
  },
  content: {
    'zh-CN': '在游戏开始时，第七个座位是空的，但正常发角色。每局游戏限一次，说书人可以代表第七个座位发言，并可以参与提名。说书人决定在扮演第七个座位的角色时，该如何行动。',
    'en': 'At game start, the 7th seat is empty but gets a role. Once per game, the Storyteller may speak and nominate for this seat, deciding how to act.',
  },
}
```
