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

const CustomJinxDialog = ({
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

  // Initialize form when dialog opens or editing data changes
  useEffect(() => {
    if (open) {
      if (editingJinx) {
        setCharacterA(editingJinx.characterA);
        setCharacterB(editingJinx.characterB);
        
        // Handle description text
        if (typeof editingJinx.description === 'string') {
          setDescription(editingJinx.description);
        } else {
          // Select description based on current language
          setDescription(
            editingJinx.description[language] ||
            editingJinx.description.en ||
            editingJinx.description['cn'] ||
            ''
          );
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
    // Validate input
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

    // Save
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
          {/* Error message */}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Character A selection */}
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

          {/* Character B selection */}
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

          {/* Jinx description */}
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
};

export default CustomJinxDialog;
