import { Box, Typography, Divider } from '@mui/material';
import type { Character } from '../types';
import { uiConfigStore } from '../stores/UIConfigStore';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../utils/i18n';
import { getTeamColor, THEME_COLORS } from '../theme/colors';
import CharacterImage from './CharacterImage';

interface Props {
  characters: Character[];
  mode: 'firstNight' | 'otherNight';
}


function groupByNightOrder(
  characters: Character[],
  type: 'firstNight' | 'otherNight',
  reminderField: 'firstNightReminder' | 'otherNightReminder',
) {
  const groups = new Map<number, Character[]>();

  characters
    .filter(
      (c) =>
        c[type] > 0 &&
        c[reminderField] &&
        c[reminderField].trim() !== '',
    )
    .sort((a, b) => a[type] - b[type])
    .forEach((character) => {
      const order = character[type];

      if (!groups.has(order)) {
        groups.set(order, []);
      }

      groups.get(order)!.push(character);
    });

  return Array.from(groups.entries());
}

export default observer(function StorytellerNightOrderSheet({
  characters,
  mode,
}: Props) {
  const config = uiConfigStore.config.storytellerNightSheet;
  const { t } = useTranslation();

  const reminderField =
    mode === 'firstNight'
      ? 'firstNightReminder'
      : 'otherNightReminder';

  const sectionLabel =
    mode === 'firstNight'
      ? t('firstNightReminder')
      : t('otherNightReminder');

  const groups = groupByNightOrder(
    characters,
    mode,
    reminderField,
  );

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);
  const baseTextSize = clamp(config.textSize || 1.02, 0.9, 1.02);
  const nameFontSize = `${baseTextSize * 1.12}rem`;
  const reminderTextSize = clamp(
    config.reminderFontSize || baseTextSize * 0.96,
    0.9,
    Math.min(baseTextSize, 1),
  );
  const reminderFontSize = `${reminderTextSize}rem`;
  const entryGap = `${clamp(config.spacing || 1, 0.7, 1) * 0.5}rem`;
  const groupGap = `${clamp(config.groupGap || 1, 0.7, 1) * 0.34}rem`;
  const iconSizePx = `${clamp(config.iconSize || 1.6, 1.25, 1.6) * 36}px`;

  if (groups.length === 0) return null;

  return (
    <Box
      className="storyteller-nightorder-sheet"
      sx={{
        position: 'relative',
        zIndex: 2,
        px: { xs: '10px', sm: '14px', md: '18px' },
        pb: { xs: 1.25, md: 1.75 },
        color: THEME_COLORS.text.primary,
      }}
    >
      {/* Section label with side dividers */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mx: { xs: 0.5, sm: 1.25 },
          mb: { xs: '0.62rem', md: '0.72rem' },
          position: 'relative',
          zIndex: 3,
        }}
      >
        <Divider
          sx={{
            flex: 1,
            borderColor: THEME_COLORS.paper,
            borderWidth: 1,
            position: 'relative',
            zIndex: 0,
          }}
        />
        <Typography
          sx={{
            position: 'relative',
            zIndex: 1,
            fontFamily: uiConfigStore.config.fonts.teamDivider,
            fontWeight: 'bold',
            color: THEME_COLORS.paper.primary,
            textAlign: 'center',
            fontSize: { xs: '0.92rem', sm: '1.02rem', md: '1.14rem' },
            lineHeight: 1.05,
            px: { xs: 1, md: 1.5 },
            backgroundColor: 'rgba(247, 241, 221, 0.72)',
            borderRadius: '999px',
          }}
        >
          {sectionLabel}
        </Typography>
        <Divider
          sx={{
            flex: 1,
            borderColor: THEME_COLORS.paper,
            borderWidth: 1,
            position: 'relative',
            zIndex: 0,
          }}
        />
      </Box>

      <Box
        component="section"
        className="storyteller-nightorder-list"
        sx={{
          columnCount: 1,
          columnGap: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {groups.map(([order, characters]) => (
          <div
            key={order}
            className="storyteller-nightorder-group"
            style={{
              breakInside: 'avoid',
              pageBreakInside: 'avoid',
              marginBottom: groupGap,
            }}
          >
            {characters.map((character) => (
              <div
                key={character.id}
                className="storyteller-nightorder-entry"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: entryGap,
                  paddingLeft: 'clamp(2px, 0.7vw, 8px)',
                  paddingRight: 'clamp(2px, 0.55vw, 6px)',
                  marginBottom: '0.42rem',
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid',
                }}
              >
                <CharacterImage
                  src={character.image}
                  alt={character.name}
                  sx={{
                    width: iconSizePx,
                    height: iconSizePx,
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                />

                <div
                  className="storyteller-nightorder-content"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    className="storyteller-nightorder-name"
                    style={{
                      fontWeight: 'bold',
                      fontFamily: uiConfigStore.config.fonts.characterName,
                      color: getTeamColor(character.team, character.teamColor),
                      fontSize: nameFontSize,
                      lineHeight: 1.06,
                      marginBottom: '0.12rem',
                    }}
                  >
                    {character.name}
                  </div>

                  <div
                    className="storyteller-nightorder-text"
                    style={{
                      fontFamily: uiConfigStore.config.fonts.characterAbility,
                      fontSize: reminderFontSize,
                      lineHeight: 1.3,
                      color: THEME_COLORS.text.primary,
                    }}
                  >
                    {character[reminderField]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </Box>
    </Box>
  );
});
