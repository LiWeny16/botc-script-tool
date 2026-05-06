import { Box, Typography, Container, Chip, Stack } from '@mui/material';
import { useTranslation } from '../utils/i18n';
import type { TranslationKey } from '../utils/map';

interface ChangeEntry {
  date: string;
  category: 'feature' | 'improvement' | 'fix';
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

const CHANGES: ChangeEntry[] = [
  {
    date: '2026-05-06',
    category: 'improvement',
    titleKey: 'changelog.seoGEO',
    descKey: 'changelog.seoGEODesc',
  },
  {
    date: '2026-05-06',
    category: 'improvement',
    titleKey: 'changelog.dataAttribution',
    descKey: 'changelog.dataAttributionDesc',
  },
  {
    date: '2026-05-06',
    category: 'feature',
    titleKey: 'changelog.scriptLandingPages',
    descKey: 'changelog.scriptLandingPagesDesc',
  },
  {
    date: '2026-04-30',
    category: 'feature',
    titleKey: 'changelog.customIconUpload',
    descKey: 'changelog.customIconUploadDesc',
  },
  {
    date: '2026-04-30',
    category: 'improvement',
    titleKey: 'changelog.dialogPerf',
    descKey: 'changelog.dialogPerfDesc',
  },
  {
    date: '2026-04-30',
    category: 'feature',
    titleKey: 'changelog.loricChars',
    descKey: 'changelog.loricCharsDesc',
  },
  {
    date: '2026-04-30',
    category: 'improvement',
    titleKey: 'changelog.llmsTxt',
    descKey: 'changelog.llmsTxtDesc',
  },
  {
    date: '2026-04-29',
    category: 'improvement',
    titleKey: 'changelog.perfOptimize',
    descKey: 'changelog.perfOptimizeDesc',
  },
  {
    date: '2026-04-29',
    category: 'fix',
    titleKey: 'changelog.fontFix',
    descKey: 'changelog.fontFixDesc',
  },
  {
    date: '2026-04-29',
    category: 'fix',
    titleKey: 'changelog.swFix',
    descKey: 'changelog.swFixDesc',
  },
];

const catColor: Record<string, string> = {
  feature: '#2e7d32',
  improvement: '#1565c0',
  fix: '#e65100',
};

const catLabel: Record<string, string> = {
  feature: 'Feature',
  improvement: 'Improvement',
  fix: 'Bug Fix',
};

const Changelog = () => {
  const { t } = useTranslation();

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 6 } }}>
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: '#312e81', mb: 1 }}
        >
          {t('changelog.title')}
        </Typography>
        <Typography variant="body1" sx={{ color: '#666' }}>
          {t('changelog.subtitle')}
        </Typography>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute', left: 11, top: 0, bottom: 0, width: 2,
            bgcolor: 'rgba(99, 102, 241, 0.15)',
          }}
        />

        {CHANGES.map((entry) => (
          <Box key={entry.titleKey} sx={{ position: 'relative', pl: 5, pb: 3 }}>
            <Box
              sx={{
                position: 'absolute', left: 2, top: 6,
                width: 18, height: 18, borderRadius: '50%',
                bgcolor: catColor[entry.category], zIndex: 1,
                boxShadow: `0 0 0 4px ${catColor[entry.category]}22`,
              }}
            />
            <Box
              sx={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(249,248,245,0.9) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.12)',
                borderRadius: 3, px: 2.5, py: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#312e81', fontSize: '0.95rem' }}>
                  {t(entry.titleKey)}
                </Typography>
                <Chip
                  label={catLabel[entry.category]}
                  size="small"
                  sx={{ fontSize: '0.7rem', fontWeight: 600, height: 22, bgcolor: catColor[entry.category], color: '#fff' }}
                />
              </Stack>
              <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.7, fontSize: '0.9rem' }}>
                {t(entry.descKey)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                {entry.date}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default Changelog;
