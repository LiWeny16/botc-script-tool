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
    'input.uploadImage': '点击或拖拽上传图片',
    'input.reuploadImage': '点击重新上传',
    'input.exportImage': '导出PDF',
    'input.exportJson': '导出 JSON',
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
    'input.officialIdParseMode': '只以官方ID解析（双语）',
    'input.officialIdParseModeWarning': '开启后无法自定义编辑角色',
    'input.twoPageMode': '双页模式',
    'input.twoPageModeDesc': '相克、传奇、旅行者单独一页',

    // 确认对话框
    'dialog.resetTitle': '确认恢复初始设置',
    'dialog.resetMessage': '此操作将清除所有自定义设置（包括语言偏好），恢复到默认状态。是否继续？',
    'dialog.resetSuccess': '设置已恢复到初始状态',
    'dialog.clearTitle': '确认清空剧本',
    'dialog.clearMessage': '此操作将清空当前剧本、所有角色选择和 JSON 数据。是否继续？',

    // 提示信息
    'info.supportOfficial': '• 支持官方剧本制作器的剧本 JSON',
    'info.supportFormats': '• 支持鸦木布拉夫、汀西维尔、福波斯等各个人数的剧本格式',
    'info.experimentalCharacters': '• 原创角色部分未收录，请使用完整 JSON 信息',

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
    'team.fabled': '说书人·传奇角色',
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
    'repo.aboutAndThanks': '关于 & 致谢',

    // 关于和致谢
    'about.title': '关于 & 致谢',
    'about.aboutProject': '关于项目',
    'about.projectDescription': '这是一个完全免费且开源的血染钟楼剧本生成工具，旨在为钟楼爱好者提供便捷的剧本制作体验。本项目不收取任何费用，所有功能均可免费使用。如果您觉得这个工具对您有帮助，欢迎通过捐赠支持项目的持续开发和维护。',
    'about.donate': '支持我们',
    'about.acknowledgments': '致谢',
    'about.thankValen': 'Valen - 美术建议与 Bug 修复',
    'about.specialThanks': '特别鸣谢',
    'about.nusClub': 'NUS 桌游社',
    'about.designReference': '美工设计参考',
    'about.museum': '钟楼博物馆',
    'about.letterClosing': '怀着感恩的心，BigOnion 敬上',

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

    // 标题编辑
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

    // 标题编辑对话框
    'title.edit': '编辑标题',
    'title.title': '剧本标题',
    'title.titleImage': '标题图片链接（可选）',
    'title.subtitle': '副标题（可选）',
    'title.author': '作者',
    'title.playerCount': '支持人数（可选）',
    'title.fontSize': '标题字体大小',
    'title.fontSizeXs': '手机端',
    'title.fontSizeSm': '平板端',
    'title.fontSizeMd': '桌面端',
    'title.save': '保存',
    'title.cancel': '取消',

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
    'jinx.title': '相克规则',
    'jinx.section': '相克规则',
    'jinx.and': '与',

    // 角色操作
    'character.edit': '编辑',
    'character.delete': '删除',

    // UI 设置
    'ui.settings': 'UI 设置',
    'ui.pinDrawer': '固定抽屉',
    'ui.unpinDrawer': '解除固定',
    'ui.searchSettings': '搜索设置...',
    'ui.noResults': '没有找到匹配的设置',
    'ui.manageCustomFonts': '管理自定义字体',
    'ui.resetAllSettings': '重置所有设置',
    'ui.resetUISettings': '重置所有UI设置',
    'dialog.resetUIMessage': '确定要重置所有UI设置吗？',

    // 分类1: 页面布局
    'ui.category.pageLayout': '页面布局',
    'ui.enableTwoPageMode': '启用双页面模式',
    'ui.twoPageModeDesc': '相克、传奇、旅行者单独一页',
    'ui.titleHeight': '标题区域高度',
    'ui.nightOrderBackground': '夜晚顺序背景',
    'ui.purpleBackground': '紫色背景',
    'ui.yellowBackground': '黄色背景',
    'ui.greenBackground': '青绿色背景',

    // 分类2: 角色卡片布局
    'ui.category.cardLayout': '角色卡片布局',
    'ui.cardPaddingX': '卡片内边距（水平）',
    'ui.cardPaddingY': '卡片内边距（竖直）',
    'ui.cardGap': '卡片元素间距',
    'ui.textAreaGap': '文本区域间距',

    // 分类3: 图标大小配置
    'ui.category.iconSize': '图标大小配置',
    'ui.avatarSize': '角色头像',
    'ui.avatarWidthMd': '头像宽度',
    'ui.avatarHeightMd': '头像高度',
    'ui.adjustUI': "PDF导出设置",
    'ui.jinxIconSize': '相克图标',
    'ui.jinxIconWidthMd': '相克图标宽度',
    'ui.jinxIconHeightMd': '相克图标高度',
    'ui.fabledIconSize': '传奇图标',
    'ui.fabledIconWidthMd': '传奇图标宽度',
    'ui.fabledIconHeightMd': '传奇图标高度',

    // 分类4: 字体设置
    'ui.category.fontSettings': '字体设置',
    'ui.font.scriptTitle': '剧本标题字体',
    'ui.font.teamDivider': '阵营分割文字字体',
    'ui.font.characterName': '角色名称字体',
    'ui.font.characterAbility': '角色技能描述字体',
    'ui.font.jinxText': 'Jinx相克规则字体',
    'ui.font.stateRuleTitle': '第一页特殊规则标题字体',
    'ui.font.stateRuleContent': '第一页特殊规则内容字体',
    'ui.font.specialRuleTitle': '第二页特殊规则标题字体',
    'ui.font.specialRuleContent': '第二页特殊规则内容字体',
    'ui.font.page1Rules': '第一页特殊规则字体',
    'ui.font.page2Rules': '第二页特殊规则字体',
    'ui.font.titleFont': '标题字体',
    'ui.font.contentFont': '内容字体',

    // 字体上传器
    'fontUploader.title': '自定义字体管理',
    'fontUploader.uploadNew': '上传新字体',
    'fontUploader.fontName': '字体名称',
    'fontUploader.fontNameHelper': '例如：我的自定义字体',
    'fontUploader.fontFamily': 'Font Family 名称',
    'fontUploader.fontFamilyHelper': 'CSS中使用的字体名称，例如：MyCustomFont',
    'fontUploader.selectFile': '选择字体文件',
    'fontUploader.fileSelected': '已选择文件',
    'fontUploader.fileHelper': '支持 .ttf, .otf, .woff, .woff2 格式，最大 15MB',
    'fontUploader.addFont': '添加字体',
    'fontUploader.uploading': '上传中...',
    'fontUploader.uploadedFonts': '已上传的字体',
    'fontUploader.fontCount': '个',
    'fontUploader.close': '关闭',
    'fontUploader.deleteConfirm': '确定要删除这个自定义字体吗？',
    'fontUploader.errorInvalidFile': '请选择有效的字体文件 (.ttf, .otf, .woff, .woff2)',
    'fontUploader.errorFileSize': '字体文件大小不能超过 15MB',
    'fontUploader.errorAllFields': '请填写所有字段并选择字体文件',
    'fontUploader.errorReadFile': '读取字体文件失败',
    'fontUploader.errorUpload': '上传字体失败，请重试',

    // 装饰框文本
        // Decorative Frame Text
    'decorative.page2Text': '相克规则 · 传奇角色 · 旅行者',

    // Credits
    'credits.designTitle': '美术设计',
    'credits.designers': '大聪花',

    // Special Rules

    // 特殊规则
    'specialRules.title': '特殊规则',
    'specialRules.add': '添加特殊规则',
    'specialRules.edit': '编辑特殊规则',
    'specialRules.delete': '删除规则',
    'specialRules.stateRules': '状态规则',
    'specialRules.dialogTitle': '添加自定义规则',
    'specialRules.selectType': '选择规则类型',
    'specialRules.specialRule': '特殊规则',
    'specialRules.stateRule': '状态规则',
    'specialRules.cancel': '取消',
    'specialRules.confirm': '确定',

    // Custom Jinx
    'customJinx.addTitle': '添加自定义相克关系',
    'customJinx.editTitle': '编辑相克关系',
    'customJinx.characterA': '角色 A',
    'customJinx.characterB': '角色 B',
    'customJinx.description': '相克规则描述',
    'customJinx.descriptionZh': '中文描述',
    'customJinx.descriptionEn': '英文描述',
    'customJinx.descriptionPlaceholder': '输入相克规则描述...',
    'customJinx.selectCharacter': '选择角色',
    'customJinx.selectTarget': '选择相克角色',
    'customJinx.selectCharactersError': '请选择两个角色',
    'customJinx.sameCharacterError': '不能选择相同的角色',
    'customJinx.descriptionError': '请填写相克规则描述',
    'customJinx.hint': '提示：中文使用角色名称作为主键，英文使用角色ID作为主键。请至少填写一种语言的描述。',
    'customJinx.addCustomJinx': '添加自定义相克',
    'customJinx.delete': '删除',
    'customJinx.custom': '自定义',
    'customJinx.official': '官方',
    'customJinx.management': '相克关系管理',
    'customJinx.addNew': '添加新相克关系',
    'customJinx.add': '添加',
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
    'input.uploadImage': 'Click or drag to upload image',
    'input.reuploadImage': 'Click to reupload',
    'input.exportImage': 'Export PDF',
    'input.exportJson': 'Export JSON',
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
    'input.officialIdParseMode': 'Official ID Only Parsing (Bilingual)',
    'input.officialIdParseModeWarning': 'Cannot edit characters when enabled',
    'input.twoPageMode': 'Two-Page Mode',
    'input.twoPageModeDesc': 'Jinx, Fabled, Traveler on separate page',

    // Confirm Dialog
    'dialog.resetTitle': 'Confirm Reset to Default',
    'dialog.resetMessage': 'This will clear all custom settings (including language preferences) and restore to default state. Continue?',
    'dialog.resetSuccess': 'Settings have been reset to default',
    'dialog.clearTitle': 'Confirm Clear Script',
    'dialog.clearMessage': 'This will clear the current script, all character selections, and JSON data. Continue?',

    // Info
    'info.supportOfficial': '• Support official script maker JSON format',
    'info.supportFormats': '• Support Trouble Brewing, Sects & Violets, Bad Moon Rising and other formats',
    'info.experimentalCharacters': '• Some original characters are not included, please use full JSON data',

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
    'repo.aboutAndThanks': 'About & Thanks',

    // About and Acknowledgments
    'about.title': 'About & Thanks',
    'about.aboutProject': 'About the Project',
    'about.projectDescription': 'This is a completely free and open-source Blood on the Clocktower script generation tool, designed to provide clocktower enthusiasts with a convenient script creation experience. This project does not charge any fees, and all features are available for free. If you find this tool helpful, you are welcome to support the ongoing development and maintenance of the project through donations.',
    'about.donate': 'Support Us',
    'about.acknowledgments': 'Acknowledgments',
    'about.thankValen': 'Valen - Art Advice & Bug Fixes',
    'about.specialThanks': 'Special Thanks',
    'about.nusClub': 'NUS Board Game Society',
    'about.designReference': 'Design Reference',
    'about.museum': 'Clocktower Museum',
    'about.letterClosing': 'With a grateful heart, BigOnion',

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

    // Title Edit Dialog
    'title.edit': 'Edit Title',
    'title.title': 'Script Title',
    'title.titleImage': 'Title Image URL (Optional)',
    'title.subtitle': 'Subtitle (Optional)',
    'title.author': 'Author',
    'title.playerCount': 'Player Count (Optional)',
    'title.fontSize': 'Title Font Size',
    'title.fontSizeXs': 'Mobile',
    'title.fontSizeSm': 'Tablet',
    'title.fontSizeMd': 'Desktop',
    'title.save': 'Save',
    'title.cancel': 'Cancel',

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
    'jinx.title': 'Jinx Rules',
    'jinx.section': 'Jinx Rules',
    'jinx.and': 'and',

    // Character Actions
    'character.edit': 'Edit',
    'character.delete': 'Delete',

    // UI Settings
    'ui.settings': 'UI Settings',
    'ui.pinDrawer': 'Pin Drawer',
    'ui.unpinDrawer': 'Unpin Drawer',
    'ui.searchSettings': 'Search settings...',
    'ui.noResults': 'No matching settings found',
    'ui.manageCustomFonts': 'Manage Custom Fonts',
    'ui.resetAllSettings': 'Reset All Settings',
    'ui.resetUISettings': 'Reset All UI Settings',
    'dialog.resetUIMessage': 'Are you sure you want to reset all UI settings?',

    // Category 1: Page Layout
    'ui.category.pageLayout': 'Page Layout',
    'ui.enableTwoPageMode': 'Enable Two-Page Mode',
    'ui.twoPageModeDesc': 'Jinx, fabled, travelers on separate page',
    'ui.titleHeight': 'Title Area Height',
    'ui.nightOrderBackground': 'Night Order Background',
    'ui.purpleBackground': 'Purple Background',
    'ui.yellowBackground': 'Yellow Background',
    'ui.greenBackground': 'Green Background',

    // Category 2: Character Card Layout
    'ui.category.cardLayout': 'Character Card Layout',
    'ui.cardPaddingX': 'Card Padding (Horizontal)',
    'ui.cardPaddingY': 'Card Padding (Vertical)',
    'ui.cardGap': 'Card Element Gap',
    'ui.textAreaGap': 'Text Area Gap',

    // Category 3: Icon Size Configuration
    'ui.category.iconSize': 'Icon Size Configuration',
    'ui.avatarSize': 'Character Avatar',
    'ui.adjustUI': " Adjust Export Settings ",
    'ui.avatarWidthMd': 'Avatar Width',
    'ui.avatarHeightMd': 'Avatar Height',
    'ui.jinxIconSize': 'Jinx Icon',
    'ui.jinxIconWidthMd': 'Jinx Icon Width',
    'ui.jinxIconHeightMd': 'Jinx Icon Height',
    'ui.fabledIconSize': 'Fabled Icon',
    'ui.fabledIconWidthMd': 'Fabled Icon Width',
    'ui.fabledIconHeightMd': 'Fabled Icon Height',

    // Category 4: Font Settings
    'ui.category.fontSettings': 'Font Settings',
    'ui.font.scriptTitle': 'Script Title Font',
    'ui.font.teamDivider': 'Team Divider Font',
    'ui.font.characterName': 'Character Name Font',
    'ui.font.characterAbility': 'Character Ability Font',
    'ui.font.jinxText': 'Jinx Rule Font',
    'ui.font.stateRuleTitle': 'Page 1 Rule Title Font',
    'ui.font.stateRuleContent': 'Page 1 Rule Content Font',
    'ui.font.specialRuleTitle': 'Page 2 Rule Title Font',
    'ui.font.specialRuleContent': 'Page 2 Rule Content Font',
    'ui.font.page1Rules': 'Page 1 Special Rules Font',
    'ui.font.page2Rules': 'Page 2 Special Rules Font',
    'ui.font.titleFont': 'Title Font',
    'ui.font.contentFont': 'Content Font',

    // Font Uploader
    'fontUploader.title': 'Custom Font Manager',
    'fontUploader.uploadNew': 'Upload New Font',
    'fontUploader.fontName': 'Font Name',
    'fontUploader.fontNameHelper': 'e.g., My Custom Font',
    'fontUploader.fontFamily': 'Font Family Name',
    'fontUploader.fontFamilyHelper': 'CSS font family name, e.g., MyCustomFont',
    'fontUploader.selectFile': 'Select Font File',
    'fontUploader.fileSelected': 'File Selected',
    'fontUploader.fileHelper': 'Supports .ttf, .otf, .woff, .woff2 formats, max 15MB',
    'fontUploader.addFont': 'Add Font',
    'fontUploader.uploading': 'Uploading...',
    'fontUploader.uploadedFonts': 'Uploaded Fonts',
    'fontUploader.fontCount': '',
    'fontUploader.close': 'Close',
    'fontUploader.deleteConfirm': 'Are you sure you want to delete this custom font?',
    'fontUploader.errorInvalidFile': 'Please select a valid font file (.ttf, .otf, .woff, .woff2)',
    'fontUploader.errorFileSize': 'Font file size cannot exceed 15MB',
    'fontUploader.errorAllFields': 'Please fill in all fields and select a font file',
    'fontUploader.errorReadFile': 'Failed to read font file',
    'fontUploader.errorUpload': 'Failed to upload font, please try again',

    // Decorative Frame Text
    'decorative.page2Text': 'Jinx Rules · Fabled · Travelers',

    // Credits
    'credits.designTitle': 'Design',
    'credits.designers': 'Onion',

    // Special Rules
    'specialRules.title': 'Special Rules',
    'specialRules.add': 'Add Special Rule',
    'specialRules.edit': 'Edit Special Rule',
    'specialRules.delete': 'Delete Rule',
    'specialRules.stateRules': 'State Rules',
    'specialRules.dialogTitle': 'Add Custom Rule',
    'specialRules.selectType': 'Select Rule Type',
    'specialRules.specialRule': 'Special Rule',
    'specialRules.stateRule': 'State Rule',
    'specialRules.cancel': 'Cancel',
    'specialRules.confirm': 'Confirm',

    // Custom Jinx
    'customJinx.addTitle': 'Add Custom Jinx',
    'customJinx.editTitle': 'Edit Jinx',
    'customJinx.characterA': 'Character A',
    'customJinx.characterB': 'Character B',
    'customJinx.description': 'Jinx Rule Description',
    'customJinx.descriptionZh': 'Chinese Description',
    'customJinx.descriptionEn': 'English Description',
    'customJinx.descriptionPlaceholder': 'Enter jinx rule description...',
    'customJinx.selectCharacter': 'Select Character',
    'customJinx.selectTarget': 'Select Target Character',
    'customJinx.selectCharactersError': 'Please select two characters',
    'customJinx.sameCharacterError': 'Cannot select the same character',
    'customJinx.descriptionError': 'Please fill in the jinx rule description',
    'customJinx.hint': 'Hint: Chinese uses character names as keys, English uses character IDs. Please fill in at least one language description.',
    'customJinx.addCustomJinx': 'Add Custom Jinx',
    'customJinx.delete': 'Delete',
    'customJinx.custom': 'Custom',
    'customJinx.official': 'Official',
    'customJinx.management': 'Jinx Management',
    'customJinx.addNew': 'Add New Jinx',
    'customJinx.add': 'Add',
  },
};

// 类型定义
export type Language = 'zh-CN' | 'en';
export type TranslationKey = keyof (typeof translations)['zh-CN'];

