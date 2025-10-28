import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { Character } from '../types';
import { CHARACTERS } from '../data/characters';
import { useTranslation } from '../utils/i18n';
import CharacterImage from './CharacterImage';
import { configStore } from '../stores/ConfigStore';
import { scriptStore } from '../stores/ScriptStore';
import { observer } from 'mobx-react-lite';
import { JINX_DATA, JINX_DATA_EN } from '../data/jinx';

interface CharacterEditDialogProps {
  open: boolean;
  character: Character | null;
  onClose: () => void;
  onSave: (characterId: string, updates: Partial<Character>) => void;
}

// 相克关系项接口
interface JinxItem {
  targetCharacter: Character;
  description: string;
  isCustom: boolean;
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
  
  // 官方ID解析模式下禁用所有编辑
  const isEditDisabled = configStore.config.officialIdParseMode;

  // 获取当前剧本中的所有角色（排除当前编辑的角色）
  const availableCharacters = scriptStore.script?.all.filter(c => c.id !== character?.id) || [];

  // 获取官方相克数据
  const officialJinxData = language === 'en' ? JINX_DATA_EN : JINX_DATA;

  useEffect(() => {
    if (character && scriptStore.script) {
      const defaultData = CHARACTERS[character.id] || {};
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
        Object.entries(scriptStore.script.jinx[currentCharName]).forEach(([targetName, description]) => {
          const targetChar = scriptStore.script!.all.find(c => c.name === targetName);
          if (targetChar) {
            // 检查是否为官方相克
            const isCustom = language === 'en'
              ? !(officialJinxData[currentCharId]?.[targetChar.id] || officialJinxData[targetChar.id]?.[currentCharId])
              : !(officialJinxData[currentCharName]?.[targetName] || officialJinxData[targetName]?.[currentCharName]);

            jinxes.push({
              targetCharacter: targetChar,
              description,
              isCustom,
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
          Object.entries(scriptStore.script.jinx[currentCharName]).forEach(([targetName, description]) => {
            const targetChar = scriptStore.script!.all.find(c => c.name === targetName);
            if (targetChar) {
              const isCustom = language === 'en'
                ? !(officialJinxData[currentCharId]?.[targetChar.id] || officialJinxData[targetChar.id]?.[currentCharId])
                : !(officialJinxData[currentCharName]?.[targetName] || officialJinxData[targetName]?.[currentCharName]);

              jinxes.push({
                targetCharacter: targetChar,
                description,
                isCustom,
              });
            }
          });
        }
        setJinxItems(jinxes);
      }, 100);
    }
  };

  const handleDeleteJinx = (jinx: JinxItem) => {
    if (character && jinx.isCustom) {
      scriptStore.removeCustomJinx(character, jinx.targetCharacter);
      setJinxItems(prev => prev.filter(j => j.targetCharacter.id !== jinx.targetCharacter.id));
    }
  };

  const handleSave = () => {
    // 官方ID解析模式下禁止保存编辑
    if (configStore.config.officialIdParseMode) {
      onClose();
      return;
    }
    
    if (character) {
      const updates: Partial<Character> = {};
      const defaultData = CHARACTERS[character.id] || {};
      
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

  const handleChange = (field: keyof Character, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!character) return null;

  const teamOptions = [
    { value: 'townsfolk', label: t('townsfolk') },
    { value: 'outsider', label: t('outsider') },
    { value: 'minion', label: t('minion') },
    { value: 'demon', label: t('demon') },
    { value: 'fabled', label: t('fabled') },
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
      {/* --- 更紧凑的顶部固定预览区 --- */}
      <DialogTitle sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h6">
            {t('editCharacter')}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <CharacterImage
            src={editData.image || character?.image || ''}
            alt={editData.name || character?.name || ''}
            sx={{
              width: 50, // 缩小图片
              height: 50, // 缩小图片
              borderRadius: 1,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              {editData.name || character.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {editData.ability}
            </Typography>
          </Box>
        </Box>
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
              <TextField
                fullWidth
                label={t('imageUrl')}
                value={editData.image || ''}
                onChange={(e) => handleChange('image', e.target.value)}
                disabled={isEditDisabled}
              />
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
                {jinxItems.map((jinx, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      p: 1.5,
                      backgroundColor: jinx.isCustom ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5 }}>
                      <CharacterImage
                        src={jinx.targetCharacter.image}
                        alt={jinx.targetCharacter.name}
                        sx={{ width: 40, height: 40, borderRadius: 1, flexShrink: 0 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {jinx.targetCharacter.name}
                          {!jinx.isCustom && (
                            <Chip 
                              label={t('customJinx.official')} 
                              size="small" 
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {jinx.description}
                        </Typography>
                      </Box>
                      {jinx.isCustom && !isEditDisabled && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteJinx(jinx)}
                          sx={{ flexShrink: 0 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                ))}
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