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
  InputLabel,
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
} from '@mui/material';
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
      console.log('CharacterEditDialog - 角色数据:', {
        characterId: character.id,
        characterReminders: character.reminders,
        characterRemindersGlobal: character.remindersGlobal,
        defaultReminders: defaultData.reminders,
        defaultRemindersGlobal: defaultData.remindersGlobal,
        mergedReminders: mergedData.reminders,
        mergedRemindersGlobal: mergedData.remindersGlobal,
      });
      setEditData(mergedData);

      // 加载该角色相关的相克关系
      const jinxes: JinxItem[] = [];
      const currentCharName = character.name;
      const currentCharId = character.id;

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
        const currentCharId = character.id;

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
        console.log('CharacterEditDialog - 保存角色更新:', {
          characterId: character.id,
          updates,
          remindersInUpdates: updates.reminders,
          remindersGlobalInUpdates: updates.remindersGlobal,
        });
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableScrollLock={true}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: { xs: '100vh', sm: '90vh' },
          margin: { xs: 0, sm: 2 },
        },
      }}
    >
      {/* --- 顶部预览区（使用实际卡片配置） --- */}
      <DialogTitle sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">
            {t('editCharacter')}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            gap: `${sliderGap * 0.6}px`,
            alignItems: 'center',
            px: sliderPadX * 0.6,
            py: cc.cardPaddingY * 0.6,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.default',
          }}
        >
          <CharacterImage
            src={editData.image || character?.image || ''}
            alt={editData.name || character?.name || ''}
            sx={{
              width: sliderAvatarW * 0.5,
              height: sliderAvatarH * 0.5,
              borderRadius: sliderAvatarBR,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" noWrap>
              {editData.name || character.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: uiConfigStore.config.characterCard.descriptionFontSizeMd,
              lineHeight: uiConfigStore.config.characterCard.descriptionLineHeight,
            }}>
              {editData.ability}
            </Typography>
          </Box>
        </Paper>
      </DialogTitle>

      {/* --- 全面采用 Flexbox 的可滚动表单区域 --- */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* 基本信息区块 */}
          <Box component="section">
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>{t('basicInfo')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  sx={{ flex: 1 }}
                  label={t('characterName')}
                  value={editData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={isEditDisabled}
                />
                <FormControl sx={{ flex: 1 }} disabled={isEditDisabled}>
                  <InputLabel>{t('team')}</InputLabel>
                  <Select
                    value={editData.team || ''}
                    label={t('team')}
                    onChange={(e) => handleChange('team', e.target.value)}
                  >
                    {teamOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <TextField
                fullWidth
                label={t('ability')}
                multiline
                rows={2}
                value={editData.ability || ''}
                onChange={(e) => handleChange('ability', e.target.value)}
                disabled={isEditDisabled}
              />
              <Box>
                <Paper
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1.5,
                    minHeight: 56,
                    cursor: isEditDisabled ? 'default' : 'pointer',
                    backgroundColor: dragActive ? 'action.hover' : 'background.paper',
                    borderStyle: 'dashed',
                    borderWidth: 1.5,
                    borderColor: dragActive ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    opacity: isEditDisabled ? 0.6 : 1,
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
                  <label htmlFor="character-image-upload" style={{ cursor: isEditDisabled ? 'default' : 'pointer', width: '100%' }}>
                    {editData.image ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          component="img"
                          src={editData.image}
                          alt=""
                          sx={{ width: 36, height: 36, borderRadius: 0.5, objectFit: 'cover', flexShrink: 0 }}
                        />
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>
                          {t('input.reuploadImage')}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UploadIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {t('input.uploadImage')}
                        </Typography>
                      </Box>
                    )}
                  </label>
                </Paper>
                <TextField
                  fullWidth
                  label={t('imageUrl')}
                  value={editData.image || ''}
                  onChange={(e) => handleChange('image', e.target.value)}
                  disabled={isEditDisabled}
                  size="small"
                  sx={{ mt: 1 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              {/* 图片样式控制 */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', display: 'block', mb: 1 }}>
                  {t('ui.category.iconSize')}
                </Typography>
                <Stack spacing={2}>
                  {/* 头像圆角 */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.avatarBorderRadius')}: {sliderAvatarBR}
                    </Typography>
                    <Slider
                      value={sliderAvatarBR}
                      onChange={(_, v) => setSliderAvatarBR(v as number)}
                      onChangeCommitted={(_, v) => uiConfigStore.updateCharacterCardConfig({ avatarBorderRadius: v as number })}
                      min={0}
                      max={10}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  {/* 头像宽度 */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.avatarWidthMd')}: {sliderAvatarW}
                    </Typography>
                    <Slider
                      value={sliderAvatarW}
                      onChange={(_, v) => setSliderAvatarW(v as number)}
                      onChangeCommitted={(_, v) => uiConfigStore.updateCharacterCardConfig({ avatarWidthMd: v as number })}
                      min={50}
                      max={150}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  {/* 头像高度 */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.avatarHeightMd')}: {sliderAvatarH}
                    </Typography>
                    <Slider
                      value={sliderAvatarH}
                      onChange={(_, v) => setSliderAvatarH(v as number)}
                      onChangeCommitted={(_, v) => uiConfigStore.updateCharacterCardConfig({ avatarHeightMd: v as number })}
                      min={40}
                      max={120}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  {/* 卡片内边距 */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.cardPaddingX')}: {sliderPadX}
                    </Typography>
                    <Slider
                      value={sliderPadX}
                      onChange={(_, v) => setSliderPadX(v as number)}
                      onChangeCommitted={(_, v) => uiConfigStore.updateCharacterCardConfig({ cardPaddingX: v as number })}
                      min={0}
                      max={5}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  {/* 卡片元素间距 */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.cardGap')}: {sliderGap}
                    </Typography>
                    <Slider
                      value={sliderGap}
                      onChange={(_, v) => setSliderGap(v as number)}
                      onChangeCommitted={(_, v) => uiConfigStore.updateCharacterCardConfig({ cardGap: v as number })}
                      min={0}
                      max={5}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* 夜晚行动顺序区块 */}
          <Box component="section">
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>{t('nightOrder')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                sx={{ flex: 1 }}
                label={t('firstNight')}
                type="number"
                value={editData.firstNight || 0}
                onChange={(e) => handleChange('firstNight', Number(e.target.value))}
                disabled={isEditDisabled}
              />
              <TextField
                sx={{ flex: 1 }}
                label={t('otherNight')}
                type="number"
                value={editData.otherNight || 0}
                onChange={(e) => handleChange('otherNight', Number(e.target.value))}
                disabled={isEditDisabled}
              />
            </Box>
          </Box>

          <Divider />

          {/* 说书人提醒区块 */}
          <Box component="section">
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>{t('storytellerReminders')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label={t('firstNightReminder')}
                multiline
                rows={2}
                value={editData.firstNightReminder || ''}
                onChange={(e) => handleChange('firstNightReminder', e.target.value)}
                disabled={isEditDisabled}
              />
              <TextField
                fullWidth
                label={t('otherNightReminder')}
                multiline
                rows={2}
                value={editData.otherNightReminder || ''}
                onChange={(e) => handleChange('otherNightReminder', e.target.value)}
                disabled={isEditDisabled}
              />
            </Box>
            <>
              <Divider />

              {/* 提醒标记区块 */}
              <Box component="section">
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                  {t('reminderTokens')}
                </Typography>
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
                  <TextField
                    fullWidth
                    label={t('addReminder')}
                    placeholder={t('addReminderPlaceholder')}
                    disabled={isEditDisabled}
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
              </Box>

              {/* 全局提醒标记区块 */}
              <Box component="section">
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                  {t('globalReminderTokens')}
                </Typography>
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
                  <TextField
                    fullWidth
                    label={t('addGlobalReminder')}
                    placeholder={t('addGlobalReminderPlaceholder')}
                    disabled={isEditDisabled}
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
            </>
          </Box>

          <Divider />

          {/* 自定义相克关系区块 */}
          <Box component="section">
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
              {t('customJinx.management')}
            </Typography>
            
            {/* 现有相克关系列表 */}
            {jinxItems.length > 0 && (
              <List sx={{ mb: 2, p: 0 }}>
                {jinxItems.map((jinx, index) => {
                  const isEditing = editingJinxId === jinx.targetCharacter.id;
                  const isHidden = jinx.jinxInfo.display === false;
                  
                  return (
                    <ListItem
                      key={index}
                      sx={{
                        border: 1,
                        borderColor: isHidden ? 'error.main' : 'divider',
                        borderRadius: 1,
                        mb: 1,
                        p: 1.5,
                        backgroundColor: jinx.jinxInfo.isOfficial 
                          ? 'transparent' 
                          : 'rgba(25, 118, 210, 0.08)',
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
                                color="primary"
                                sx={{ height: 20 }}
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

            {/* 添加新相克关系 */}
            {!isEditDisabled && (
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  {t('customJinx.addNew')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        label={t('customJinx.selectTarget')}
                        placeholder={t('customJinx.selectCharacter')}
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
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={t('customJinx.description')}
                    placeholder={t('customJinx.descriptionPlaceholder')}
                    value={newJinxDescription}
                    onChange={(e) => setNewJinxDescription(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddJinx}
                    disabled={!newJinxTarget || !newJinxDescription.trim()}
                    fullWidth
                  >
                    {t('customJinx.add')}
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>

        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isEditDisabled}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
