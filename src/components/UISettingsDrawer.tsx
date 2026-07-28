import { useState, useMemo } from 'react';
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
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  RestartAlt as RestartAltIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
  Search as SearchIcon,
  FontDownload as FontDownloadIcon,
} from '@mui/icons-material';
import { uiConfigStore } from '../stores/UIConfigStore';
import { configStore } from '../stores/ConfigStore';
import { useTranslation } from '../utils/i18n';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type Language } from '../utils/languages';
import FontUploader from './FontUploader';

interface UISettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

// 配置项分类
interface SettingCategory {
  id: string;
  title: string;
  keywords: string[]; // 用于搜索的关键词（中英文）
}

const UISettingsDrawer = observer(({ open, onClose }: UISettingsDrawerProps) => {
  const { t } = useTranslation();
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontUploaderOpen, setFontUploaderOpen] = useState(false);

  // 定义配置分类及其关键词（中英文）
  const categories: SettingCategory[] = [
    {
      id: 'backgroundSettings',
      title: t('ui.category.backgroundSettings'),
      keywords: [
        '背景', '图片', '上传', '自定义', '夜晚', '顺序', '中间', '区域',
        'background', 'image', 'upload', 'custom', 'night', 'order', 'main', 'area'
      ],
    },
    {
      id: 'avatarIcon',
      title: 'Avatar Icon',
      keywords: [
        'avatar', 'icon', 'upload', 'custom',
        '头像', '图标', '上传', '自定义'
      ]
    },
    {
      id: 'pageLayout',
      title: t('ui.category.pageLayout'),
      keywords: [
        '页面', '布局', '双页', '背景', '夜晚', '顺序', '标题', '高度', '模式',
        'jinx', 'hidden', 'icon', 'position',
        'page', 'layout', 'two-page', 'two page', 'background', 'night', 'order', 'title', 'height', 'mode'
      ],
    },
    {
      id: 'cardLayout',
      title: t('ui.category.cardLayout'),
      keywords: [
        '卡片', '布局', '内边距', '间距', '文本', '区域', 'padding', 'gap',
        'card', 'layout', 'padding', 'gap', 'text', 'area', 'spacing', 'margin'
      ],
    },
    {
      id: 'storytellerNightSheet',
      title: t('ui.category.storytellerNightSheet'),
      keywords: [
        'night', 'order', 'storyteller', 'sheet', 'icon', 'reminder',
        'nacht', 'reihenfolge', 'symbol'
      ],
    },
    {
      id: 'iconSize',
      title: t('ui.category.iconSize'),
      keywords: [
        '图标', '大小', '头像', '相克', '传奇', '宽度', '高度', 'icon', 'size',
        'icon', 'size', 'avatar', 'jinx', 'fabled', 'width', 'height', 'image'
      ],
    },
    {
      id: 'fontSettings',
      title: t('ui.category.fontSettings'),
      keywords: [
        '字体', '标题', '阵营', '角色', '技能', '相克', 'jinx', '特殊规则', '内容',
        'font', 'title', 'team', 'character', 'ability', 'rule', 'content', 'text', 'typography'
      ],
    },
  ];

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

  const handleAvatarUpload = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    uiConfigStore.updateConfig({
      avatarIcon: {
        ...uiConfigStore.config.avatarIcon,
        designerAvatarUrl: reader.result as string,
      }
    });
  };

  reader.readAsDataURL(file);
};

  // 搜索过滤逻辑
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories.map(cat => ({ ...cat, show: true }));
    }

    const query = searchQuery.toLowerCase().trim();
    return categories.map(cat => ({
      ...cat,
      show: cat.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
            cat.title.toLowerCase().includes(query),
    }));
  }, [searchQuery, categories, t]);

  // 字体选择器组件
  const FontSelector = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
      <FormLabel sx={{ fontSize: '0.875rem', mb: 0.5 }}>{label}</FormLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          '& .MuiSelect-select': {
            fontFamily: value,
          },
        }}
      >
        {uiConfigStore.availableFonts.map((font) => (
          <MenuItem
            key={font.value}
            value={font.value}
            sx={{ fontFamily: font.value }}
          >
            {font.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        hideBackdrop={isPinned} // 固定时隐藏背景，未固定时显示背景
      disableScrollLock={true} // 禁用滚动锁定，不隐藏页面滚动条
      ModalProps={{
        disableEnforceFocus: true, // 允许焦点离开抽屉
        disableAutoFocus: true, // 不自动聚焦
        disableScrollLock: true, // 禁用滚动锁定
      }}
      sx={{
        // 固定时让整个 Drawer 容器不阻止交互
        pointerEvents: isPinned ? 'none' : 'auto',
        '& .MuiDrawer-paper': {
          width: { xs: '90%', sm: 420 },
          maxWidth: 420,
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

        {/* 搜索框 */}
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('ui.searchSettings')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* 内容区域 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, pt: 1 }}>
          <Stack spacing={2}>
            {/* 0. 背景设置 */}
            {filteredCategories.find(c => c.id === 'backgroundSettings')?.show && (
            <Accordion defaultExpanded={!searchQuery}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {t('ui.category.backgroundSettings')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  {/* 主题一键切换 */}
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend">{t('ui.theme')}</FormLabel>
                    <RadioGroup
                      row
                      value={uiConfigStore.config.theme}
                      onChange={(e) => uiConfigStore.updateConfig({ theme: e.target.value as 'none' | 'sakura' })}
                    >
                      <FormControlLabel value="none" control={<Radio size="small" />} label={t('ui.themeNone')} />
                      <FormControlLabel value="sakura" control={<Radio size="small" />} label={t('ui.themeSakura')} />
                    </RadioGroup>
                  </FormControl>

                  {/* 提示信息 */}
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: 'info.lighter', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'info.light'
                  }}>
                    <Typography variant="caption" color="info.dark" sx={{ display: 'block', mb: 0.5 }}>
                      {t('ui.backgroundTip')}
                    </Typography>
                    {/* <Typography variant="caption" color="text.secondary">
                      {t('ui.backgroundSizeWarning')}
                    </Typography> */}
                  </Box>

                  {/* 夜晚顺序背景图 */}
                  <Box>
                    <FormLabel sx={{ mb: 1, display: 'block' }}>
                      {t('ui.nightOrderBackgroundLabel')}
                    </FormLabel>
                    
                    {/* 背景模式选择 */}
                    <RadioGroup
                      value={uiConfigStore.config.nightOrderBackgroundMode}
                      onChange={(e) => {
                        uiConfigStore.updateConfig({ 
                          nightOrderBackgroundMode: e.target.value as 'official' | 'custom' 
                        });
                      }}
                    >
                      {/* 官方背景选项 */}
                      <FormControlLabel 
                        value="official" 
                        control={<Radio size="small" />} 
                        label={t('ui.backgroundMode.official')} 
                      />
                      
                      {/* 官方背景的子选项（四种颜色） */}
                      {uiConfigStore.config.nightOrderBackgroundMode === 'official' && (
                        <Box sx={{ ml: 4, mt: 0.5, mb: 1 }}>
                          <RadioGroup
                            value={uiConfigStore.config.nightOrderBackground}
                            onChange={(e) => uiConfigStore.updateConfig({
                              nightOrderBackground: e.target.value as 'purple' | 'yellow' | 'green' | 'pink'
                            })}
                          >
                            <FormControlLabel value="purple" control={<Radio size="small" />} label={t('ui.purpleBackground')} />
                            <FormControlLabel value="yellow" control={<Radio size="small" />} label={t('ui.yellowBackground')} />
                            <FormControlLabel value="green" control={<Radio size="small" />} label={t('ui.greenBackground')} />
                            <FormControlLabel value="pink" control={<Radio size="small" />} label={t('ui.pinkBackground')} />
                          </RadioGroup>
                        </Box>
                      )}
                      
                      {/* 自定义上传选项 */}
                      <FormControlLabel 
                        value="custom" 
                        control={<Radio size="small" />} 
                        label={t('ui.backgroundMode.custom')} 
                      />
                    </RadioGroup>

                    {/* 自定义背景上传界面 */}
                    {uiConfigStore.config.nightOrderBackgroundMode === 'custom' && (
                      <Box sx={{ mt: 1, ml: 4 }}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="night-order-background-upload"
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // 检查文件大小
                              if (file.size > 2 * 1024 * 1024) {
                                alert('图片大小不能超过 2MB');
                                return;
                              }
                              
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                uiConfigStore.updateConfig({ 
                                  customNightOrderBackground: base64 
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label htmlFor="night-order-background-upload">
                          <Button variant="outlined" component="span" fullWidth>
                            {t('ui.uploadBackground')}
                          </Button>
                        </label>
                        
                        {/* 预览和删除 */}
                        {uiConfigStore.config.customNightOrderBackground && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                              {t('ui.backgroundPreview')}
                            </Typography>
                            <Box sx={{ 
                              width: '100%', 
                              height: 100, 
                              backgroundImage: `url(${uiConfigStore.config.customNightOrderBackground})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider'
                            }} />
                            <Button 
                              variant="text" 
                              color="error" 
                              size="small"
                              fullWidth
                              sx={{ mt: 1 }}
                              onClick={() => {
                                uiConfigStore.updateConfig({ 
                                  customNightOrderBackground: '' 
                                });
                              }}
                            >
                              {t('ui.removeBackground')}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>

                  <Divider />

                  {/* 中间区域背景图 */}
                  <Box>
                    <FormLabel sx={{ mb: 1, display: 'block' }}>
                      {t('ui.mainBackgroundLabel')}
                    </FormLabel>
                    
                    {/* 背景模式选择 */}
                    <RadioGroup
                      value={uiConfigStore.config.mainBackgroundMode}
                      onChange={(e) => {
                        uiConfigStore.updateConfig({ 
                          mainBackgroundMode: e.target.value as 'official' | 'custom' 
                        });
                      }}
                    >
                      {/* 官方背景选项 */}
                      <FormControlLabel 
                        value="official" 
                        control={<Radio size="small" />} 
                        label={t('ui.backgroundMode.official')} 
                      />
                      
                      {/* 自定义上传选项 */}
                      <FormControlLabel 
                        value="custom" 
                        control={<Radio size="small" />} 
                        label={t('ui.backgroundMode.custom')} 
                      />
                    </RadioGroup>

                    {/* 官方背景的子选项 */}
                    {uiConfigStore.config.mainBackgroundMode === 'official' && (
                      <Box sx={{ ml: 4, mt: 0.5, mb: 1 }}>
                        <RadioGroup
                          value={uiConfigStore.config.mainBackground}
                          onChange={(e) => uiConfigStore.updateConfig({
                            mainBackground: e.target.value as 'classic' | 'v2' | 'pink'
                          })}
                        >
                          <FormControlLabel value="classic" control={<Radio size="small" />} label={t('ui.mainBackgroundClassic')} />
                          <FormControlLabel value="v2" control={<Radio size="small" />} label={t('ui.mainBackgroundV2')} />
                          <FormControlLabel value="pink" control={<Radio size="small" />} label={t('ui.mainBackgroundPink')} />
                        </RadioGroup>
                      </Box>
                    )}

                    {/* 自定义背景上传界面 */}
                    {uiConfigStore.config.mainBackgroundMode === 'custom' && (
                      <Box sx={{ mt: 1, ml: 4 }}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="main-background-upload"
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // 检查文件大小
                              if (file.size > 2 * 1024 * 1024) {
                                alert('图片大小不能超过 2MB');
                                return;
                              }
                              
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                uiConfigStore.updateConfig({ 
                                  customMainBackground: base64 
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label htmlFor="main-background-upload">
                          <Button variant="outlined" component="span" fullWidth>
                            {t('ui.uploadBackground')}
                          </Button>
                        </label>
                        
                        {/* 预览和删除 */}
                        {uiConfigStore.config.customMainBackground && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                              {t('ui.backgroundPreview')}
                            </Typography>
                            <Box sx={{ 
                              width: '100%', 
                              height: 100, 
                              backgroundImage: `url(${uiConfigStore.config.customMainBackground})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider'
                            }} />
                            <Button 
                              variant="text" 
                              color="error" 
                              size="small"
                              fullWidth
                              sx={{ mt: 1 }}
                              onClick={() => {
                                uiConfigStore.updateConfig({ 
                                  customMainBackground: '' 
                                });
                              }}
                            >
                              {t('ui.removeBackground')}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* 角落装饰花 */}
                  <FormControl component="fieldset">
                    <FormLabel component="legend">{t('ui.cornerFlower')}</FormLabel>
                    <RadioGroup
                      value={uiConfigStore.config.cornerFlower}
                      onChange={(e) => uiConfigStore.updateConfig({ cornerFlower: e.target.value as 'default' | 'cherry-blossom' })}
                    >
                      <FormControlLabel value="default" control={<Radio size="small" />} label={t('ui.cornerFlowerDefault')} />
                      <FormControlLabel value="cherry-blossom" control={<Radio size="small" />} label={t('ui.cornerFlowerCherryBlossom')} />
                    </RadioGroup>
                  </FormControl>
                </Stack>
              </AccordionDetails>
            </Accordion>
            )}


            {/* 1. 页面布局 */}
            {filteredCategories.find(c => c.id === 'pageLayout')?.show && (
            <Accordion defaultExpanded={!searchQuery}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {t('ui.category.pageLayout')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {/* 双页面模式 */}
                  <FormControl component="fieldset" fullWidth>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <FormLabel component="legend">
                          {t('ui.enableTwoPageMode')}
                        </FormLabel>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {t('ui.twoPageModeDesc')}
                        </Typography>
                      </Box>
                      <Switch
                        checked={uiConfigStore.config.enableTwoPageMode}
                        onChange={(e) => uiConfigStore.updateConfig({ enableTwoPageMode: e.target.checked })}
                      />
                    </Box>
                  </FormControl>
                  {/* Storyteller Night Order Sheet */}
                  <FormControl component="fieldset" fullWidth>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <FormLabel component="legend">
                          {t('ui.enableStorytellerNightOrderSheet')}
                        </FormLabel>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {t('ui.enableStorytellerNightOrderSheetDesc')}
                        </Typography>
                      </Box>

                      <Switch
                        checked={uiConfigStore.config.enableStorytellerNightOrderSheet}
                        onChange={(e) =>
                          uiConfigStore.updateConfig({
                            enableStorytellerNightOrderSheet: e.target.checked,
                          })
                        }
                      />
                    </Box>
                  </FormControl>

                  {/* 标题区域高度 */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.jinxIconPosition')}
                    </Typography>
                    <RadioGroup
                      row
                      value={uiConfigStore.config.characterCard.iconOnlyJinxPosition}
                      onChange={(e) => uiConfigStore.updateCharacterCardConfig({ iconOnlyJinxPosition: e.target.value as 'below-description' | 'next-to-name' })}
                    >
                      <FormControlLabel value="next-to-name" control={<Radio size="small" />} label={t('ui.jinxIconPositionNextToName')} />
                      <FormControlLabel value="below-description" control={<Radio size="small" />} label={t('ui.jinxIconPositionBelowDesc')} />
                    </RadioGroup>
                  </Box>

                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.titleHeight')}: {uiConfigStore.config.titleHeightMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.titleHeightMd}
                      onChange={(_, value) => uiConfigStore.updateConfig({ titleHeightMd: value as number })}
                      min={30}
                      max={250}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {/* Night Order top spacing */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">
                        {t('ui.nightOrderTopSpacing')}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={uiConfigStore.config.nightOrderTopSpacingAuto}
                            onChange={(e) => uiConfigStore.updateConfig({ nightOrderTopSpacingAuto: e.target.checked })}
                          />
                        }
                        label={<Typography variant="caption">{t('ui.nightOrderTopSpacingAuto')}</Typography>}
                      />
                    </Box>
                    {!uiConfigStore.config.nightOrderTopSpacingAuto && (
                      <Box>
                        <Typography variant="caption" gutterBottom>
                          {uiConfigStore.config.nightOrderTopSpacing}vh
                        </Typography>
                        <Slider
                          value={uiConfigStore.config.nightOrderTopSpacing}
                          onChange={(_, value) => uiConfigStore.updateConfig({ nightOrderTopSpacing: value as number })}
                          min={0}
                          max={100}
                          step={1}
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    )}
                  </Box>

                </Stack>
              </AccordionDetails>
            </Accordion>
            )}

            {/* 2. 角色卡片布局 */}
            {filteredCategories.find(c => c.id === 'cardLayout')?.show && (
            <Accordion defaultExpanded={!searchQuery}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {t('ui.category.cardLayout')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {/* 卡片内边距（水平） */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.cardPaddingX')}: {uiConfigStore.config.characterCard.cardPaddingX}
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.cardPaddingX}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ cardPaddingX: value as number })}
                      min={0}
                      max={5}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {/* 卡片内边距（竖直） */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.cardPaddingY')}: {uiConfigStore.config.characterCard.cardPaddingY}
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.cardPaddingY}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ cardPaddingY: value as number })}
                      min={0}
                      max={5}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {/* 卡片元素间距 */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.cardGap')}: {uiConfigStore.config.characterCard.cardGap}
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

                  {/* 文本区域间距 */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.textAreaGap')}: {uiConfigStore.config.characterCard.textAreaGap}
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

                  {/* 头像圆角 */}
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.avatarBorderRadius')}: {uiConfigStore.config.characterCard.avatarBorderRadius}
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.avatarBorderRadius}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ avatarBorderRadius: value as number })}
                      min={0}
                      max={10}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
            )}
            {/* Storyteller Night Sheet Layout */}
            {filteredCategories.find(c => c.id === 'storytellerNightSheet')?.show && (
              <Accordion defaultExpanded={!searchQuery}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    {t('ui.category.storytellerNightSheet')}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails>
                  <Stack spacing={2}>

                    {/* Icon size */}
                    <Box>
                      <Typography variant="caption">
                        Icon Size: {uiConfigStore.config.storytellerNightSheet.iconSize}
                      </Typography>
                      <Slider
                        value={uiConfigStore.config.storytellerNightSheet.iconSize}
                        onChange={(_, v) =>
                          uiConfigStore.updateStorytellerNightSheetConfig({
                            iconSize: v as number
                          })
                        }
                        min={0.5}
                        max={4}
                        step={0.1}
                      />
                    </Box>

                    {/* Text size */}
                    <Box>
                      <Typography variant="caption">
                        Text Size: {uiConfigStore.config.storytellerNightSheet.textSize}
                      </Typography>
                      <Slider
                        value={uiConfigStore.config.storytellerNightSheet.textSize}
                        onChange={(_, v) =>
                          uiConfigStore.updateStorytellerNightSheetConfig({
                            textSize: v as number
                          })
                        }
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </Box>

                    {/* Title to content spacing */}
                    <Box>
                      <Typography variant="caption">
                        Abstand Überschrift zu Inhalt: {uiConfigStore.config.storytellerNightSheet.titleContentSpacing}px
                      </Typography>
                      <Slider
                        value={uiConfigStore.config.storytellerNightSheet.titleContentSpacing}
                        onChange={(_, v) =>
                          uiConfigStore.updateStorytellerNightSheetConfig({
                            titleContentSpacing: v as number
                          })
                        }
                        min={-200}
                        max={200}
                        step={1}
                        valueLabelDisplay="auto"
                      />
                    </Box>

                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
            {/* 3. 图标大小配置 */}
            {filteredCategories.find(c => c.id === 'iconSize')?.show && (
            <Accordion defaultExpanded={!searchQuery}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {t('ui.category.iconSize')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {/* 角色头像 */}
                  <Typography variant="caption" sx={{ fontWeight: 'medium', mt: 1 }}>
                    {t('ui.avatarSize')}
                  </Typography>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.avatarWidthMd')}: {uiConfigStore.config.characterCard.avatarWidthMd}px
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
                      {t('ui.avatarHeightMd')}: {uiConfigStore.config.characterCard.avatarHeightMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.avatarHeightMd}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ avatarHeightMd: value as number })}
                      min={40}
                      max={120}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {/* 相克图标 */}
                  <Typography variant="caption" sx={{ fontWeight: 'medium', mt: 2 }}>
                    {t('ui.jinxIconSize')}
                  </Typography>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.jinxIconWidthMd')}: {uiConfigStore.config.characterCard.jinxIconWidthMd}px
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
                      {t('ui.jinxIconHeightMd')}: {uiConfigStore.config.characterCard.jinxIconHeightMd}px
                    </Typography>
                    <Slider
                      value={uiConfigStore.config.characterCard.jinxIconHeightMd}
                      onChange={(_, value) => uiConfigStore.updateCharacterCardConfig({ jinxIconHeightMd: value as number })}
                      min={20}
                      max={80}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {/* 传奇图标 */}
                  <Typography variant="caption" sx={{ fontWeight: 'medium', mt: 2 }}>
                    {t('ui.fabledIconSize')}
                  </Typography>
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      {t('ui.fabledIconWidthMd')}: {uiConfigStore.config.characterCard.fabledIconWidthMd}px
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
                      {t('ui.fabledIconHeightMd')}: {uiConfigStore.config.characterCard.fabledIconHeightMd}px
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
            )}

            {/* 4. 字体设置 */}
            {filteredCategories.find(c => c.id === 'fontSettings')?.show && (
            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {t('ui.category.fontSettings')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {/* 自定义字体管理按钮 */}
                  <Button
                    variant="outlined"
                    startIcon={<FontDownloadIcon />}
                    onClick={() => setFontUploaderOpen(true)}
                    fullWidth
                  >
                    {t('ui.manageCustomFonts')}
                  </Button>

                  <Divider />

                  {/* 剧本标题字体 */}
                  <FontSelector
                    label={t('ui.font.scriptTitle')}
                    value={uiConfigStore.config.fonts.scriptTitle}
                    onChange={(value) => uiConfigStore.updateFontConfig({ scriptTitle: value })}
                  />

                  {/* 阵营分割文字字体 */}
                  <FontSelector
                    label={t('ui.font.teamDivider')}
                    value={uiConfigStore.config.fonts.teamDivider}
                    onChange={(value) => uiConfigStore.updateFontConfig({ teamDivider: value })}
                  />

                  {/* 角色名称字体 */}
                  <FontSelector
                    label={t('ui.font.characterName')}
                    value={uiConfigStore.config.fonts.characterName}
                    onChange={(value) => uiConfigStore.updateFontConfig({ characterName: value })}
                  />

                  {/* 角色名称字号 */}
                  <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                    <FormLabel sx={{ fontSize: '0.875rem', mb: 0.5 }}>{t('ui.font.characterNameFontSize')}</FormLabel>
                    <Select
                      value={uiConfigStore.config.characterCard.nameFontSizeMd}
                      onChange={(e) => uiConfigStore.updateCharacterCardConfig({ nameFontSizeMd: e.target.value })}
                    >
                      {['0.8rem', '0.9rem', '1.0rem', '1.1rem', '1.2rem', '1.3rem', '1.4rem', '1.5rem', '1.6rem', '1.8rem', '2.0rem'].map(size => (
                        <MenuItem key={size} value={size}>{size}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* 角色技能描述字体 */}
                  <FontSelector
                    label={t('ui.font.characterAbility')}
                    value={uiConfigStore.config.fonts.characterAbility}
                    onChange={(value) => uiConfigStore.updateFontConfig({ characterAbility: value })}
                  />

                  {/* 角色技能描述字号 */}
                  <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                    <FormLabel sx={{ fontSize: '0.875rem', mb: 0.5 }}>{t('ui.font.characterAbilityFontSize')}</FormLabel>
                    <Select
                      value={uiConfigStore.config.characterCard.descriptionFontSizeMd}
                      onChange={(e) => uiConfigStore.updateCharacterCardConfig({ descriptionFontSizeMd: e.target.value })}
                    >
                      {['0.7rem', '0.75rem', '0.8rem', '0.85rem', '0.9rem', '0.95rem', '1.0rem', '1.1rem', '1.2rem'].map(size => (
                        <MenuItem key={size} value={size}>{size}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Jinx相克规则字体 */}
                  <FontSelector
                    label={t('ui.font.jinxText')}
                    value={uiConfigStore.config.fonts.jinxText}
                    onChange={(value) => uiConfigStore.updateFontConfig({ jinxText: value })}
                  />

                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                    {t('ui.font.page1Rules')}
                  </Typography>

                  {/* 第一页特殊规则标题字体 */}
                  <FontSelector
                    label={t('ui.font.titleFont')}
                    value={uiConfigStore.config.fonts.specialRuleTitle}
                    onChange={(value) => uiConfigStore.updateFontConfig({ specialRuleTitle: value })}
                  />

                  {/* 第一页特殊规则内容字体 */}
                  <FontSelector
                    label={t('ui.font.contentFont')}
                    value={uiConfigStore.config.fonts.specialRuleContent}
                    onChange={(value) => uiConfigStore.updateFontConfig({ specialRuleContent: value })}
                  />

                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                    {t('ui.font.page2Rules')}
                  </Typography>

                  {/* 第二页特殊规则标题字体 */}
                  <FontSelector
                    label={t('ui.font.titleFont')}
                    value={uiConfigStore.config.fonts.stateRuleTitle}
                    onChange={(value) => uiConfigStore.updateFontConfig({ stateRuleTitle: value })}
                  />

                  {/* 第二页特殊规则内容字体 */}
                  <FontSelector
                    label={t('ui.font.contentFont')}
                    value={uiConfigStore.config.fonts.stateRuleContent}
                    onChange={(value) => uiConfigStore.updateFontConfig({ stateRuleContent: value })}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>
            )}

            {/* 没有搜索结果提示 */}
            {searchQuery && !filteredCategories.some(c => c.show) && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('ui.noResults')}
                </Typography>
              </Box>
            )}

            
            {/* Avatar Control*/}
            {filteredCategories.find(c => c.id === 'avatarIcon')?.show && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Avatar Icon</Typography>
              </AccordionSummary>

              <AccordionDetails>

                <FormControlLabel
                  control={
                    <Switch
                      checked={uiConfigStore.config.avatarIcon.enableDesignerBadge}
                      onChange={(e) =>
                        uiConfigStore.updateConfig({
                          avatarIcon: {
                            ...uiConfigStore.config.avatarIcon,
                            enableDesignerBadge: e.target.checked
                          }
                        })
                      }
                    />
                  }
                  label="Designer Badge"
                />
                <TextField
                  label="Designer Name"
                  value={uiConfigStore.config.avatarIcon.designerName}
                  onChange={(e) =>
                    uiConfigStore.updateConfig({
                      avatarIcon: {
                        ...uiConfigStore.config.avatarIcon,
                        designerName: e.target.value
                      }
                    })
                  }
                />
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Position X: {uiConfigStore.config.avatarIcon.designerPosX}
                </Typography>
                <Slider
                  min={0}
                  max={1560}
                  value={uiConfigStore.config.avatarIcon.designerPosX}
                  onChange={(_, value) =>
                    uiConfigStore.updateConfig({
                      avatarIcon: {
                        ...uiConfigStore.config.avatarIcon,
                        designerPosX: value as number
                      }
                    })
                  }
                />
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Position Y: {uiConfigStore.config.avatarIcon.designerPosY}
                </Typography>
                <Slider
                  min={0}
                  max={1800}
                  value={uiConfigStore.config.avatarIcon.designerPosY}
                  onChange={(_, value) =>
                    uiConfigStore.updateConfig({
                      avatarIcon: {
                        ...uiConfigStore.config.avatarIcon,
                        designerPosY: value as number
                      }
                    })
                  }
                />
                <Button component="label">
                  Upload Avatar
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </Button>

              </AccordionDetails>
            </Accordion>
          )}
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
            {t('ui.resetUISettings')}
          </Button>
        </Box>
      </Box>
    </Drawer>

    {/* 字体上传对话框 */}
    <FontUploader
      open={fontUploaderOpen}
      onClose={() => setFontUploaderOpen(false)}
    />
    </>
  );
});

export default UISettingsDrawer;
