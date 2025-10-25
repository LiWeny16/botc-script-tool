import { observer } from 'mobx-react-lite';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';
import { useTranslation } from '../utils/i18n';

const LanguageSwitcher = observer(() => {
  const { language, setLanguage } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: 'zh-CN' | 'en') => {
    setLanguage(lang);
    handleClose();
  };

  // 显示切换到的目标语言
  const displayText = language === 'zh-CN' ? 'English' : '中文';

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        size="small"
        sx={{
          color: 'inherit',
          textTransform: 'none',
          fontSize: '0.9rem',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        {displayText}
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
        <MenuItem onClick={() => handleLanguageChange('zh-CN')}>
          <ListItemIcon>
            {language === 'zh-CN' ? <CheckIcon fontSize="small" /> : <span style={{ width: 20 }} />}
          </ListItemIcon>
          <ListItemText>简体中文</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('en')}>
          <ListItemIcon>
            {language === 'en' ? <CheckIcon fontSize="small" /> : <span style={{ width: 20 }} />}
          </ListItemIcon>
          <ListItemText>English</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
});

export default LanguageSwitcher;

