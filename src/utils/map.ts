// i18n 翻译映射表
export const translations = {
  'zh-CN': {
    // 通用
    'common.back': '返回',
    'common.loading': '加载中...',
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.success': '成功',
    'common.error': '错误',
    'common.warning': '警告',
    'common.save': '保存',
    
    // 主页面
    'app.title': '血染钟楼剧本生成器',
    'app.scriptRepository': '剧本仓库',
    'app.emptyState': '请在上方输入剧本 JSON 并点击"生成剧本"按钮',
    
    // SEO相关
    'seo.title': 'Onion的钟楼工具 - 血染钟楼剧本生成器',
    'seo.description': '专业的血染钟楼剧本生成工具，支持自定义角色配置、剧本导出、多种游戏模式。为血染钟楼爱好者提供便捷的剧本制作体验。',
    'seo.keywords': '血染钟楼,剧本生成器,BOTC,Blood on the Clocktower,桌游工具',
    'seo.appTitle': 'Onion的钟楼工具',
    
    // 输入面板
    'input.jsonLabel': '剧本 JSON',
    'input.jsonPlaceholder': '粘贴官方剧本制作器导出的 JSON 数据...',
    'input.generateScript': '生成剧本',
    'input.uploadJson': '上传 JSON',
  'input.exportImage': '导出图片',
  'input.copyJson': '复制 JSON',
  'input.shareScript': '分享剧本',
    'input.clear': '清空',
    'input.advancedOptions': '高级选项',
    'input.titleLabel': '剧本标题（可选）',
    'input.titlePlaceholder': '自定义剧本',
    'input.authorLabel': '剧本作者（可选）',
    'input.authorPlaceholder': '作者名称',
    'input.resetSettings': '恢复初始设置',
    'input.errorEmpty': '请输入剧本 JSON 数据',
    'input.errorParse': '解析 JSON 失败',
    'input.jsonCopied': 'JSON已复制到剪贴板！',
    'input.exportJsonFailed': '导出JSON失败，请重试',
    'input.exportImageFailed': '导出图片失败，请重试。如果问题持续，请刷新页面后重试。',
    
    // 确认对话框
    'dialog.resetTitle': '确认恢复初始设置',
    'dialog.resetMessage': '此操作将清除所有自定义设置（包括语言偏好），恢复到默认状态。是否继续？',
    'dialog.resetSuccess': '设置已恢复到初始状态',
    
    // 提示信息
    'info.supportOfficial': '• 支持官方剧本制作器的剧本 JSON',
    'info.supportFormats': '• 支持鸦木布拉夫、汀西维尔、福波斯等各个人数的剧本格式',
    'info.experimentalCharacters': '• 2025/1/3 之后的实验性角色暂未录入，请使用完整 JSON 信息',
    
    // 剧本信息
    'script.author': '剧本作者',
    'script.author2': '作者',
    'script.playerCount': '支持',
    
    // 团队名称
    'team.good': '善良阵营',
    'team.evil': '邪恶阵营',
    'team.townsfolk': '镇民',
    'team.outsider': '外来者',
    'team.minion': '爪牙',
    'team.demon': '恶魔',
    'team.fabled': '传奇角色',
    'team.traveler': '旅行者',
    
    // 夜晚顺序
    'night.first': '首个夜晚',
    'night.other': '其他夜晚',
    
    // 剧本仓库
    'repo.title': '剧本仓库',
    'repo.subtitle': '浏览和预览血染钟楼剧本',
    'repo.searchPlaceholder': '搜索剧本名称、作者...',
    'repo.noResults': '未找到匹配的剧本',
    'repo.backToGenerator': '返回剧本生成器',
    'repo.backToRepository': '返回剧本仓库',
    'repo.exportJson': '导出JSON',
    'repo.author': '作者',
    
    // 错误信息
    'error.scriptNotFound': '未找到剧本',
    'error.noScriptName': '未指定剧本名称',
    'error.loadFailed': '加载剧本失败',
    'error.unknownError': '未知错误',
    'error.noJsonParam': '缺少 JSON 参数',

    // 分享功能
    'share.title': '分享剧本给朋友',
    'share.step1': '步骤1：创建 Gist',
    'share.step2': '步骤2：生成分享链接',
    'share.step1Description': '访问 gist.github.com，粘贴你的 JSON 数据，创建 Gist，然后复制 Raw 链接',
    'share.openGist': '打开 Gist',
    'share.copyJson': '复制 JSON',
    'share.copyJsonTooltip': '复制当前剧本的 JSON 数据',
    'share.gistUrlLabel': 'Gist Raw 链接',
    'share.generatedLinks': '生成的分享链接',
    'share.fullScriptLink': '完整剧本链接',
    'share.compressedLink': '压缩链接',
    'share.compressedDescription': '使用简化格式，只包含角色 ID，链接更短',
    'share.copyLink': '复制链接',
    
    // 角色编辑
    'editCharacter': '编辑角色',
    'basicInfo': '基本信息',
    'characterName': '角色名称',
    'team': '阵营',
    'ability': '能力描述',
    'imageUrl': '图片链接',
    'nightOrder': '夜晚行动顺序',
    'firstNight': '首夜顺序',
    'otherNight': '其他夜晚顺序',
    'storytellerReminders': '说书人提醒',
    'firstNightReminder': '首夜提醒',
    'otherNightReminder': '其他夜晚提醒',
    'reminderTokens': '提醒标记',
    'addReminder': '添加提醒标记（回车确认）',
    'addReminderPlaceholder': '输入提醒内容',
    'preview': '预览',
    
    // 阵营
    'townsfolk': '镇民',
    'outsider': '外来者',
    'minion': '爪牙',
    'demon': '恶魔',
    'fabled': '传奇',
    'traveler': '旅行者',
    
    // 角色库
    'characterLibrary': '角色库',
    'searchCharacters': '搜索角色名称、能力描述...',
    'addToScript': '添加到剧本',
    'noSearchResults': '未找到匹配的角色',
    'noCharactersInTeam': '该阵营暂无角色',
    'all': '全部',
    'loading': '加载中...',
    'selectedCharacters': '已选角色',
    'selected': '已选',
    
    // 相克规则
    'jinx.rule': '相克规则',
  },
  'en': {
    // Common
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.warning': 'Warning',
    'common.save': 'Save',
    
    // Main Page
    'app.title': 'Blood on the Clocktower Script Generator',
    'app.scriptRepository': 'Script Repository',
    'app.emptyState': 'Please enter script JSON above and click "Generate Script" button',
    
    // SEO Related
    'seo.title': 'Onion\'s Clocktower Tool - Blood on the Clocktower Script Generator',
    'seo.description': 'Professional Blood on the Clocktower script generation tool with custom character configuration, script export, and multiple game modes. Providing convenient script creation experience for BOTC enthusiasts.',
    'seo.keywords': 'Blood on the Clocktower,BOTC,Script Generator,Board Game Tool,Clocktower',
    'seo.appTitle': 'Onion\'s Clocktower Tool',
    
    // Input Panel
    'input.jsonLabel': 'Script JSON',
    'input.jsonPlaceholder': 'Paste JSON data exported from official script maker...',
    'input.generateScript': 'Generate Script',
    'input.uploadJson': 'Upload JSON',
    'input.exportImage': 'Export Image',
    'input.copyJson': 'Copy JSON',
    'input.shareScript': 'Share Script',
    'input.clear': 'Clear',
    'input.advancedOptions': 'Advanced Options',
    'input.titleLabel': 'Script Title (Optional)',
    'input.titlePlaceholder': 'Custom Script',
    'input.authorLabel': 'Script Author (Optional)',
    'input.authorPlaceholder': 'Author Name',
    'input.resetSettings': 'Reset to Default',
    'input.errorEmpty': 'Please enter script JSON data',
    'input.errorParse': 'Failed to parse JSON',
    'input.jsonCopied': 'JSON copied to clipboard!',
    'input.exportJsonFailed': 'Failed to export JSON, please retry',
    'input.exportImageFailed': 'Failed to export image, please retry. If the problem persists, please refresh the page and try again.',
    
    // Confirm Dialog
    'dialog.resetTitle': 'Confirm Reset to Default',
    'dialog.resetMessage': 'This will clear all custom settings (including language preferences) and restore to default state. Continue?',
    'dialog.resetSuccess': 'Settings have been reset to default',
    
    // Info
    'info.supportOfficial': '• Support official script maker JSON format',
    'info.supportFormats': '• Support Trouble Brewing, Sects & Violets, Bad Moon Rising and other formats',
    'info.experimentalCharacters': '• Experimental characters after 2025/1/3 are not included, please use complete JSON info',
    
    // Script Info
    'script.author': 'Script Author',
    'script.author2': 'Author',
    'script.playerCount': 'Supports',
    
    // Team Names
    'team.good': 'Good',
    'team.evil': 'Evil',
    'team.townsfolk': 'Townsfolk',
    'team.outsider': 'Outsider',
    'team.minion': 'Minion',
    'team.demon': 'Demon',
    'team.fabled': 'Fabled',
    'team.traveler': 'Traveler',
    
    // Night Order
    'night.first': 'First Night',
    'night.other': 'Other Nights',
    
    // Script Repository
    'repo.title': 'Script Repository',
    'repo.subtitle': 'Browse and preview Blood on the Clocktower scripts',
    'repo.searchPlaceholder': 'Search script name, author...',
    'repo.noResults': 'No matching scripts found',
    'repo.backToGenerator': 'Back to Generator',
    'repo.backToRepository': 'Back to Repository',
    'repo.exportJson': 'Export JSON',
    'repo.author': 'Author',
    
    // Errors
    'error.scriptNotFound': 'Script not found',
    'error.noScriptName': 'No script name specified',
    'error.loadFailed': 'Failed to load script',
    'error.unknownError': 'Unknown error',
    'error.noJsonParam': 'Missing JSON parameter',

    // Share Feature
    'share.title': 'Share Script with Friends',
    'share.step1': 'Step 1: Create Gist',
    'share.step2': 'Step 2: Generate Share Link',
    'share.step1Description': 'Visit gist.github.com, paste your JSON data, create a Gist, then copy the Raw link',
    'share.openGist': 'Open Gist',
    'share.copyJson': 'Copy JSON',
    'share.copyJsonTooltip': 'Copy current script JSON data',
    'share.gistUrlLabel': 'Gist Raw Link',
    'share.generatedLinks': 'Generated Share Links',
    'share.fullScriptLink': 'Full Script Link',
    'share.compressedLink': 'Compressed Link',
    'share.compressedDescription': 'Uses simplified format with only character IDs, shorter URL',
    'share.copyLink': 'Copy Link',
    
    // Character Edit
    'editCharacter': 'Edit Character',
    'basicInfo': 'Basic Information',
    'characterName': 'Character Name',
    'team': 'Team',
    'ability': 'Ability Description',
    'imageUrl': 'Image URL',
    'nightOrder': 'Night Action Order',
    'firstNight': 'First Night Order',
    'otherNight': 'Other Nights Order',
    'storytellerReminders': 'Storyteller Reminders',
    'firstNightReminder': 'First Night Reminder',
    'otherNightReminder': 'Other Nights Reminder',
    'reminderTokens': 'Reminder Tokens',
    'addReminder': 'Add Reminder Token (Press Enter)',
    'addReminderPlaceholder': 'Enter reminder text',
    'preview': 'Preview',
    
    // Teams
    'townsfolk': 'Townsfolk',
    'outsider': 'Outsider',
    'minion': 'Minion',
    'demon': 'Demon',
    'fabled': 'Fabled',
    'traveler': 'Traveler',
    
    // Character Library
    'characterLibrary': 'Character Library',
    'searchCharacters': 'Search character name, ability...',
    'addToScript': 'Add to Script',
    'noSearchResults': 'No matching characters found',
    'noCharactersInTeam': 'No characters in this team',
    'all': 'All',
    'loading': 'Loading...',
    'selectedCharacters': 'Selected Characters',
    'selected': 'Selected',
    
    // Jinx Rules
    'jinx.rule': 'Jinx Rule',
  },
};

// 类型定义
export type Language = 'zh-CN' | 'en';
export type TranslationKey = keyof (typeof translations)['zh-CN'];

