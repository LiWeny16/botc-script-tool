import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    IconButton,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    Divider,
    CircularProgress,
} from '@mui/material';
import {
    Close as CloseIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { CHARACTERS } from '../data/characters';
import { CHARACTERS_EN } from '../data/charactersEn';
import { useTranslation } from '../utils/i18n';
import type { Character } from '../types';
import { THEME_COLORS } from '../theme/colors';

interface CharacterLibraryCardProps {
    open: boolean;
    onClose: () => void;
    onAddCharacter: (character: Character) => void;
    onRemoveCharacter?: (character: Character) => void;
    selectedCharacters?: Character[];
    anchorEl?: HTMLElement | null;
}

// 拼音搜索支持
const pinyinMap: Record<string, string> = {
    '洗衣妇': 'xiyifu',
    '图书管理员': 'tushugualiyuan',
    '调查员': 'diachayuan',
    '厨师': 'chushi',
    '共情者': 'gongqingzhe',
    '占卜师': 'zhanbuishi',
    '送葬者': 'songzangzhe',
    '僧侣': 'senglv',
    '守鸦人': 'shouyaren',
    '贞洁者': 'zhenjiezhe',
    '猎手': 'lieshou',
    '士兵': 'shibing',
    '镇长': 'zhenchang',
    '管家': 'guanjia',
    '酒鬼': 'jiugui',
    '陌客': 'moke',
    '圣徒': 'shengtu',
    '修补匠': 'xiubugjiang',
    '投毒者': 'touduzhe',
    '间谍': 'jiandie',
    '红唇女郎': 'hongchunnvlang',
    '男爵': 'nanjue',
    '小恶魔': 'xiaoemo',
    // 传奇角色
    '天使': 'tianshi',
    '私酒贩': 'sijiufan',
    '佛陀': 'fotuo',
    '末日审判': 'moriishenban',
    '精灵': 'jingling',
    '末日使者': 'morishi',
    '公爵夫人': 'gongkefuren',
    '农夫': 'nongfu',
    '小提琴手': 'xiaotiqinshou',
    '园丁': 'yuanding',
    '地狱图书管理员': 'diyutushugualiyuan',
    '革命者': 'gemingzhe',
    '哨兵': 'shaobing',
    '象牙之魂': 'xiangyazhihun',
    '捕风者': 'bufengzhe',
    '玩具匠': 'wanjujiang',
};

// 传奇角色数据 - 支持多语言
const getFabledCharacters = (language: string): Character[] => {
    const isEnglish = language === 'en';

    return [
        {
            id: 'angel',
            name: isEnglish ? 'Angel' : '天使',
            ability: isEnglish ? 'Something bad might be protected from the Demon.' : '某个人可能会被保护免受恶魔攻击。',
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Angel_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: isEnglish ? ['Protected'] : ['保护'],
            setup: false,
        },
        {
            id: 'bootlegger',
            name: isEnglish ? 'Bootlegger' : '私酒贩',
            ability: isEnglish ? 'This character is not in play. The Storyteller can break game rules.' : '这个角色不在剧本中。说书人可以打破游戏规则。',
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Bootlegger_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'buddhist',
            name: isEnglish ? 'Buddhist' : '佛陀',
            ability: isEnglish ? 'For good players, evil player abilities do not cause good players to die.' : '对于善良玩家，邪恶玩家的能力不会让善良玩家死亡。',
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Buddhist_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'deus_ex_fiasco',
            name: isEnglish ? 'Deus Ex Fiasco' : '失败的上帝',
            ability: isEnglish ? 'At least once per game, the Storyteller will make a mistake, correct it, and publicly admit to it.' : '每局游戏限一次，说书人可能会犯一个“错误”但会将其纠正，并公开承认自己曾处理有误',
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/deusexfiasco.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'djinn',
            name: isEnglish ? 'Djinn' : '精灵',
            ability: isEnglish ? "Use the Djinn's special rule. All players know what it is." : '使用灯神的相克规则。所有玩家都会知道其内容。',
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Djinn_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'doomsayer',
            name: isEnglish ? 'Doomsayer' : '末日降临',
            ability: isEnglish ? "If 4 ormore players live,each livingplayermaypubliclychoose(oncepergame)that aplayerof theirown alignment dies." : '如果大于等于四名玩家存活，每名当前存活的玩家可以公开要求你杀死一名与他阵营相同的玩家（每名玩家限一次）',
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Doomsayer_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'duchess',
            name: isEnglish ? 'Duchess' : '公爵夫人',
            ability: isEnglish ? 'Each day, 3 players may choose to visit you. At night,each visitor learns how many visitors are evil, but 1 gets false info.' : '每个白天，三名玩家可以一起拜访你。当晚*他们会得知他们之中有几个是邪恶的，但其中一人的信息是错的。',
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Duchess_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: isEnglish ? ['No nomination 1', 'No nomination 2', 'No nomination 3'] : ['提名1', '提名2', '提名3'],
            setup: false,
        },
        {
            id: 'ferryman',
            name: isEnglish ? 'Ferryman' : '摆渡人',
            ability: isEnglish ? "On the final day, all dead players regain their vote token." : '在游戏的最后一天所有已死亡玩家会重新获得投票标记。',
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Ferryman_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'fiddler',
            name: isEnglish ? 'Fiddler' : '小提琴手',
            ability: isEnglish ? "Once per game, the Demon secretly chooses an opposing player: all players choose which of these 2 players win. " : '每局游戏限一次，恶魔可以秘密选择一名对立阵营的玩家，所有玩家要表决：这两名玩家中谁的阵营获胜。（平局邪恶阵营获胜)',
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Fibbin_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: isEnglish ? ['Used'] : ['已使用'],
            setup: false,
        },
        {
            id: 'gardener',
            name: isEnglish ? 'Gardener' : '园丁',
            ability: isEnglish ? "The Storyteller assigns 1 or more players'characters. " : "由说书人来为一名或更多玩家派发角色。",
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Gardener_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: isEnglish ? ['Used'] : ['已使用'],
            setup: false,
        },
        {
            id: 'hell_librarian',
            name: isEnglish ? 'Hell\'s Librarian' : '地狱图书管理员',
            ability: isEnglish ? 'Something bad might happen to whoever talks when the Storyteller has asked for silence. ' : "当说书人宣布安静时，仍在说话的玩家可能会遭遇一些不好的事情。",
            team: 'fabled',
            image: "https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Hell's%20Librarian_icon.webp",
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: isEnglish ? ['False info'] : ['错误信息'],
            setup: false,
        },
        {
            id: 'revolutionary',
            name: isEnglish ? 'Revolutionary' : '革命者',
            ability: isEnglish ? "2 neighboring players are known to be the same alignment. Once per game, 1 of them registers falsely." : "公开声明—对邻座玩家本局游戏一直保持同一阵营。每局游戏限一次，他们中的一人可能被当作其他的角色/阵营。",
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Revolutionary_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: isEnglish ? ['Know'] : ['知道'],
            setup: false,
        },
        {
            id: 'sentinel',
            name: isEnglish ? 'Sentinel' : '哨兵',
            ability: isEnglish ? "There might be 1 extra or 1 fewer Outsider in play. ": "在初始设置时，可能会额外增加或减少个外来者。",
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Sentinel_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'spirit_of_ivory',
            name: isEnglish ? 'Spirit of Ivory' : '圣洁之魂',
            ability: isEnglish ? "There can't be more than 1 extra evil player. " : "游戏过程中邪恶玩家的总数最多能比初始设置多一名。",
            team: 'fabled',
            image: "https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Spirit%20Of%20Ivory_icon.webp",
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
        {
            id: 'storm_catcher',
            name: isEnglish ? 'Storm Catcher' : '暴风捕手',
            ability: isEnglish ? "Name a good character. If in play, they can only die by execution, but evil players learn which player it is. ":"游戏开始时，你要宣布一个善良角色。如果该角色在场，他只能死于处决，但所有邪恶玩家会在首个夜晚得知他是哪—名玩家。",
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Storm%20Catcher_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: isEnglish ? ['Drunk'] : ['改名'],
            setup: false,
        },
        {
            id: 'toymaker',
            name: isEnglish ? 'Toymaker' : '玩具匠',
            ability: isEnglish ? "The Demon may choose not to attack must do this at least once per game. Evil players get normal starting info. " : "恶魔可以在夜晚选择放弃攻击（每局游戏至少一次)。邪恶玩家照常获取初始信息",
            team: 'fabled',
            image: 'https://script.bloodontheclocktower.com/images/icon/Extras/fabled/Toymaker_icon.webp',
            firstNight: 0,
            otherNight: 0,
            firstNightReminder: '',
            otherNightReminder: '',
            reminders: [],
            setup: false,
        },
    ];
};

export default function CharacterLibraryCard({
    open,
    onClose,
    onAddCharacter,
    onRemoveCharacter,
    selectedCharacters = [],
}: CharacterLibraryCardProps) {
    const { t, language } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // 根据当前语言选择角色数据源
    const currentCharacterData = useMemo(() => {
        return language === 'en' ? CHARACTERS_EN : CHARACTERS;
    }, [language]);

    // 按团队分类角色，包含传奇角色，去重处理
    const charactersByTeam = useMemo(() => {
        const teams = {
            townsfolk: [] as Character[],
            outsider: [] as Character[],
            minion: [] as Character[],
            demon: [] as Character[],
            fabled: getFabledCharacters(language), // 使用多语言传奇角色
            traveler: [] as Character[],
        };

        // 使用Set来去重，避免重复的角色ID
        const seenIds = new Set<string>();

        Object.values(currentCharacterData).forEach((char) => {
            const character = char as Character;
            // 跳过重复的角色ID和传奇角色（传奇角色单独处理）
            if (seenIds.has(character.id) || character.team === 'fabled') {
                return;
            }

            seenIds.add(character.id);

            if (teams[character.team as keyof typeof teams]) {
                teams[character.team as keyof typeof teams].push(character);
            }
        });

        return teams;
    }, [currentCharacterData, language]);

    // 搜索过滤 - 只在组件可见时计算
    const filteredCharacters = useMemo(() => {
        // 如果组件不可见，返回空对象避免不必要的计算
        if (!open) {
            return {
                townsfolk: [] as Character[],
                outsider: [] as Character[],
                minion: [] as Character[],
                demon: [] as Character[],
                fabled: [] as Character[],
                traveler: [] as Character[],
            };
        }

        if (!searchTerm.trim()) {
            return charactersByTeam;
        }

        const term = searchTerm.toLowerCase();
        const filtered = {
            townsfolk: [] as Character[],
            outsider: [] as Character[],
            minion: [] as Character[],
            demon: [] as Character[],
            fabled: [] as Character[],
            traveler: [] as Character[],
        };

        Object.entries(charactersByTeam).forEach(([team, characters]) => {
            const teamKey = team as keyof typeof filtered;
            filtered[teamKey] = characters.filter((char) => {
                const nameMatch = char.name.toLowerCase().includes(term);
                const abilityMatch = char.ability.toLowerCase().includes(term);
                const pinyinMatch = pinyinMap[char.name]?.includes(term);
                const idMatch = char.id.toLowerCase().includes(term);

                return nameMatch || abilityMatch || pinyinMatch || idMatch;
            });
        });

        return filtered;
    }, [charactersByTeam, searchTerm, open]);

    const teamTabs = [
        { key: 'selected', label: t('selectedCharacters'), color: THEME_COLORS.good },
        { key: 'all', label: t('all'), color: THEME_COLORS.text.primary },
        { key: 'townsfolk', label: t('townsfolk'), color: THEME_COLORS.good },
        { key: 'outsider', label: t('outsider'), color: THEME_COLORS.good },
        { key: 'minion', label: t('minion'), color: THEME_COLORS.evil },
        { key: 'demon', label: t('demon'), color: THEME_COLORS.evil },
        { key: 'fabled', label: t('fabled'), color: THEME_COLORS.fabled },
        { key: 'traveler', label: t('traveler'), color: THEME_COLORS.purple },
    ];

    const currentTeam = teamTabs[selectedTab];

    // 获取当前显示的角色列表
    const currentCharacters = useMemo(() => {
        if (currentTeam.key === 'selected') {
            // 显示已选角色
            if (!searchTerm.trim()) {
                return selectedCharacters;
            }
            // 对已选角色进行搜索过滤
            const term = searchTerm.toLowerCase();
            return selectedCharacters.filter((char) => {
                const nameMatch = char.name.toLowerCase().includes(term);
                const abilityMatch = char.ability.toLowerCase().includes(term);
                const pinyinMatch = pinyinMap[char.name]?.includes(term);
                const idMatch = char.id.toLowerCase().includes(term);

                return nameMatch || abilityMatch || pinyinMatch || idMatch;
            });
        }

        if (currentTeam.key === 'all') {
            // 显示所有角色
            return Object.values(filteredCharacters).flat();
        }
        // 确保只返回当前选中团队的角色
        const teamCharacters = filteredCharacters[currentTeam.key as keyof typeof filteredCharacters];
        return teamCharacters ? teamCharacters.filter(char => char.team === currentTeam.key) : [];
    }, [currentTeam.key, filteredCharacters, selectedCharacters, searchTerm]);

    // 处理打开时的加载效果
    useEffect(() => {
        if (open) {
            setIsLoading(true);

            // 重置搜索和选中状态，提供更好的用户体验
            setSearchTerm('');
            setSelectedTab(0);

            // 模拟数据加载时间，实际项目中这里可能是API调用
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 200); // 进一步减少加载时间

            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleAddCharacter = useCallback((character: Character) => {
        onAddCharacter(character);
        // 不再自动关闭页面，保持打开状态
    }, [onAddCharacter]);

    const handleRemoveCharacter = useCallback((character: Character) => {
        if (onRemoveCharacter) {
            onRemoveCharacter(character);
        }
    }, [onRemoveCharacter]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    // 懒加载图片组件
    const LazyAvatar = React.memo(({ character, teamColor }: { character: Character; teamColor: string }) => {
        const [imageLoaded, setImageLoaded] = useState(false);
        const [imageError, setImageError] = useState(false);

        return (
            <Avatar
                src={imageError ? '/imgs/icons/75px-Di.png' : character.image}
                alt={character.name}
                sx={{
                    width: 48,
                    height: 48,
                    border: `2px solid ${teamColor}`,
                    backgroundColor: imageLoaded ? 'transparent' : '#f5f5f5',
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
            />
        );
    });

    // 角色项组件，使用memo优化
    const CharacterItem = React.memo(({
        character,
        index,
        teamColor,
        showTeamChip,
        isSelected,
        onAddCharacter,
        onRemoveCharacter
    }: {
        character: Character;
        index: number;
        teamColor: string;
        showTeamChip: boolean;
        isSelected: boolean;
        onAddCharacter: (character: Character) => void;
        onRemoveCharacter?: (character: Character) => void;
    }) => {
        const uniqueKey = `${character.team}-${character.id}-${index}`;

        const handleClick = () => {
            if (isSelected && onRemoveCharacter) {
                onRemoveCharacter(character);
            } else {
                onAddCharacter(character);
            }
        };

        return (
            <React.Fragment key={uniqueKey}>
                <ListItem
                    component="div"
                    onClick={handleClick}
                    sx={{
                        py: 1.5,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                        border: isSelected ? '1px solid rgba(25, 118, 210, 0.3)' : '1px solid transparent',
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': {
                            backgroundColor: isSelected
                                ? 'rgba(25, 118, 210, 0.12)'
                                : 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    <ListItemAvatar>
                        <LazyAvatar character={character} teamColor={teamColor} />
                    </ListItemAvatar>
                    <ListItemText
                        primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 'bold',
                                        color: teamColor,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    {character.name}
                                </Typography>
                                {isSelected && (
                                    <Chip
                                        label={t('selected')}
                                        size="small"
                                        sx={{
                                            height: 18,
                                            fontSize: '0.6rem',
                                            backgroundColor: THEME_COLORS.good,
                                            color: '#fff',
                                            '& .MuiChip-label': {
                                                px: 0.5,
                                            },
                                        }}
                                    />
                                )}
                                {showTeamChip && (
                                    <Chip
                                        label={teamTabs.find(t => t.key === character.team)?.label || character.team}
                                        size="small"
                                        sx={{
                                            height: 18,
                                            fontSize: '0.6rem',
                                            backgroundColor: teamColor,
                                            color: '#fff',
                                            '& .MuiChip-label': {
                                                px: 0.5,
                                            },
                                        }}
                                    />
                                )}
                            </Box>
                        }
                        secondary={
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    fontSize: '0.75rem',
                                    lineHeight: 1.3,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {character.ability}
                            </Typography>
                        }
                    />
                </ListItem>
                <Divider />
            </React.Fragment>
        );
    });

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: { xs: 80, sm: 100 },
                right: { xs: 16, sm: 24 },
                zIndex: 1001,
                display: open ? 'block' : 'none', // 使用CSS显示/隐藏
                '@media print': {
                    display: 'none',
                },
            }}
        >
            <Card
                sx={{
                    width: { xs: 340, sm: 400 },
                    height: { 
                        xs: 'min(calc(100vh - 180px), 720px)', // 移动端：视口高度减去180px（顶部+底部边距）或720px，取较小值
                        sm: 'min(calc(100vh - 120px), 830px)'  // 桌面端：视口高度减去160px（顶部+底部边距）或630px，取较小值
                    },
                    maxHeight: { 
                        xs: 'calc(100vh - 5px)', // 确保不超过可用高度
                        sm: 'calc(100vh - 5px)' 
                    },
                    boxShadow: 6,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    transform: open ? 'scale(1)' : 'scale(0.95)',
                    opacity: open ? 1 : 0,
                    transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
                    transformOrigin: 'bottom right', // 从右下角缩放
                    userSelect: 'none', // 禁用文本选择
                    WebkitUserSelect: 'none', // Safari
                    MozUserSelect: 'none', // Firefox
                    msUserSelect: 'none', // IE/Edge
                    '& *': {
                        userSelect: 'none !important',
                        WebkitUserSelect: 'none !important',
                        MozUserSelect: 'none !important',
                        msUserSelect: 'none !important',
                    },
                }}
            >
                {/* 标题栏 */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        pb: 1,
                        borderBottom: '1px solid #e0e0e0',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            component="img"
                            src="/imgs/images/botc-title.png"
                            alt="BOTC"
                            sx={{
                                height: 24,
                                objectFit: 'contain',
                            }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                            {t('characterLibrary')}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* 搜索栏 */}
                <Box sx={{ p: 2, pb: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={t('searchCharacters')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                            },
                        }}
                    />
                </Box>

                {/* 团队标签页 - 多行布局 */}
                <Box sx={{ borderBottom: '1px solid #e0e0e0', p: 1 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5,
                        }}
                    >
                        {teamTabs.map((tab, index) => (
                            <Box
                                key={tab.key}
                                onClick={() => setSelectedTab(index)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    backgroundColor: selectedTab === index ? tab.color : 'transparent',
                                    color: selectedTab === index ? '#fff' : tab.color,
                                    border: `1px solid ${tab.color}`,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        backgroundColor: selectedTab === index ? tab.color : `${tab.color}15`,
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: selectedTab === index ? '#fff' : tab.color,
                                    }}
                                />
                                {tab.label}
                                <Chip
                                    label={tab.key === 'selected'
                                        ? selectedCharacters.length
                                        : tab.key === 'all'
                                            ? Object.values(filteredCharacters).flat().length
                                            : (filteredCharacters[tab.key as keyof typeof filteredCharacters]?.length || 0)
                                    }
                                    size="small"
                                    sx={{
                                        height: 16,
                                        fontSize: '0.6rem',
                                        backgroundColor: selectedTab === index ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                                        color: selectedTab === index ? '#fff' : 'inherit',
                                        '& .MuiChip-label': {
                                            px: 0.5,
                                        },
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* 角色列表 */}
                <CardContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                    {isLoading ? (
                        <Box sx={{ p: 2 }}>
                            {/* 骨架屏加载效果 */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mb: 3,
                                gap: 2,
                            }}>
                                <CircularProgress size={24} />
                                <Typography variant="body2" color="text.secondary">
                                    {t('loading')}
                                </Typography>
                            </Box>

                            {/* 模拟角色项的骨架屏 */}
                            {[1, 2, 3, 4, 5].map((item) => (
                                <Box key={item} sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 1.5,
                                    mb: 1,
                                    opacity: 0.3,
                                }}>
                                    <Box sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        backgroundColor: 'grey.300',
                                        mr: 2,
                                    }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{
                                            height: 16,
                                            backgroundColor: 'grey.300',
                                            borderRadius: 1,
                                            mb: 1,
                                            width: '60%',
                                        }} />
                                        <Box sx={{
                                            height: 12,
                                            backgroundColor: 'grey.200',
                                            borderRadius: 1,
                                            width: '90%',
                                        }} />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    ) : currentCharacters.length === 0 ? (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 200,
                            color: 'text.secondary',
                        }}>
                            <Typography variant="body2">
                                {searchTerm ? t('noSearchResults') : t('noCharactersInTeam')}
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {currentCharacters.map((character, index) => {
                                const characterTeamColor = currentTeam.key === 'all' || currentTeam.key === 'selected'
                                    ? teamTabs.find(t => t.key === character.team)?.color || THEME_COLORS.text.primary
                                    : currentTeam.color;

                                const isSelected = selectedCharacters.some(c => c.id === character.id);

                                return (
                                    <CharacterItem
                                        key={`${character.team}-${character.id}-${index}`}
                                        character={character}
                                        index={index}
                                        teamColor={characterTeamColor}
                                        showTeamChip={currentTeam.key === 'all' || currentTeam.key === 'selected'}
                                        isSelected={isSelected}
                                        onAddCharacter={handleAddCharacter}
                                        onRemoveCharacter={handleRemoveCharacter}
                                    />
                                );
                            })}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
