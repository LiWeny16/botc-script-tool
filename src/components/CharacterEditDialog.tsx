import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
  Autocomplete,
  Paper,
  List,
  ListItem,
  Slider,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import type { Character } from '../types';
import { getCharacterDictionary, getCharacterInDictionary } from '../data';
import { useTranslation } from '../utils/i18n';
import CharacterImage from './CharacterImage';
import { configStore } from '../stores/ConfigStore';
import { scriptStore } from '../stores/ScriptStore';
import { uiConfigStore } from '../stores/UIConfigStore';
import { observer } from 'mobx-react-lite';
import type { JinxInfo } from '../types';
import { getTeamColor } from '../theme/colors';

interface CharacterEditDialogProps {
  open: boolean;
  character: Character | null;
  onClose: () => void;
  onSave: (characterId: string, updates: Partial<Character>) => void;
}

// 相克关系项接口
interface JinxItem {
  targetCharacter: Character;
  jinxInfo: JinxInfo;
}

export default observer(function CharacterEditDialog({
  open,
  character,
  onClose,
  onSave,
}: CharacterEditDialogProps) {
  const { t, language } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editData, setEditData] = useState<Partial<Character>>({});
  const [jinxItems, setJinxItems] = useState<JinxItem[]>([]);
  const [newJinxTarget, setNewJinxTarget] = useState<Character | null>(null);
  const [newJinxDescription, setNewJinxDescription] = useState('');
  const [editingJinxId, setEditingJinxId] = useState<string | null>(null);
  const [editingJinxReason, setEditingJinxReason] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // 样式滑块本地状态（拖拽时不写 store，松手才同步）
  const cc = uiConfigStore.config.characterCard;
  const [sliderAvatarBR, setSliderAvatarBR] = useState(cc.avatarBorderRadius);
  const [sliderAvatarW, setSliderAvatarW] = useState(cc.avatarWidthMd);
  const [sliderAvatarH, setSliderAvatarH] = useState(cc.avatarHeightMd);
  const [sliderPadX, setSliderPadX] = useState(cc.cardPaddingX);
  const [sliderGap, setSliderGap] = useState(cc.cardGap);

  const handleChange = (field: keyof Character, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) return;
      if (file.size > 2 * 1024 * 1024) return; // 2MB 限制
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange('image', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) return;
      if (file.size > 2 * 1024 * 1024) return; // 2MB 限制
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange('image', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // 官方ID解析模式下禁用所有编辑
  const isEditDisabled = configStore.config.officialIdParseMode;

  // 获取当前剧本中的所有角色（排除当前编辑的角色）
  const availableCharacters = scriptStore.script?.all.filter(c => c.id !== character?.id) || [];

  useEffect(() => {
    if (character && scriptStore.script) {
      const defaultData: Partial<Character> =
        getCharacterInDictionary(getCharacterDictionary(language), character.id) ?? {};
      const mergedData = {
        ...defaultData,
        ...character,
      };
      setEditData(mergedData);

      // 加载该角色相关的相克关系
      const jinxes: JinxItem[] = [];
      const currentCharName = character.name;
      // 遍历剧本中的相克关系
      if (scriptStore.script.jinx[currentCharName]) {
        Object.entries(scriptStore.script.jinx[currentCharName]).forEach(([targetName, jinxInfo]) => {
          const targetChar = scriptStore.script!.all.find(c => c.name === targetName);
          if (targetChar) {
            jinxes.push({
              targetCharacter: targetChar,
              jinxInfo,
            });
          }
        });
      }

      setJinxItems(jinxes);
    }
  }, [character, scriptStore.script, language]);

  const handleAddJinx = () => {
    if (newJinxTarget && newJinxDescription.trim() && character) {
      scriptStore.addCustomJinx(character, newJinxTarget, newJinxDescription.trim());
      setNewJinxTarget(null);
      setNewJinxDescription('');
      
      // 重新加载相克关系
      setTimeout(() => {
        const jinxes: JinxItem[] = [];
        const currentCharName = character.name;
        if (scriptStore.script && scriptStore.script.jinx[currentCharName]) {
          Object.entries(scriptStore.script.jinx[currentCharName]).forEach(([targetName, jinxInfo]) => {
            const targetChar = scriptStore.script!.all.find(c => c.name === targetName);
            if (targetChar) {
              jinxes.push({
                targetCharacter: targetChar,
                jinxInfo,
              });
            }
          });
        }
        setJinxItems(jinxes);
      }, 100);
    }
  };

  const handleDeleteJinx = (jinx: JinxItem) => {
    if (character && !jinx.jinxInfo.isOfficial) {
      scriptStore.removeCustomJinx(character, jinx.targetCharacter);
      setJinxItems(prev => prev.filter(j => j.targetCharacter.id !== jinx.targetCharacter.id));
    }
  };

  // 处理切换显示/隐藏相克规则
  const handleToggleJinxDisplay = (jinx: JinxItem) => {
    if (!character) return;
    const newDisplay = !jinx.jinxInfo.display;
    scriptStore.updateOfficialJinx(character, jinx.targetCharacter, { display: newDisplay });
    // 更新本地状态
    setJinxItems(prev => prev.map(j => 
      j.targetCharacter.id === jinx.targetCharacter.id 
        ? { ...j, jinxInfo: { ...j.jinxInfo, display: newDisplay } }
        : j
    ));
  };

  // 处理编辑官方相克规则
  const handleEditOfficialJinx = (jinx: JinxItem, newReason: string) => {
    if (!character) return;
    scriptStore.updateOfficialJinx(character, jinx.targetCharacter, { reason: newReason });
    // 更新本地状态
    setJinxItems(prev => prev.map(j => 
      j.targetCharacter.id === jinx.targetCharacter.id 
        ? { ...j, jinxInfo: { ...j.jinxInfo, reason: newReason } }
        : j
    ));
  };

  const handleSave = () => {
    // 官方ID解析模式下禁止保存编辑
    if (configStore.config.officialIdParseMode) {
      onClose();
      return;
    }

    if (!character) {
      onClose();
      return;
    }

    // 1. 如果有正在编辑的相克规则，先保存它
    if (editingJinxId && editingJinxReason) {
      const editingJinx = jinxItems.find(j => j.targetCharacter.id === editingJinxId);
      if (editingJinx) {
        handleEditOfficialJinx(editingJinx, editingJinxReason);
        // 清除编辑状态
        setEditingJinxId(null);
        setEditingJinxReason('');
      }
    }

    // 2. 如果正在添加新的相克规则，先添加它
    if (newJinxTarget && newJinxDescription.trim()) {
      scriptStore.addCustomJinx(character, newJinxTarget, newJinxDescription.trim());
      // 清除添加表单
      setNewJinxTarget(null);
      setNewJinxDescription('');
    }
    
    if (character) {
      const updates: Partial<Character> = {};
      const defaultData: Partial<Character> =
        getCharacterInDictionary(getCharacterDictionary(language), character.id) ?? {};
      
      // 创建完整的原始数据（包含默认值）
      const originalData = {
        ...defaultData,
        ...character,
      };

      // 比较编辑后的数据与原始完整数据的差异
      Object.keys(editData).forEach((key) => {
        const typedKey = key as keyof Character;
        const editValue = editData[typedKey];
        const originalValue = originalData[typedKey];
        
        // 处理数字类型的比较（0 和 undefined 应该被视为不同）
        if (typedKey === 'firstNight' || typedKey === 'otherNight') {
          const editNum = Number(editValue) || 0;
          const originalNum = Number(originalValue) || 0;
          if (editNum !== originalNum) {
            (updates as any)[typedKey] = editNum;
          }
        }
        // 处理字符串类型的比较
        else if (typedKey === 'firstNightReminder' || typedKey === 'otherNightReminder') {
          const editStr = String(editValue || '');
          const originalStr = String(originalValue || '');
          if (editStr !== originalStr) {
            (updates as any)[typedKey] = editStr;
          }
        }
        // 处理数组类型的比较
        else if (typedKey === 'reminders' || typedKey === 'remindersGlobal') {
          const editArray = Array.isArray(editValue) ? editValue : [];
          const originalArray = Array.isArray(originalValue) ? originalValue : [];
          if (JSON.stringify(editArray) !== JSON.stringify(originalArray)) {
            (updates as any)[typedKey] = editArray;
          }
        }
        // 处理其他类型的比较
        else if (editValue !== originalValue) {
          (updates as any)[typedKey] = editValue;
        }
      });

      // 如果有任何更改，则保存
      if (Object.keys(updates).length > 0) {
        onSave(character.id, updates);
      }
      onClose();
    }
  };

  if (!character) return null;

  const teamOptions = [
    { value: 'townsfolk', label: t('townsfolk') },
    { value: 'outsider', label: t('outsider') },
    { value: 'minion', label: t('minion') },
    { value: 'demon', label: t('demon') },
    { value: 'fabled', label: t('fabled') },
    { value: 'loric', label: t('loric') },
    { value: 'traveler', label: t('traveler') },
  ];

  const displayName = editData.name || character.name;
  const displayAbility = editData.ability || character.ability || '';
  const displayImage = editData.image || character.image || '';
  const activeTeam = String(editData.team || character.team || 'townsfolk');
  const rawTeamColor = getTeamColor(activeTeam, editData.teamColor);
  const mutedTeamColors: Record<string, string> = {
    townsfolk: '#3f6f8a',
    outsider: '#3f6f8a',
    minion: '#884247',
    demon: '#884247',
    traveler: '#6d5a8a',
    fabled: '#9a7a31',
    loric: '#4f7d4a',
  };
  const teamColor = editData.teamColor || mutedTeamColors[activeTeam] || rawTeamColor;
  const dialogGlow = alpha(teamColor, 0.18);
  const contentMinHeight = { xs: 'calc(100dvh - 168px)', sm: 566 };
  const tabMotionProps = {
    initial: { opacity: 0, y: 10, filter: 'blur(3px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -6, filter: 'blur(3px)' },
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  } as const;
  const tabSx = {
    minHeight: 48,
    px: { xs: 1.5, sm: 2 },
    textTransform: 'none',
    fontWeight: 760,
    fontSize: 14,
    color: '#667085',
  };

  const sectionTitleSx = {
    mb: 2,
    fontSize: 13,
    fontWeight: 760,
    letterSpacing: 0,
    color: '#2b3035',
  };

  const formLabelSx = {
    mb: 0.75,
    fontSize: 12,
    fontWeight: 720,
    color: '#667085',
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: '#f4f6f7',
      boxShadow: `inset 0 0 0 1px ${alpha('#101828', 0.06)}, 0 1px 2px ${alpha('#101828', 0.03)}`,
      transition: 'background-color 160ms ease, box-shadow 160ms ease',
      '& fieldset': { borderColor: 'transparent' },
      '&:hover': { backgroundColor: '#eef2f4' },
      '&:hover fieldset': { borderColor: 'transparent' },
      '&.Mui-focused': {
        backgroundColor: '#fff',
        boxShadow: `inset 0 0 0 1px ${alpha(teamColor, 0.32)}, 0 0 0 4px ${alpha(teamColor, 0.12)}`,
      },
      '&.Mui-focused fieldset': { borderColor: alpha(teamColor, 0.52) },
    },
    '& .MuiInputBase-input': {
      fontSize: 15,
      lineHeight: 1.5,
    },
  };

  const orderFieldSx = {
    ...fieldSx,
    '& .MuiInputBase-input': {
      fontSize: 30,
      fontWeight: 820,
      textAlign: 'center',
      letterSpacing: 0,
      fontVariantNumeric: 'tabular-nums',
      color: '#1f2933',
      py: 1.35,
    },
  };

  const renderSlider = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    onCommit: (value: number) => void,
    min: number,
    max: number,
    step: number,
  ) => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 650 }}>
          {label}
        </Typography>
        <Chip
          label={value}
          size="small"
          sx={{
            height: 22,
            borderRadius: 1,
            fontWeight: 700,
            backgroundColor: alpha(teamColor, 0.1),
            color: teamColor,
          }}
        />
      </Box>
      <Slider
        value={value}
        onChange={(_, v) => onChange(v as number)}
        onChangeCommitted={(_, v) => onCommit(v as number)}
        min={min}
        max={max}
        step={step}
        valueLabelDisplay="auto"
        sx={{
          py: 0.75,
          color: teamColor,
          '& .MuiSlider-thumb': {
            width: 16,
            height: 16,
            boxShadow: `0 0 0 5px ${alpha(teamColor, 0.12)}`,
          },
        }}
      />
    </Box>
  );

  const previewPanel = (
    <Box
      sx={{
        width: { xs: '100%', md: '32%' },
        minWidth: { md: 300 },
        flexShrink: 0,
        position: { md: 'sticky' },
        top: { md: 20 },
        alignSelf: 'flex-start',
        p: 2,
        borderRadius: 3,
        background: `linear-gradient(180deg, ${alpha(teamColor, 0.08)}, #f2f4f5 46%)`,
        boxShadow: `inset 0 0 0 1px ${alpha(teamColor, 0.08)}, 0 18px 48px ${alpha('#101828', 0.06)}`,
      }}
    >
      <Typography sx={{ ...sectionTitleSx, mb: 1.5 }}>{t('preview')}</Typography>
      <Paper
        component={motion.div}
        whileHover={{
          rotateX: -2,
          rotateY: 3,
          y: -4,
          scale: 1.015,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: 2.5,
          backgroundColor: '#fff',
          transformStyle: 'preserve-3d',
          transformOrigin: 'center',
          willChange: 'transform',
          boxShadow: `0 16px 36px ${alpha(teamColor, 0.14)}, 0 1px 0 ${alpha('#fff', 0.9)} inset`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <CharacterImage
            src={displayImage}
            alt={displayName}
            sx={{
              width: Math.max(42, sliderAvatarW * 0.58),
              height: Math.max(42, sliderAvatarH * 0.58),
              borderRadius: sliderAvatarBR,
              objectFit: 'cover',
              flexShrink: 0,
              backgroundColor: alpha(teamColor, 0.08),
              border: `1px solid ${alpha(teamColor, 0.2)}`,
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 800, color: teamColor }} noWrap>
              {displayName}
            </Typography>
            <Chip
              label={teamOptions.find((option) => option.value === activeTeam)?.label || activeTeam}
              size="small"
              sx={{
                mt: 0.5,
                height: 22,
                borderRadius: 1,
                backgroundColor: alpha(teamColor, 0.12),
                color: teamColor,
                fontWeight: 700,
              }}
            />
          </Box>
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: '#344054',
            lineHeight: 1.7,
            fontSize: 14,
            overflowWrap: 'anywhere',
          }}
        >
          {displayAbility}
        </Typography>
      </Paper>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableScrollLock={true}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: { xs: '100dvh', sm: 'min(860px, 92vh)' },
          maxHeight: { xs: '100dvh', sm: '92vh' },
          margin: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 3 },
          overflow: 'hidden',
          backgroundColor: '#f6f7f8',
          boxShadow: `0 28px 80px ${alpha('#101828', 0.22)}, 0 0 0 1px ${alpha(teamColor, 0.2)}, 0 0 0 8px ${dialogGlow}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2.25,
          borderBottom: '1px solid',
          borderColor: alpha('#101828', 0.08),
          background: `linear-gradient(120deg, #fff 0%, #fff 58%, ${alpha(teamColor, 0.14)} 100%)`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: '#667085', fontSize: 13, fontWeight: 720, mb: 0.5 }}>
              {t('editCharacter')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 820, color: '#101828', letterSpacing: 0 }} noWrap>
                {displayName}
              </Typography>
              <Chip
                label={teamOptions.find((option) => option.value === activeTeam)?.label || activeTeam}
                size="small"
                sx={{
                  borderRadius: 1,
                  backgroundColor: alpha(teamColor, 0.14),
                  color: teamColor,
                  fontWeight: 800,
                  boxShadow: `inset 0 0 0 1px ${alpha(teamColor, 0.08)}`,
                }}
              />
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              color: '#475467',
              backgroundColor: alpha('#fff', 0.78),
              boxShadow: `inset 0 0 0 1px ${alpha('#101828', 0.06)}`,
              '&:hover': { backgroundColor: '#fff', color: teamColor },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box
        sx={{
          px: { xs: 1.5, sm: 3 },
          borderBottom: '1px solid',
          borderColor: alpha('#101828', 0.08),
          backgroundColor: '#fff',
          flexShrink: 0,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 42,
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: 999,
              backgroundColor: teamColor,
              boxShadow: `0 0 10px ${alpha(teamColor, 0.35)}`,
            },
            '& .Mui-selected': {
              color: `${teamColor} !important`,
            },
          }}
        >
          <Tab label={t('basicInfo')} sx={tabSx} />
          <Tab label={t('nightOrder')} sx={tabSx} />
          <Tab label={t('reminderTokens')} sx={tabSx} />
          <Tab label={t('customJinx.management')} sx={tabSx} />
          <Tab label={t('ui.category.iconSize')} sx={tabSx} />
        </Tabs>
      </Box>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          height: contentMinHeight,
          overflowY: 'auto',
          background: `radial-gradient(circle at 12% 0%, ${alpha(teamColor, 0.08)}, transparent 30%), #f6f7f8`,
        }}
      >
        <Box
          component="form"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2.5,
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flex: '1 1 68%', minWidth: 0, width: '100%' }}>
            <AnimatePresence mode="wait" initial={false}>
              <Box component={motion.div} key={activeTab} {...tabMotionProps}>
            {activeTab === 0 && (
              <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                <Typography sx={sectionTitleSx}>{t('basicInfo')}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography sx={formLabelSx}>{t('characterName')}</Typography>
                    <TextField
                      fullWidth
                      value={editData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      disabled={isEditDisabled}
                      size="small"
                      sx={fieldSx}
                      slotProps={{ htmlInput: { 'aria-label': t('characterName') } }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={formLabelSx}>{t('team')}</Typography>
                    <FormControl fullWidth disabled={isEditDisabled} sx={fieldSx}>
                      <Select
                        value={editData.team || ''}
                        onChange={(e) => handleChange('team', e.target.value)}
                        size="small"
                        displayEmpty
                      >
                        {teamOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <Box>
                  <Typography sx={formLabelSx}>{t('ability')}</Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={7}
                    value={editData.ability || ''}
                    onChange={(e) => handleChange('ability', e.target.value)}
                    disabled={isEditDisabled}
                    sx={fieldSx}
                    slotProps={{ htmlInput: { 'aria-label': t('ability') } }}
                  />
                </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '104px 1fr' }, gap: 1.5, alignItems: 'stretch' }}>
                <Paper
                  component="label"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 96,
                    cursor: isEditDisabled ? 'default' : 'pointer',
                    backgroundColor: dragActive ? alpha(teamColor, 0.1) : '#fff',
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    borderColor: dragActive ? teamColor : alpha('#2c2416', 0.18),
                    borderRadius: 2,
                    boxShadow: `0 8px 22px ${alpha('#101828', 0.06)}`,
                    transition: 'all 0.2s',
                    opacity: isEditDisabled ? 0.6 : 1,
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: teamColor,
                      backgroundColor: alpha(teamColor, 0.06),
                    },
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                    id="character-image-upload"
                    disabled={isEditDisabled}
                  />
                  {displayImage ? (
                    <Box
                      component="img"
                      src={displayImage}
                      alt={displayName}
                      sx={{ width: '100%', height: '100%', minHeight: 96, objectFit: 'contain', p: 1 }}
                    />
                  ) : (
                    <Stack alignItems="center" spacing={0.5}>
                      <UploadIcon sx={{ fontSize: 24, color: teamColor }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        {t('input.uploadImage')}
                      </Typography>
                    </Stack>
                  )}
                </Paper>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={formLabelSx}>{t('imageUrl')}</Typography>
                    <TextField
                      fullWidth
                      value={editData.image || ''}
                      onChange={(e) => handleChange('image', e.target.value)}
                      disabled={isEditDisabled}
                      size="small"
                      sx={fieldSx}
                      slotProps={{ htmlInput: { 'aria-label': t('imageUrl') } }}
                    />
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      disabled={isEditDisabled}
                      sx={{
                        alignSelf: 'flex-start',
                        borderRadius: 1.5,
                        textTransform: 'none',
                        borderColor: alpha(teamColor, 0.4),
                        color: teamColor,
                        fontWeight: 750,
                        backgroundColor: '#fff',
                        boxShadow: `0 5px 14px ${alpha(teamColor, 0.08)}`,
                      }}
                    >
                      {displayImage ? t('input.reuploadImage') : t('input.uploadImage')}
                      <input type="file" accept="image/*" hidden onChange={handleFileInput} />
                    </Button>
                  </Box>
              </Box>
              </Box>
            )}

            {activeTab === 1 && (
              <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography sx={sectionTitleSx}>{t('nightOrder')}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography sx={formLabelSx}>{t('firstNight')}</Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={editData.firstNight || 0}
                      onChange={(e) => handleChange('firstNight', Number(e.target.value))}
                      disabled={isEditDisabled}
                      sx={orderFieldSx}
                      slotProps={{ htmlInput: { 'aria-label': t('firstNight') } }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={formLabelSx}>{t('otherNight')}</Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={editData.otherNight || 0}
                      onChange={(e) => handleChange('otherNight', Number(e.target.value))}
                      disabled={isEditDisabled}
                      sx={orderFieldSx}
                      slotProps={{ htmlInput: { 'aria-label': t('otherNight') } }}
                    />
                  </Box>
                </Box>
                <Divider sx={{ borderColor: alpha('#101828', 0.08) }} />
                <Typography sx={sectionTitleSx}>{t('storytellerReminders')}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography sx={formLabelSx}>{t('firstNightReminder')}</Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      value={editData.firstNightReminder || ''}
                      onChange={(e) => handleChange('firstNightReminder', e.target.value)}
                      disabled={isEditDisabled}
                      sx={fieldSx}
                      slotProps={{ htmlInput: { 'aria-label': t('firstNightReminder') } }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={formLabelSx}>{t('otherNightReminder')}</Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      value={editData.otherNightReminder || ''}
                      onChange={(e) => handleChange('otherNightReminder', e.target.value)}
                      disabled={isEditDisabled}
                      sx={fieldSx}
                      slotProps={{ htmlInput: { 'aria-label': t('otherNightReminder') } }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {activeTab === 2 && (
              <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography sx={sectionTitleSx}>{t('reminderTokens')}</Typography>
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {(editData.reminders || []).map((reminder, index) => (
                      <Chip
                        key={index}
                        label={reminder}
                        onDelete={isEditDisabled ? undefined : () => {
                          const newReminders = [...(editData.reminders || [])];
                          newReminders.splice(index, 1);
                          handleChange('reminders', newReminders);
                        }}
                      />
                    ))}
                  </Box>
                  <Typography sx={formLabelSx}>{t('addReminder')}</Typography>
                  <TextField
                    fullWidth
                    placeholder={t('addReminderPlaceholder')}
                    disabled={isEditDisabled}
                    size="small"
                    sx={fieldSx}
                    slotProps={{ htmlInput: { 'aria-label': t('addReminder') } }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value) {
                          const newReminders = [...(editData.reminders || []), value];
                          handleChange('reminders', newReminders);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </Box>
                <Divider sx={{ borderColor: alpha('#101828', 0.08) }} />
                <Typography sx={sectionTitleSx}>{t('globalReminderTokens')}</Typography>
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {(editData.remindersGlobal || []).map((reminder, index) => (
                      <Chip
                        key={index}
                        label={reminder}
                        color="secondary"
                        onDelete={isEditDisabled ? undefined : () => {
                          const newReminders = [...(editData.remindersGlobal || [])];
                          newReminders.splice(index, 1);
                          handleChange('remindersGlobal', newReminders);
                        }}
                      />
                    ))}
                  </Box>
                  <Typography sx={formLabelSx}>{t('addGlobalReminder')}</Typography>
                  <TextField
                    fullWidth
                    placeholder={t('addGlobalReminderPlaceholder')}
                    disabled={isEditDisabled}
                    size="small"
                    sx={fieldSx}
                    slotProps={{ htmlInput: { 'aria-label': t('addGlobalReminder') } }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value) {
                          const newReminders = [...(editData.remindersGlobal || []), value];
                          handleChange('remindersGlobal', newReminders);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            )}

            {activeTab === 3 && (
              <Box component="section">
                <Typography sx={sectionTitleSx}>{t('customJinx.management')}</Typography>
            {jinxItems.length > 0 && (
              <List sx={{ mb: 2, p: 0 }}>
                {jinxItems.map((jinx, index) => {
                  const isEditing = editingJinxId === jinx.targetCharacter.id;
                  const isHidden = jinx.jinxInfo.display === false;
                  
                  return (
                    <ListItem
                      key={index}
                      sx={{
                        borderRadius: 2.5,
                        mb: 1.25,
                        p: 1.75,
                        backgroundColor: jinx.jinxInfo.isOfficial 
                          ? '#fff'
                          : alpha(teamColor, 0.08),
                        boxShadow: isHidden
                          ? `inset 0 0 0 1px ${alpha('#d92d20', 0.35)}`
                          : `0 8px 20px ${alpha('#101828', 0.05)}`,
                        opacity: isHidden ? 0.6 : 1,
                        flexDirection: 'column',
                        alignItems: 'stretch',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 1.5 }}>
                        <CharacterImage
                          src={jinx.targetCharacter.image}
                          alt={jinx.targetCharacter.name}
                          sx={{ width: 40, height: 40, borderRadius: 1, flexShrink: 0 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {jinx.targetCharacter.name}
                            </Typography>
                            {jinx.jinxInfo.isOfficial && (
                              <Chip 
                                label={t('customJinx.official')} 
                                size="small" 
                                sx={{ height: 20, borderRadius: 1, backgroundColor: alpha(teamColor, 0.12), color: teamColor, fontWeight: 700 }}
                              />
                            )}
                            {isHidden && (
                              <Chip 
                                label={t('customJinx.hidden')} 
                                size="small" 
                                color="error"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                          
                          {/* 显示或编辑相克规则文本 */}
                          {!isEditing ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {jinx.jinxInfo.reason}
                            </Typography>
                          ) : (
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              value={editingJinxReason}
                              onChange={(e) => setEditingJinxReason(e.target.value)}
                              sx={{ mt: 1 }}
                              size="small"
                            />
                          )}
                        </Box>

                        {/* 操作按钮 */}
                        {!isEditDisabled && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                            {!isEditing ? (
                              <>
                                {/* 显示/隐藏按钮 */}
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleJinxDisplay(jinx)}
                                  title={isHidden ? t('customJinx.show') : t('customJinx.hide')}
                                >
                                  {isHidden ? (
                                    <VisibilityOffIcon fontSize="small" />
                                  ) : (
                                    <VisibilityIcon fontSize="small" />
                                  )}
                                </IconButton>
                                
                                {/* 编辑按钮 */}
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingJinxId(jinx.targetCharacter.id);
                                    setEditingJinxReason(jinx.jinxInfo.reason);
                                  }}
                                  title={t('customJinx.edit')}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>

                                {/* 删除按钮（仅自定义相克） */}
                                {!jinx.jinxInfo.isOfficial && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteJinx(jinx)}
                                    title={t('customJinx.delete')}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </>
                            ) : (
                              <>
                                {/* 保存按钮 */}
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    handleEditOfficialJinx(jinx, editingJinxReason);
                                    setEditingJinxId(null);
                                    setEditingJinxReason('');
                                  }}
                                  title={t('common.save')}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>

                                {/* 取消按钮 */}
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingJinxId(null);
                                    setEditingJinxReason('');
                                  }}
                                  title={t('common.cancel')}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        )}
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}

            {!isEditDisabled && (
              <Paper elevation={0} sx={{ p: 2.25, borderRadius: 2.5, backgroundColor: '#fff', boxShadow: `0 10px 24px ${alpha('#101828', 0.05)}` }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 760, color: '#1f2933' }}>
                  {t('customJinx.addNew')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography sx={formLabelSx}>{t('customJinx.selectTarget')}</Typography>
                    <Autocomplete
                      value={newJinxTarget}
                      onChange={(_, newValue) => setNewJinxTarget(newValue)}
                      options={availableCharacters}
                      getOptionLabel={(option) => option.name}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CharacterImage
                            src={option.image}
                            alt={option.name}
                            sx={{ width: 32, height: 32, borderRadius: 1 }}
                          />
                          <Typography>{option.name}</Typography>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={t('customJinx.selectCharacter')}
                            size="small"
                          sx={fieldSx}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: newJinxTarget && (
                              <CharacterImage
                                src={newJinxTarget.image}
                                alt={newJinxTarget.name}
                                sx={{ width: 32, height: 32, ml: 1, borderRadius: 1 }}
                              />
                            ),
                          }}
                        />
                      )}
                    />
                  </Box>
                  <Box>
                    <Typography sx={formLabelSx}>{t('customJinx.description')}</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder={t('customJinx.descriptionPlaceholder')}
                      value={newJinxDescription}
                      onChange={(e) => setNewJinxDescription(e.target.value)}
                      sx={fieldSx}
                      slotProps={{ htmlInput: { 'aria-label': t('customJinx.description') } }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddJinx}
                    disabled={!newJinxTarget || !newJinxDescription.trim()}
                    fullWidth
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800 }}
                  >
                    {t('customJinx.add')}
                  </Button>
                </Box>
              </Paper>
            )}
              </Box>
            )}

            {activeTab === 4 && (
              <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography sx={sectionTitleSx}>{t('ui.category.iconSize')}</Typography>
                <Paper elevation={0} sx={{ p: 2.25, borderRadius: 2.5, backgroundColor: '#fff', boxShadow: `0 10px 24px ${alpha('#101828', 0.05)}` }}>
                  <Stack spacing={2.25}>
                    {renderSlider(
                      t('ui.avatarBorderRadius'),
                      sliderAvatarBR,
                      setSliderAvatarBR,
                      (v) => uiConfigStore.updateCharacterCardConfig({ avatarBorderRadius: v }),
                      0,
                      10,
                      0.5,
                    )}
                    {renderSlider(
                      t('ui.avatarWidthMd'),
                      sliderAvatarW,
                      setSliderAvatarW,
                      (v) => uiConfigStore.updateCharacterCardConfig({ avatarWidthMd: v }),
                      50,
                      150,
                      1,
                    )}
                    {renderSlider(
                      t('ui.avatarHeightMd'),
                      sliderAvatarH,
                      setSliderAvatarH,
                      (v) => uiConfigStore.updateCharacterCardConfig({ avatarHeightMd: v }),
                      40,
                      120,
                      1,
                    )}
                    {renderSlider(
                      t('ui.cardPaddingX'),
                      sliderPadX,
                      setSliderPadX,
                      (v) => uiConfigStore.updateCharacterCardConfig({ cardPaddingX: v }),
                      0,
                      5,
                      0.5,
                    )}
                    {renderSlider(
                      t('ui.cardGap'),
                      sliderGap,
                      setSliderGap,
                      (v) => uiConfigStore.updateCharacterCardConfig({ cardGap: v }),
                      0,
                      5,
                      0.5,
                    )}
                  </Stack>
                </Paper>
              </Box>
            )}
              </Box>
            </AnimatePresence>
          </Box>
          {previewPanel}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderTop: '1px solid',
          borderColor: alpha('#101828', 0.08),
          backgroundColor: '#fff',
          flexShrink: 0,
        }}
      >
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 750 }}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isEditDisabled}
          sx={{
            borderRadius: 1.5,
            px: 2.5,
            textTransform: 'none',
            fontWeight: 850,
            backgroundColor: teamColor,
            boxShadow: `0 10px 22px ${alpha(teamColor, 0.25)}`,
            '&:hover': { backgroundColor: teamColor, filter: 'brightness(0.92)' },
          }}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
