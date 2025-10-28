import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
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
    PushPin as PushPinIcon,
    PushPinOutlined as PushPinOutlinedIcon,
} from '@mui/icons-material';
import { CHARACTERS } from '../data/characters';
import { CHARACTERS_EN } from '../data/charactersEn';
import { useTranslation } from '../utils/i18n';
import CharacterImage from './CharacterImage';
import type { Character } from '../types';
import { THEME_COLORS } from '../theme/colors';
import { getFabledCharacters } from '../data/fabled';
import { configStore } from '../stores/ConfigStore';
import { PINYIN_MAP } from '../data/pinyinMap';

interface CharacterLibraryCardProps {
    open: boolean;
    onClose: () => void;
    onAddCharacter: (character: Character) => void;
    onRemoveCharacter?: (character: Character) => void;
    selectedCharacters?: Character[];
    anchorEl?: HTMLElement | null;
    initialTeam?: string; // 初始选中的团队
    position?: { x: number; y: number }; // 角色库出现的位置
}


const CharacterLibraryCard = observer(({
    open,
    onClose,
    onAddCharacter,
    onRemoveCharacter,
    selectedCharacters = [],
    initialTeam,
    position,
}: CharacterLibraryCardProps) => {
    const { t, language } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isPinned, setIsPinned] = useState(false); // 是否固定
    const [isDragging, setIsDragging] = useState(false); // 是否正在拖拽
    const dragOffsetRef = React.useRef({ x: 0, y: 0 }); // 使用 ref 存储拖拽偏移量,避免频繁渲染
    const dragStartRef = React.useRef({ x: 0, y: 0 }); // 拖拽起始位置
    const cardRef = React.useRef<HTMLDivElement>(null);
    const rafRef = React.useRef<number | null>(null); // requestAnimationFrame ID
    const searchInputRef = React.useRef<HTMLInputElement>(null); // 搜索框引用

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
                const pinyinMatch = PINYIN_MAP[char.name]?.includes(term);
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
                const pinyinMatch = PINYIN_MAP[char.name]?.includes(term);
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

            // 重置搜索
            setSearchTerm('');
            
            // 重置拖拽状态
            dragOffsetRef.current = { x: 0, y: 0 };
            if (cardRef.current) {
                cardRef.current.style.transform = 'translate(0px, 0px)';
            }
            setIsDragging(false);
            
            // 如果有初始团队，自动切换到对应的标签
            if (initialTeam) {
                const teamIndex = teamTabs.findIndex(tab => tab.key === initialTeam);
                if (teamIndex !== -1) {
                    setSelectedTab(teamIndex);
                }
            } else {
                // 否则默认显示已选角色
                setSelectedTab(0);
            }

            // 模拟数据加载时间，实际项目中这里可能是API调用
            const timer = setTimeout(() => {
                setIsLoading(false);
                // 加载完成后自动聚焦搜索框
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 200); // 进一步减少加载时间

            return () => clearTimeout(timer);
        }
    }, [open, initialTeam]);

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

    // 处理点击外部关闭
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        // 如果已固定，不响应外部点击
        if (isPinned) return;
        
        // 点击背景层时关闭
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }, [isPinned, handleClose]);

    // 拖拽处理函数
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // 只在标题栏上才能拖拽
        if (!e.currentTarget.classList.contains('draggable-header')) return;
        
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - dragOffsetRef.current.x,
            y: e.clientY - dragOffsetRef.current.y,
        };
        e.preventDefault(); // 防止文本选择
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !cardRef.current) return;
        
        // 取消之前的 RAF
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
        }
        
        // 使用 RAF 优化性能
        rafRef.current = requestAnimationFrame(() => {
            if (!cardRef.current) return;
            
            // 获取卡片尺寸
            const cardRect = cardRef.current.getBoundingClientRect();
            const cardWidth = cardRect.width;
            const cardHeight = cardRect.height;
            
            // 获取初始位置 (从 sx 计算)
            const initialRect = cardRef.current.getBoundingClientRect();
            const baseX = initialRect.left - dragOffsetRef.current.x;
            const baseY = initialRect.top - dragOffsetRef.current.y;
            
            // 计算新偏移量
            let newOffsetX = e.clientX - dragStartRef.current.x;
            let newOffsetY = e.clientY - dragStartRef.current.y;
            
            // 计算最终位置
            const finalX = baseX + newOffsetX;
            const finalY = baseY + newOffsetY;
            
            // 边界限制
            const minX = 0;
            const minY = 0;
            const maxX = window.innerWidth - cardWidth;
            const maxY = window.innerHeight - cardHeight;
            
            // 应用边界限制
            if (finalX < minX) {
                newOffsetX = minX - baseX;
            } else if (finalX > maxX) {
                newOffsetX = maxX - baseX;
            }
            
            if (finalY < minY) {
                newOffsetY = minY - baseY;
            } else if (finalY > maxY) {
                newOffsetY = maxY - baseY;
            }
            
            const newOffset = { x: newOffsetX, y: newOffsetY };
            dragOffsetRef.current = newOffset;
            
            // 直接操作 DOM,避免触发 React 重渲染
            cardRef.current.style.transform = `translate(${newOffset.x}px, ${newOffset.y}px)`;
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        // 清理 RAF
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    // 添加和移除全局鼠标事件监听
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // 懒加载图片组件 - 使用统一的CharacterImage组件
    const LazyAvatar = React.memo(({ character, teamColor }: { character: Character; teamColor: string }) => {
        return (
            <CharacterImage
                component="avatar"
                src={character.image}
                alt={character.name}
                sx={{
                    width: 48,
                    height: 48,
                    border: `2px solid ${teamColor}`,
                }}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                                {/* 作者标签 */}
                                {character.author && (
                                    <Chip
                                        label={`@${character.author}`}
                                        size="small"
                                        sx={{
                                            height: 16,
                                            fontSize: '0.55rem',
                                            backgroundColor: '#9e9e9e',
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
        <>
            {/* 背景遮罩层 - 点击关闭 (透明) */}
            {open && !isPinned && (
                <Box
                    onClick={handleBackdropClick}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1000,
                        backgroundColor: 'transparent',
                        display: open ? 'block' : 'none',
                        '@media print': {
                            display: 'none',
                        },
                    }}
                />
            )}
            
            {/* 角色库卡片 */}
            <Box
                ref={cardRef}
                sx={{
                    position: 'fixed',
                    // 如果有position参数，使用它；否则使用默认位置
                    ...(position ? {
                        top: Math.min(position.y, window.innerHeight - 750),
                        left: Math.min(position.x, window.innerWidth - 420),
                    } : {
                        bottom: { xs: 80, sm: 100 },
                        right: { xs: 16, sm: 24 },
                    }),
                    // transform 由 DOM 直接操作，不在这里设置
                    zIndex: 1001,
                    display: open ? 'block' : 'none',
                    '@media print': {
                        display: 'none',
                    },
                }}
            >
                <Card
                    sx={{
                        width: { xs: 340, sm: 400 },
                        height: {
                            xs: 'min(calc(100vh - 180px), 720px)',
                            sm: 'min(calc(100vh - 120px), 830px)'
                        },
                        maxHeight: {
                            xs: 'calc(100vh - 5px)',
                            sm: 'calc(100vh - 5px)'
                        },
                        boxShadow: 6,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        opacity: open ? 1 : 0,
                        transition: isDragging ? 'none' : 'opacity 0.15s ease-out',
                        cursor: isDragging ? 'grabbing' : 'default',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                        '& *': {
                            userSelect: isDragging ? 'none !important' : 'auto',
                            WebkitUserSelect: isDragging ? 'none !important' : 'auto',
                            MozUserSelect: isDragging ? 'none !important' : 'auto',
                            msUserSelect: isDragging ? 'none !important' : 'auto',
                        },
                    }}
                >
                    {/* 标题栏 - 可拖拽 */}
                    <Box
                        className="draggable-header"
                        onMouseDown={handleMouseDown}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            pb: 1,
                            borderBottom: '1px solid #e0e0e0',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            '&:active': {
                                cursor: 'grabbing',
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CharacterImage
                                src="/imgs/images/logo2.png"
                                alt="BOTC"
                                sx={{
                                    height: 24,
                                    objectFit: 'contain',
                                }}
                            />
                            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                {t('characterLibrary')}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {/* 固定/解锁按钮 */}
                            <IconButton 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsPinned(!isPinned);
                                }} 
                                size="small"
                                title={isPinned ? t('library.unpin') : t('library.pin')}
                                sx={{
                                    color: isPinned ? THEME_COLORS.good : 'text.secondary',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        color: THEME_COLORS.good,
                                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                    },
                                }}
                            >
                                {isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                            </IconButton>
                            {/* 关闭按钮 */}
                            <IconButton 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClose();
                                }} 
                                size="small"
                                sx={{
                                    '&:hover': {
                                        color: THEME_COLORS.evil,
                                        backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                    },
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>

                {/* 搜索栏 */}
                <Box sx={{ p: 2, pb: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={t('searchCharacters')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        inputRef={searchInputRef}
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
        </>
    );
});

export default CharacterLibraryCard;
