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
  Slider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { SpecialRule, I18nText } from '../types';
import { useTranslation } from '../utils/i18n';
import { uiConfigStore } from '../stores/UIConfigStore';
import { observer } from 'mobx-react-lite';

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
  const [contentZh, setContentZh] = useState('');
  const [contentEn, setContentEn] = useState('');

  // 辅助函数：从 string | I18nText 提取当前语言的文本
  const extractText = (text: string | I18nText | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[language] || text['zh-CN'] || text['en'] || '';
  };

  // 当 rule 或 language 变化时更新表单数据
  useEffect(() => {
    if (rule) {
      setFormData({
        title: extractText(rule.title),
        content: extractText(rule.content),
      });

      const content = rule.content;
      if (content && typeof content !== 'string') {
        setContentZh(content['zh-CN'] ?? '');
        setContentEn(content['en'] ?? '');
      } else {
        const fallback = typeof content === 'string' ? content : '';
        setContentZh(fallback);
        setContentEn(fallback);
      }
    }
  }, [rule, language]);

  const handleSave = () => {
    if (rule) {
      // 根据当前语言更新对应的字段
      const updateI18nText = (oldText: string | I18nText | undefined, newValue: string): string | I18nText => {
        if (!newValue) return '';

        // 如果旧值是字符串，需要转换为 I18nText 对象
        if (typeof oldText === 'string' || !oldText) {
          // 如果是中文环境，只保存中文
          if (language === 'zh-CN') {
            return newValue;
          }
          // 如果是英文环境，创建 I18nText 对象
          return {
            'zh-CN': oldText || '',
            'en': newValue,
          };
        }

        // 如果旧值已经是 I18nText 对象，更新对应语言的值
        const result: I18nText = { ...oldText };
        result[language] = newValue;

        // 如果只有一个语言有值，简化为字符串（向后兼容）
        if (result['zh-CN'] && !result['en']) {
          return result['zh-CN'];
        }

        return result;
      };

      onSave({
        ...rule,
        title: updateI18nText(rule.title, formData.title),
        content: {
          'zh-CN': contentZh,
          'en': contentEn,
        },
      });
      onClose();
    }
  };

  const handleTitleFontSizeChange = (_: unknown, value: number | number[]) => {
    const numericValue = Array.isArray(value) ? value[0] : value;
    uiConfigStore.setSpecialRuleTitleFontSize(numericValue, { persist: false });
  };

  const handleTitleFontSizeCommit = (_: unknown, value: number | number[]) => {
    const numericValue = Array.isArray(value) ? value[0] : value;
    uiConfigStore.setSpecialRuleTitleFontSize(numericValue, { persist: true });
  };

  const handleContentFontSizeChange = (_: unknown, value: number | number[]) => {
    const numericValue = Array.isArray(value) ? value[0] : value;
    uiConfigStore.setSpecialRuleContentFontSize(numericValue, { persist: false });
  };

  const handleContentFontSizeCommit = (_: unknown, value: number | number[]) => {
    const numericValue = Array.isArray(value) ? value[0] : value;
    uiConfigStore.setSpecialRuleContentFontSize(numericValue, { persist: true });
  };

  const titleFontSizeValue = parseFloat(uiConfigStore.specialRuleTitleFontSize) || 1;
  const contentFontSizeValue = parseFloat(uiConfigStore.specialRuleContentFontSize) || 0.85;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({ ...prev, content: value }));
              if (language === 'zh-CN') {
                setContentZh(value);
              } else if (language === 'en') {
                setContentEn(value);
              }
            }}
            placeholder={language === 'zh-CN' ? '请输入规则内容' : 'Enter rule content'}
            multiline
            rows={4}
          />

          {/* 字体大小调整滑块 */}
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>{t('ui.font.titleFontSize')}</Typography>
            <Slider
              value={titleFontSizeValue}
              onChange={handleTitleFontSizeChange}
              onChangeCommitted={handleTitleFontSizeCommit}
              min={0.5}
              max={3}
              step={0.1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}rem`}
            />
            <Typography gutterBottom sx={{ mt: 2 }}>{t('ui.font.contentFontSize')}</Typography>
            <Slider
              value={contentFontSizeValue}
              onChange={handleContentFontSizeChange}
              onChangeCommitted={handleContentFontSizeCommit}
              min={0.5}
              max={2}
              step={0.05}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}rem`}
            />
          </Box>
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

export default observer(SpecialRuleEditDialog);
