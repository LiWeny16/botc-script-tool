import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  TextField,
  Button,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  RestartAlt as RestartAltIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { uiConfigStore } from '../stores/UIConfigStore';
import { useTranslation } from '../utils/i18n';

interface UISettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const UISettingsDrawer = observer(({ open, onClose }: UISettingsDrawerProps) => {
  const { t } = useTranslation();
  const [isPinned, setIsPinned] = useState(false);

  const handleClose = () => {
    if (!isPinned) {
      onClose();
    }
  };

  const handleReset = () => {
    if (window.confirm(t('dialog.resetUIMessage') || '确定要重置所有UI设置吗？')) {
      uiConfigStore.resetToDefault();
    }
  };

  const handlePinToggle = () => {
    setIsPinned(!isPinned);
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={handleClose}
      hideBackdrop={isPinned} // 固定时隐藏背景，未固定时显示背景
      disableScrollLock={true} // 禁用滚动锁定，不隐藏页面滚动条
      ModalProps={{
        keepMounted: true, // 保持组件挂载
        disableEnforceFocus: true, // 允许焦点离开抽屉
        disableAutoFocus: true, // 不自动聚焦
        disableScrollLock: true, // 禁用滚动锁定
      }}
      sx={{
        // 固定时让整个 Drawer 容器不阻止交互
        pointerEvents: isPinned ? 'none' : 'auto',
        '& .MuiDrawer-paper': {
          width: { xs: '90%', sm: 400 },
          maxWidth: 400,
          boxShadow: 3,
          // 但抽屉本身可以交互
          pointerEvents: 'auto',
        },
        // 未固定时显示半透明背景
        ...(!isPinned && {
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        }),
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 头部 */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: isPinned ? 'primary.light' : 'background.paper',
          transition: 'background-color 0.3s',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: isPinned ? 'primary.contrastText' : 'text.primary' }}>
            {t('ui.settings')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isPinned ? (t('ui.unpinDrawer')) : (t('ui.pinDrawer'))}>
              <IconButton 
                onClick={handlePinToggle} 
                size="small" 
                color={isPinned ? 'inherit' : 'default'}
                sx={{
                  backgroundColor: isPinned ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isPinned ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                {isPinned ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small" sx={{ color: isPinned ? 'primary.contrastText' : 'text.primary' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* 内容区域 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Stack spacing={2}>
            {/* 双页面模式 */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {t('ui.twoPageMode')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl component="fieldset" fullWidth>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormLabel component="legend">
                      {t('ui.enableTwoPageMode')}
                    </FormLabel>
                    <Switch
                      checked={uiConfigStore.config.enableTwoPageMode}
                      onChange={(e) => uiConfigStore.updateConfig({ enableTwoPageMode: e.target.checked })}
                    />
                  </Box>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* Night Order 背景 */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {t('ui.nightOrderBackground') || '夜晚顺序背景'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={uiConfigStore.config.nightOrderBackground}
                    onChange={(e) => uiConfigStore.updateConfig({ nightOrderBackground: e.target.value as 'purple' | 'yellow' })}
                  >
                    <FormControlLabel value="purple" control={<Radio />} label={t('ui.purpleBackground') || '紫色背景'} />
                    <FormControlLabel value="yellow" control={<Radio />} label={t('ui.yellowBackground') || '黄色背景'} />
                  </RadioGroup>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* 标题区域高度 */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {t('ui.titleHeight') || '标题区域高度'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.desktopHeight') || '桌面端 (md)'}: {uiConfigStore.config.titleHeightMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.titleHeightMd}
                      onChange={(_, value) => uiConfigStore.updateConfig({ titleHeightMd: value as number })}
                      min={100}
                      max={300}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* 角色卡片配置 */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {t('ui.characterCard') || '角色卡片配置'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {/* 卡片基础配置 */}
                  <Typography variant="caption" sx={{ fontWeight: 'medium', mt: 1 }}>
                    {t('ui.cardBasic') || '卡片基础'}
                  </Typography>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.cardPadding') || '内边距'}: {uiConfigStore.config.characterCard.cardPadding}
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.cardPadding}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ cardPadding: value as number })}
                      min={0}
                      max={5}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.cardGap') || '元素间距'}: {uiConfigStore.config.characterCard.cardGap}
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.cardGap}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ cardGap: value as number })}
                      min={0}
                      max={5}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {/* 头像配置 */}
                  <Typography variant="caption" sx={{ fontWeight: 'medium', mt: 2 }}>
                    {t('ui.avatar') || '头像配置'}
                  </Typography>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.avatarWidthMd') || '头像宽度 (桌面)'}: {uiConfigStore.config.characterCard.avatarWidthMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.avatarWidthMd}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ avatarWidthMd: value as number })}
                      min={50}
                      max={150}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.avatarHeightMd') || '头像高度 (桌面)'}: {uiConfigStore.config.characterCard.avatarHeightMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.avatarHeightMd}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ avatarHeightMd: value as number })}
                      min={40}
                      max={120}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {/* 文字配置 */}
                  <Typography variant="caption" sx={{ fontWeight: 'medium', mt: 2 }}>
                    {t('ui.textConfig') || '文字配置'}
                  </Typography>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.textAreaGap') || '文本区域间距'}: {uiConfigStore.config.characterCard.textAreaGap}
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.textAreaGap}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ textAreaGap: value as number })}
                      min={0}
                      max={2}
                      step={0.1}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {/* 相克规则配置 */}
                  <Typography variant="caption" sx={{ fontWeight: 'medium', mt: 2 }}>
                    {t('ui.jinxConfig') || '相克规则配置'}
                  </Typography>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.jinxIconWidthMd') || '相克图标宽度 (桌面)'}: {uiConfigStore.config.characterCard.jinxIconWidthMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.jinxIconWidthMd}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ jinxIconWidthMd: value as number })}
                      min={20}
                      max={80}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.jinxIconHeightMd') || '相克图标高度 (桌面)'}: {uiConfigStore.config.characterCard.jinxIconHeightMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.jinxIconHeightMd}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ jinxIconHeightMd: value as number })}
                      min={20}
                      max={80}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {/* 传奇角色图标配置 */}
                  <Typography variant="caption" sx={{ fontWeight: 'medium', mt: 2 }}>
                    {t('ui.fabledConfig') || '传奇角色图标配置'}
                  </Typography>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.fabledIconWidthMd') || '传奇图标宽度 (桌面)'}: {uiConfigStore.config.characterCard.fabledIconWidthMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.fabledIconWidthMd}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ fabledIconWidthMd: value as number })}
                      min={20}
                      max={100}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.fabledIconHeightMd') || '传奇图标高度 (桌面)'}: {uiConfigStore.config.characterCard.fabledIconHeightMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.fabledIconHeightMd}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ fabledIconHeightMd: value as number })}
                      min={20}
                      max={100}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>

        <Divider />

        {/* 底部操作 */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="warning"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
          >
            {t('ui.resetAllSettings') || '重置所有设置'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
});

export default UISettingsDrawer;
