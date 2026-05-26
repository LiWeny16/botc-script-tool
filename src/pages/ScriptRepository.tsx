import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  CardActionArea,
  InputAdornment,
  Button,
  CardMedia,
  Pagination,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { observer } from 'mobx-react-lite';
import { searchScripts, type ScriptData } from '../data/utils/scriptRepository';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { trackOpenRepo } from '../utils/analytics';

type RepoScript = ScriptData & { nameEn?: string };

const ScriptRepository = observer(() => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  // Category from URL as single source of truth — no duplicated React state
  const category = (searchParams.get('category') || 'official') as 'official' | 'official_mix' | 'custom';

  const [allScripts, setAllScripts] = useState<RepoScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Responsive: 5 rows × N columns
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const columns = isMobile ? 1 : isTablet ? 2 : 3;
  const itemsPerPage = columns * 5;

  const handleCategoryChange = (newCategory: typeof category) => {
    if (newCategory === category) return;
    setSearchParams({ category: newCategory });
    setPage(1);
  };

  const getDisplayName = (s: RepoScript) => (language === 'en' && s.nameEn ? s.nameEn : s.name);

  useEffect(() => {
    trackOpenRepo();
  }, []);

  // Load manifest
  useEffect(() => {
    const loadManifest = async () => {
      try {
        const res = await fetch('/scripts/json/manifest.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('manifest not found');
        const data = await res.json();
        const list = (data.scripts || []).map((s: any): RepoScript => ({
          id: s.id,
          name: s.name,
          nameEn: s.nameEn,
          author: s.author || 'Unknown',
          description: s.description || '',
          category: (s.category || 'custom'),
          logo: s.logo || undefined,
          jsonUrl: s.jsonUrl,
        }));
        setAllScripts(list);
      } catch {
        setAllScripts(searchScripts('').map(s => ({ ...s })));
      } finally {
        setLoading(false);
      }
    };
    loadManifest();
  }, []);

  // Derived filtered list — no intermediate useState that can get stale
  const filteredScripts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = allScripts;
    if (q) {
      result = result.filter(s =>
        getDisplayName(s).toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    }
    return result.filter(s => s.category === category);
  }, [category, searchQuery, allScripts, language]);

  // Reset page when filtered results change
  useEffect(() => {
    setPage(1);
  }, [category, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredScripts.length / itemsPerPage));
  const pagedScripts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredScripts.slice(start, start + itemsPerPage);
  }, [page, filteredScripts, itemsPerPage]);

  const handleScriptClick = (script: RepoScript) => {
    navigate(`/repo/preview?json=${encodeURIComponent(script.jsonUrl)}&category=${category}`);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Back button and language switcher */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{
              color: THEME_COLORS.paper.primary,
            }}
          >
            {t('repo.backToGenerator')}
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => navigate('/image-gen')}
              sx={{
                borderColor: '#9c27b0',
                color: '#9c27b0',
                '&:hover': {
                  borderColor: '#7b1fa2',
                  backgroundColor: 'rgba(156, 39, 176, 0.08)',
                },
              }}
            >
              {t('imageGen.nav.imageGen')}
            </Button>
            <LanguageSwitcher />
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            mb: 1,
            color: THEME_COLORS.paper.primary,
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
          }}
        >
          {t('repo.title')}
        </Typography>

        <Typography
          sx={{
            textAlign: 'center',
            mb: 4,
            color: THEME_COLORS.paper.secondary,
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          {t('repo.subtitle')}
        </Typography>

        {/* Category and search */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant={category === 'official' ? 'contained' : 'outlined'}
            onClick={() => handleCategoryChange('official')}
            sx={{
              minWidth: '120px',
              bgcolor: category === 'official' ? THEME_COLORS.good : 'transparent',
              color: category === 'official' ? '#fff' : THEME_COLORS.good,
              borderColor: THEME_COLORS.good,
              '&:hover': {
                bgcolor: category === 'official' ? THEME_COLORS.good : 'rgba(76, 175, 80, 0.08)',
                borderColor: THEME_COLORS.good,
              },
            }}
          >
            {t('repo.categoryOfficial')}
          </Button>
          <Button
            variant={category === 'official_mix' ? 'contained' : 'outlined'}
            onClick={() => handleCategoryChange('official_mix')}
            sx={{
              minWidth: '120px',
              bgcolor: category === 'official_mix' ? '#0078ba' : 'transparent',
              color: category === 'official_mix' ? '#fff' : '#0078ba',
              borderColor: '#0078ba',
              '&:hover': {
                bgcolor: category === 'official_mix' ? '#005a8c' : 'rgba(0, 120, 186, 0.08)',
                borderColor: '#0078ba',
              },
            }}
          >
            {t('repo.categoryOfficialMix')}
          </Button>
          <Button
            variant={category === 'custom' ? 'contained' : 'outlined'}
            onClick={() => handleCategoryChange('custom')}
            sx={{
              minWidth: '120px',
              bgcolor: category === 'custom' ? '#ff9800' : 'transparent',
              color: category === 'custom' ? '#fff' : '#ff9800',
              borderColor: '#ff9800',
              '&:hover': {
                bgcolor: category === 'custom' ? '#f57c00' : 'rgba(255, 152, 0, 0.08)',
                borderColor: '#ff9800',
              },
            }}
          >
            {t('repo.categoryCustom')}
          </Button>
        </Box>

        <Box sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('repo.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: THEME_COLORS.gray,
                },
                '&:hover fieldset': {
                  borderColor: THEME_COLORS.good,
                },
                '&.Mui-focused fieldset': {
                  borderColor: THEME_COLORS.good,
                },
              },
            }}
          />
        </Box>

        {/* Script list */}
        {!loading && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {pagedScripts.map((script) => (
              <Card
                key={script.jsonUrl}
                sx={{
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleScriptClick(script)}
                  sx={{ height: '100%', p: 2 }}
                >
                  <CardContent>
                    {script.logo && (
                      <CardMedia
                        component="img"
                        image={script.logo}
                        alt={getDisplayName(script)}
                        sx={{
                          height: 120,
                          objectFit: 'contain',
                          mb: 1,
                          borderRadius: 1,
                          backgroundColor: '#fff',
                        }}
                      />
                    )}
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        color: THEME_COLORS.paper.primary,
                        fontSize: { xs: '1.2rem', sm: '1.4rem' },
                      }}
                    >
                      {getDisplayName(script)}
                    </Typography>
                    <Typography
                      sx={{
                        color: THEME_COLORS.good,
                        mb: 1.5,
                        fontSize: '0.9rem',
                      }}
                    >
                      {t('repo.author')}：{script.author}
                    </Typography>
                    <Typography
                      sx={{
                        color: THEME_COLORS.paper.secondary,
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {script.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}

        {/* No results message */}
        {!loading && filteredScripts.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
            }}
          >
            <Typography
              sx={{
                color: THEME_COLORS.gray,
                fontSize: '1.1rem',
              }}
            >
              {t('repo.noResults')}
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        {!loading && filteredScripts.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
            />
          </Box>
        )}
      </Container>
    </Box>
  );
});

export default ScriptRepository;
