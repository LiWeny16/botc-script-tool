import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Autocomplete,
  Typography,
  Alert,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import type { Character, I18nText } from '../types';
import { useTranslation } from '../utils/i18n';
import CharacterImage from './CharacterImage';

interface CustomJinxDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (characterA: Character, characterB: Character, description: string) => void;
  characters: Character[];
  editingJinx?: {
    characterA: Character;
    characterB: Character;
    description: string | I18nText;
  } | null;
}

const CustomJinxDialog = observer(({
  open,
  onClose,
  onSave,
  characters,
  editingJinx,
}: CustomJinxDialogProps) => {
  const { t, language } = useTranslation();
  const [characterA, setCharacterA] = useState<Character | null>(null);
  const [characterB, setCharacterB] = useState<Character | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // 当对话框打开或编辑数据变化时,初始化表单
  useEffect(() => {
    if (open) {
      if (editingJinx) {
        setCharacterA(editingJinx.characterA);
        setCharacterB(editingJinx.characterB);
        
        // 处理描述文本
        if (typeof editingJinx.description === 'string') {
          setDescription(editingJinx.description);
        } else {
          // 根据当前语言选择对应的描述
          setDescription(editingJinx.description[language] || editingJinx.description['zh-CN'] || '');
        }
      } else {
        setCharacterA(null);
        setCharacterB(null);
        setDescription('');
      }
      setError('');
    }
  }, [open, editingJinx, language]);

  const handleSave = () => {
    // 验证输入
    if (!characterA || !characterB) {
      setError(t('customJinx.selectCharactersError'));
      return;
    }

    if (characterA.id === characterB.id) {
      setError(t('customJinx.sameCharacterError'));
      return;
    }

    if (!description.trim()) {
      setError(t('customJinx.descriptionError'));
      return;
    }

    // 保存
    onSave(characterA, characterB, description.trim());
    handleClose();
  };

  const handleClose = () => {
    setCharacterA(null);
    setCharacterB(null);
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        {editingJinx ? t('customJinx.editTitle') : t('customJinx.addTitle')}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {/* 错误提示 */}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* 角色A选择 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('customJinx.characterA')}
            </Typography>
            <Autocomplete
              value={characterA}
              onChange={(_, newValue) => setCharacterA(newValue)}
              options={characters}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CharacterImage
                    component="avatar"
                    src={option.image}
                    alt={option.name}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography>{option.name}</Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('customJinx.selectCharacter')}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: characterA && (
                      <CharacterImage
                        component="avatar"
                        src={characterA.image}
                        alt={characterA.name}
                        sx={{ width: 32, height: 32, ml: 1 }}
                      />
                    ),
                  }}
                />
              )}
            />
          </Box>

          {/* 角色B选择 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('customJinx.characterB')}
            </Typography>
            <Autocomplete
              value={characterB}
              onChange={(_, newValue) => setCharacterB(newValue)}
              options={characters}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CharacterImage
                    component="avatar"
                    src={option.image}
                    alt={option.name}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography>{option.name}</Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('customJinx.selectCharacter')}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: characterB && (
                      <CharacterImage
                        component="avatar"
                        src={characterB.image}
                        alt={characterB.name}
                        sx={{ width: 32, height: 32, ml: 1 }}
                      />
                    ),
                  }}
                />
              )}
            />
          </Box>

          {/* 相克描述 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('customJinx.description')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('customJinx.descriptionPlaceholder')}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained">
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default CustomJinxDialog;
