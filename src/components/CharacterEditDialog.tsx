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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Character } from '../types';
import { CHARACTERS } from '../data/characters';
import { useTranslation } from '../utils/i18n';
import CharacterImage from './CharacterImage';

interface CharacterEditDialogProps {
  open: boolean;
  character: Character | null;
  onClose: () => void;
  onSave: (characterId: string, updates: Partial<Character>) => void;
}

export default function CharacterEditDialog({
  open,
  character,
  onClose,
  onSave,
}: CharacterEditDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editData, setEditData] = useState<Partial<Character>>({});

  useEffect(() => {
    if (character) {
      const defaultData = CHARACTERS[character.id] || {};
      const mergedData = {
        ...defaultData,
        ...character,
      };
      setEditData(mergedData);
    }
  }, [character]);

  const handleSave = () => {
    if (character) {
      const updates: Partial<Character> = {};
      const defaultData = CHARACTERS[character.id] || {};

      Object.keys(editData).forEach((key) => {
        const typedKey = key as keyof Character;
        if (editData[typedKey] !== defaultData[typedKey]) {
          (updates as any)[typedKey] = editData[typedKey];
        }
      });

      onSave(character.id, updates);
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
                />
                <FormControl sx={{ flex: 1 }}>
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
              />
              <TextField
                fullWidth
                label={t('imageUrl')}
                value={editData.image || ''}
                onChange={(e) => handleChange('image', e.target.value)}
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
              />
              <TextField
                sx={{ flex: 1 }}
                label={t('otherNight')}
                type="number"
                value={editData.otherNight || 0}
                onChange={(e) => handleChange('otherNight', Number(e.target.value))}
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
              />
              <TextField
                fullWidth
                label={t('otherNightReminder')}
                multiline
                rows={2}
                value={editData.otherNightReminder || ''}
                onChange={(e) => handleChange('otherNightReminder', e.target.value)}
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
                        onDelete={() => {
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
            </>
          </Box>


        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained">
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}