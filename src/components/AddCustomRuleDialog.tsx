import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import { Close as CloseIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { useTranslation } from '../utils/i18n';

interface AddCustomRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onAddRule: (ruleType: 'special_rule') => void;
}

const AddCustomRuleDialog = ({
  open,
  onClose,
  onAddRule,
}: AddCustomRuleDialogProps) => {
  const { t, language } = useTranslation();
  const [selectedType, setSelectedType] = useState<'special_rule' | null>(null);

  const handleAdd = () => {
    if (selectedType) {
      onAddRule(selectedType);
      onClose();
      setSelectedType(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedType(null);
  };

  const ruleTypes = [
    {
      type: 'special_rule' as const,
      title: t('specialRules.specialRule'),
      description: language === 'zh-CN' 
        ? '类似"第七把交椅"的自定义卷轴规则'
        : 'Custom scroll rules like "The Seventh Chair"',
      icon: <DescriptionIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      example: language === 'zh-CN' ? '第七把交椅' : 'The Seventh Chair',
      disabled: false,
    },
    // 预留扩展位置
    // {
    //   type: 'custom_jinx',
    //   title: '自定义相克',
    //   description: '添加角色之间的自定义相克规则',
    //   icon: <LinkIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
    //   example: '待扩展',
    //   disabled: true,
    // },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{t('specialRules.dialogTitle')}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('specialRules.selectType')}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          {ruleTypes.map((ruleType) => (
            <Card
              key={ruleType.type as string}
                variant="outlined"
                sx={{
                  height: '100%',
                  borderColor: selectedType === ruleType.type ? 'primary.main' : 'divider',
                  borderWidth: selectedType === ruleType.type ? 2 : 1,
                  opacity: ruleType.disabled ? 0.5 : 1,
                  pointerEvents: ruleType.disabled ? 'none' : 'auto',
                }}
              >
                <CardActionArea
                  onClick={() => !ruleType.disabled && setSelectedType(ruleType.type)}
                  sx={{ height: '100%', p: 2 }}
                  disabled={ruleType.disabled}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      {ruleType.icon}
                      <Typography variant="h6" align="center" sx={{ fontWeight: 'bold' }}>
                        {ruleType.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        {ruleType.description}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          px: 2,
                          py: 0.5,
                          backgroundColor: 'action.hover',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {language === 'zh-CN' ? '示例：' : 'Example: '}{ruleType.example}
                        </Typography>
                      </Box>
                      {ruleType.disabled && (
                        <Typography variant="caption" color="warning.main" sx={{ fontStyle: 'italic' }}>
                          {language === 'zh-CN' ? '敬请期待' : 'Coming Soon'}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{t('specialRules.cancel')}</Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          disabled={!selectedType}
        >
          {t('specialRules.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCustomRuleDialog;
