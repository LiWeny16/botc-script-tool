import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { SpecialRule } from '../types';
import { useTranslation } from '../utils/i18n';

interface SpecialRuleEditDialogProps {
  open: boolean;
  rule: SpecialRule | null;
  onClose: () => void;
  onSave: (rule: SpecialRule) => void;
}

const SpecialRuleEditDialog = ({
  open,
  rule,
  onClose,
  onSave,
}: SpecialRuleEditDialogProps) => {
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  // 当 rule 变化时更新表单数据
  useEffect(() => {
    if (rule) {
      setFormData({
        title: rule.title || '',
        content: rule.content || '',
      });
    }
  }, [rule]);

  const handleSave = () => {
    if (rule) {
      onSave({
        ...rule,
        title: formData.title,
        content: formData.content,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{t('specialRules.edit')}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* 标题 */}
          <TextField
            fullWidth
            label={language === 'zh-CN' ? '标题' : 'Title'}
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder={language === 'zh-CN' ? '请输入规则标题' : 'Enter rule title'}
          />

          {/* 内容 */}
          <TextField
            fullWidth
            label={language === 'zh-CN' ? '内容' : 'Content'}
            value={formData.content}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, content: e.target.value }))
            }
            placeholder={language === 'zh-CN' ? '请输入规则内容' : 'Enter rule content'}
            multiline
            rows={6}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained">
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SpecialRuleEditDialog;
