import { observer } from 'mobx-react-lite';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';
import { useTranslation } from '../utils/i18n';
import { LANGUAGE_LABELS, LANGUAGE_SHORT_LABELS, SUPPORTED_LANGUAGES, type Language } from '../utils/languages';

export interface LanguageSwitcherProps {
  /** 合并到语言按钮的 sx，用于响应式全宽等 */
  buttonSx?: SxProps<Theme>;
}

const LanguageSwitcher = observer(({ buttonSx }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        size="small"
        sx={
          [
            {
              color: 'inherit',
              textTransform: 'none',
              fontSize: '0.9rem',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            },
            ...(buttonSx ? [buttonSx] : []),
          ] as SxProps<Theme>
        }
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        {LANGUAGE_SHORT_LABELS[language]}
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableScrollLock={true}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <MenuItem key={lang} onClick={() => handleLanguageChange(lang)}>
            <ListItemIcon>
              {language === lang ? <CheckIcon fontSize="small" /> : <span style={{ width: 20 }} />}
            </ListItemIcon>
            <ListItemText>{LANGUAGE_LABELS[lang]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

export default LanguageSwitcher;

