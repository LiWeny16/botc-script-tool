import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  createTheme,
  ThemeProvider,
  CssBaseline,
  GlobalStyles,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { observer } from 'mobx-react-lite';
import { buildAllCharactersScript } from '../utils/allCharactersScript';
import ScriptRenderer from '../components/ScriptRenderer';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { THEME_COLORS, getTeamColor } from '../theme/colors';
import type { Script } from '../types';

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
});

const TEAM_ORDER = ['townsfolk', 'outsider', 'minion', 'demon'] as const;

const AllCharacters = observer(() => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  const script: Script = useMemo(
    () => buildAllCharactersScript(language),
    [language],
  );

  // Group character names by team for the summary
  const teamSummaries = useMemo(() => {
    return TEAM_ORDER.map((team) => {
      const chars = script.characters[team] || [];
      return {
        team,
        count: chars.length,
        names: chars.map((c) => c.name).join(', '),
        color: getTeamColor(team),
      };
    });
  }, [script]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          '@media print': {
            '#all-chars-summary': { display: 'none !important' },
            '#all-chars-controls': { display: 'none !important' },
            '#all-chars-header': { display: 'none !important' },
            // Override print.css absolute positioning so full multi-page content prints
            '#script-preview': {
              position: 'relative !important' as any,
              height: 'auto !important',
              minHeight: 'auto !important',
              pageBreakInside: 'auto !important',
              breakInside: 'auto !important',
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
            },
            // Ensure all children allow page breaks
            '#script-preview *': {
              pageBreakInside: 'auto !important',
              breakInside: 'auto !important',
            },
            // Night order strips stay in normal flex flow so they paginate naturally
            '#night-order-left': {
              width: '36px !important',
              flexShrink: '0 !important',
              padding: '0 !important',
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
            },
            '#night-order-left > *': {
              padding: '0 !important',
            },
            '#night-order-right': {
              width: '36px !important',
              flexShrink: '0 !important',
              padding: '0 !important',
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
            },
            '#night-order-right > *': {
              padding: '0 !important',
            },
            '#main_script': {
              marginLeft: '0 !important',
              marginRight: '0 !important',
              paddingLeft: '0 !important',
              paddingRight: '0 !important',
              backgroundColor: '#EDE4D5 !important',
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
            },
          },
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top control bar */}
        <Box
          id="all-chars-controls"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(254, 250, 240, 0.95)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            py: 1,
            gap: 1.5,
          }}
        >
          <IconButton
            onClick={() => navigate('/')}
            size="small"
            sx={{ color: THEME_COLORS.paper.secondary }}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            id="all-chars-header"
            sx={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: THEME_COLORS.paper.primary,
              mx: 1,
            }}
          >
            {t('app.allCharacters')}
          </Typography>
          <IconButton
            onClick={() => window.print()}
            size="small"
            sx={{ color: THEME_COLORS.paper.primary }}
            aria-label="print"
          >
            <PrintIcon />
          </IconButton>
          <LanguageSwitcher />
        </Box>

        {/* Summary list */}
        <Box id="all-chars-summary" sx={{ px: 2, pt: 1 }}>
          <Accordion
            expanded={summaryExpanded}
            onChange={() => setSummaryExpanded(!summaryExpanded)}
            sx={{
              backgroundColor: 'rgba(254, 250, 240, 0.6)',
              boxShadow: 'none',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 1,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem' }} />}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                {t('allChars.title')} — {teamSummaries.reduce((s, t) => s + t.count, 0)} {t('allChars.totalCount')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {teamSummaries.map((ts) => (
                <Box key={ts.team} sx={{ mb: 0.3 }}>
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.65rem', fontWeight: 700, color: ts.color, mr: 0.5 }}
                  >
                    {t(`team.${ts.team}`)} ({ts.count}):
                  </Typography>
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.6rem', color: THEME_COLORS.text.tertiary, lineHeight: 1.5 }}
                  >
                    {ts.names}
                  </Typography>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Script renderer in super-compact mode */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            backgroundColor: 'background.default',
            '@media print': { minHeight: 'auto' },
          }}
        >
          <Box sx={{ width: '100%' }}>
            <ScriptRenderer
              script={script}
              theme={theme}
              readOnly={true}
              compact={true}
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
});

export default AllCharacters;
