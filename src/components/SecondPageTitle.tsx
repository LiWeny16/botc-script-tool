import { Box, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useState } from 'react';
import { uiConfigStore } from '../stores/UIConfigStore';
import CharacterImage from './CharacterImage';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';

interface SecondPageTitleProps {
  title: string;
  titleImage?: string;
  useImage?: boolean;  // 是否使用图片标题
  fontSize?: any;  // 字体大小（像素）
  imageSize?: number;  // 图片大小（像素）
  author?: string;  // 作者
  playerCount?: string;  // 支持人数
  readOnly?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}

/**
 * 第二页标题组件
 * 使用和第一页完全相同的样式，但支持独立的大小配置
 */
export const SecondPageTitle = ({
  title,
  titleImage,
  useImage = true,  // 默认使用图片（如果有）
  fontSize = 48,  // 默认字体大小
  imageSize = 200,  // 默认图片大小
  author,
  playerCount,
  readOnly = false,
  onDelete,
  onEdit,
}: SecondPageTitleProps) => {
  const [hover, setHover] = useState(false);
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        textAlign: 'center',
        mb: 0,
        position: 'relative',
        zIndex: 1,
        px: { xs: 2, sm: 3, md: 4 },
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDoubleClick={() => !readOnly && onEdit && onEdit()}
    >
      <Box
        sx={{
          position: 'relative',
          height: { xs: 'auto', md: `${imageSize}px` },
          minHeight: { xs: 'auto', md: `${fontSize * 1.5}px` },
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 2, md: 0 },
          py: { xs: 2, md: 0 },
          cursor: readOnly ? 'default' : 'pointer',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: "80%", md: "48%" },
            height: '100%',
            backgroundImage: "url(/imgs/images/pattern.png)",
            backgroundSize: 'contain',
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.6,
            zIndex: 0,
          },
        }}
      >
        {/* 标题 */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '100%',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {useImage && titleImage ? (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                width: '100%',
              }}
            >
              <CharacterImage
                src={titleImage}
                alt={title}
                sx={{
                  maxWidth: '100%',
                  maxHeight: { xs: `${imageSize * 0.75}px`, sm: `${imageSize * 0.875}px`, md: `${imageSize}px` },
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                padding: { xs: 1, sm: 1.5, md: 2 },
                borderRadius: 2,
                userSelect: 'none',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontFamily: uiConfigStore.scriptTitleFont,
                  fontWeight: 'bold',
                  fontSize: {
                    xs: `${fontSize * 0.6}px`,
                    sm: `${fontSize * 0.75}px`,
                    md: `${fontSize}px`
                  },
                  lineHeight: 1.38,
                  m: 0,
                  whiteSpace: 'pre-wrap',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  background: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {title ? title.split(/\\n|<br\s*\/?>/).map((line, index, array) => (
                  <span key={index}>{line}{index < array.length - 1 && <br />}</span>
                )) : ''}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* 标题下方作者与支持人数 */}
      {(author || playerCount) && (
        <Typography
          sx={{
            color: THEME_COLORS.paper.secondary,
            fontSize: { xs: '0.75rem', sm: '0.95rem' },
            mt: 0.5,
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {author ? `${t('script.author2')}：${author}` : ''}
          {author && playerCount ? ' · ' : ''}
          {playerCount ? `${t('script.playerCount')}：${playerCount}` : ''}
        </Typography>
      )}

      {/* 悬停时显示的编辑和删除按钮 - 使用和第一页相同的样式 */}
      {!readOnly && hover && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 1 }}>
          {onEdit && (
            <IconButton
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              sx={{ backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': { backgroundColor: 'rgba(255,255,255,1)' } }}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              sx={{ backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': { backgroundColor: 'rgba(255,255,255,1)' } }}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  );
};

