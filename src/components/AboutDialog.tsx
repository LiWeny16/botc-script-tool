import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Link,
  Divider,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

const AboutDialog = ({ open, onClose }: AboutDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: 'linear-gradient(to bottom, #fdfbf7 0%, #f8f6f1 100%)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            color: THEME_COLORS.paper.primary,
          }}
        >
          {t('about.title')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* 关于项目 */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: THEME_COLORS.good,
              mb: 2,
              fontSize: '1.1rem',
            }}
          >
            {t('about.aboutProject')}
          </Typography>
          <Typography
            sx={{
              color: THEME_COLORS.paper.secondary,
              lineHeight: 1.8,
              mb: 2,
              fontSize: '0.95rem',
            }}
          >
            {t('about.projectDescription')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              my: 3,
            }}
          >
            <Button
              variant="contained"
              startIcon={<FavoriteIcon />}
              href="https://ko-fi.com/bigonion"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                backgroundColor: '#FF5E5B',
                color: 'white',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#ff4543',
                },
              }}
            >
              {t('about.donate')}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 致谢 */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: THEME_COLORS.good,
              mb: 2,
              fontSize: '1.1rem',
            }}
          >
            {t('about.acknowledgments')}
          </Typography>

          {/* Valen 致谢卡片 */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(255, 249, 240, 0.95) 0%, rgba(255, 245, 230, 0.9) 100%)',
              borderRadius: 3,
              p: 2.5,
              mb: 2,
              border: '2px solid',
              borderColor: 'rgba(212, 175, 55, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #d4af37 0%, #f0e68c 50%, #d4af37 100%)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#d4af37',
                }}
              />
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  color: '#8b6914',
                  letterSpacing: '0.5px',
                }}
              >
                {t('about.thankValen')}
              </Typography>
            </Box>
          </Box>

          {/* 特别鸣谢卡片 */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.95) 0%, rgba(230, 245, 255, 0.9) 100%)',
              borderRadius: 3,
              p: 2.5,
              mb: 2,
              border: '2px solid',
              borderColor: 'rgba(66, 165, 245, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #42a5f5 0%, #90caf9 50%, #42a5f5 100%)',
              },
            }}
          >
            <Box sx={{ mb: 1.5 }}>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  color: '#1565c0',
                  mb: 0.5,
                  letterSpacing: '0.5px',
                }}
              >
                {t('about.specialThanks')}
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.05rem',
                  color: '#0d47a1',
                  fontWeight: 600,
                  pl: 2,
                }}
              >
                {t('about.nusClub')}
              </Typography>
            </Box>
          </Box>

          {/* 美工设计参考卡片 */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(255, 240, 245, 0.95) 0%, rgba(255, 235, 245, 0.9) 100%)',
              borderRadius: 3,
              p: 2.5,
              border: '2px solid',
              borderColor: 'rgba(236, 64, 122, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #ec407a 0%, #f48fb1 50%, #ec407a 100%)',
              },
            }}
          >
            <Box sx={{ mb: 1.5 }}>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  color: '#ad1457',
                  mb: 0.5,
                  letterSpacing: '0.5px',
                }}
              >
                {t('about.designReference')}
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.05rem',
                  color: '#880e4f',
                  fontWeight: 600,
                  pl: 2,
                }}
              >
                {t('about.museum')}
              </Typography>
            </Box>
          </Box>

          {/* 落款 */}
          <Typography
            sx={{
              color: THEME_COLORS.paper.secondary,
              lineHeight: 1.9,
              fontSize: '0.9rem',
              textAlign: 'right',
              fontStyle: 'italic',
              mt: 3,
              fontFamily: '"Georgia", "Times New Roman", serif',
            }}
          >
            {t('about.letterClosing')}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;
