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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import { Close as CloseIcon, Description as DescriptionIcon, LinkOff as LinkOffIcon } from '@mui/icons-material';
import { useTranslation } from '../utils/i18n';
import { getAllSpecialRuleTemplates, type SpecialRuleTemplate } from '../data/utils/specialRules';

interface AddCustomRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onAddRule: (ruleType: 'special_rule' | 'custom_jinx', templateId?: string) => void;
}

const AddCustomRuleDialog = ({
  open,
  onClose,
  onAddRule,
}: AddCustomRuleDialogProps) => {
  const { t, language } = useTranslation();
  const [selectedType, setSelectedType] = useState<'special_rule' | 'custom_jinx' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const templates = getAllSpecialRuleTemplates();
  const getTemplateText = (text?: SpecialRuleTemplate['title']): string =>
    text?.[language] || text?.en || text?.['cn'] || '';

  const handleAdd = () => {
    if (selectedType) {
      onAddRule(selectedType, selectedTemplate || undefined);
      onClose();
      setSelectedType(null);
      setSelectedTemplate(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedType(null);
    setSelectedTemplate(null);
  };

  const ruleTypes = [
    {
      type: 'special_rule' as const,
      title: t('specialRules.specialRule'),
      description: t('specialRules.specialRuleExample'),
      icon: <DescriptionIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      example: t('specialRules.specialRuleExampleText'),
      disabled: false,
    },
    {
      type: 'custom_jinx' as const,
      title: t('customJinx.addTitle'),
      description: t('customJinx.customJinxDescription'),
      icon: <LinkOffIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      example: t('customJinx.customJinxExample'),
      disabled: false,
    },
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
        {!selectedType || selectedType === 'custom_jinx' ? (
          <>
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
                            {t('common.example')} {ruleType.example}
                          </Typography>
                        </Box>
                        {ruleType.disabled && (
                          <Typography variant="caption" color="warning.main" sx={{ fontStyle: 'italic' }}>
                            {t('common.comingSoon')}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('addCustomRule.templateHint')}
            </Typography>

            <List>
              {/* 空白规则选项 */}
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedTemplate === null}
                  onClick={() => setSelectedTemplate(null)}
                  sx={{
                    border: 1,
                    borderColor: selectedTemplate === null ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={t('addCustomRule.blankRule')}
                    secondary={t('addCustomRule.blankRuleDesc')}
                  />
                </ListItemButton>
              </ListItem>

              <Divider sx={{ my: 2 }} />

              {/* 模板选项 */}
              {templates.map((template) => (
                <ListItem key={template.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={selectedTemplate === template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    sx={{
                      border: 1,
                      borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 1.5,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {getTemplateText(template.title)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {getTemplateText(template.content)}
                    </Typography>
                    {template.description && (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        {getTemplateText(template.description)}
                      </Typography>
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            <Button
              onClick={() => setSelectedType(null)}
              sx={{ mt: 2 }}
              variant="outlined"
              fullWidth
            >
              {t('common.backToTypeSelection')}
            </Button>
          </>
        )}
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
