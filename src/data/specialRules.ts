// 特殊规则模板库
// 用于添加自定义规则时提供预设模板

export interface SpecialRuleTemplate {
    id: string;
    title: {
        'zh-CN': string;
        'en': string;
    };
    content: {
        'zh-CN': string;
        'en': string;
    };
    description?: {
        'zh-CN': string;
        'en': string;
    };
}

export const specialRuleTemplates: SpecialRuleTemplate[] = [
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
        description: {
            'zh-CN': '经典特殊规则，适合增加游戏趣味性',
            'en': 'Classic special rule for added fun',
        },
    },
    {
        id: 'god_in_play',
        title: {
            'zh-CN': '上帝出席',
            'en': 'God in Play',
        },
        content: {
            'zh-CN': '上帝宣布将会与一名玩家同阵营，如果处决说书人，那么该玩家的阵营落败。',
            'en': 'God announces they will be on the same team as a player. If the Storyteller is executed, that player\'s team loses.',
        },
        description: {
            'zh-CN': '适用于娱乐剧本。',
            'en': 'Just for fun scripts.',
        },
    },
    {
        id: 'secret_objective',
        title: {
            'zh-CN': '碟中谍',
            'en': 'Mission Impossible',
        },
        content: {
            'zh-CN': '游戏开始前, 有两名玩家会收到他们的秘密任务。完成任务的玩家可以获得额外的投票权或特殊能力。',
            'en': 'Each player gets a secret mission at game start. Completing it grants extra votes or abilities.',
        },
        description: {
            'zh-CN': '增加游戏的策略深度',
            'en': 'Adds strategic depth',
        },
    },
];

// 获取特殊规则模板
export function getSpecialRuleTemplate(id: string): SpecialRuleTemplate | undefined {
    return specialRuleTemplates.find(template => template.id === id);
}

// 获取所有特殊规则模板
export function getAllSpecialRuleTemplates(): SpecialRuleTemplate[] {
    return specialRuleTemplates;
}
