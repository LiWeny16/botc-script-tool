import React from 'react';
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

  if (groups.length === 0) return null;

  return (
    <div
      className="storyteller-nightorder-sheet"
      style={{
        paddingLeft: '20px',
        paddingRight: '20px',
      }}
    >
      {/* Section label with side dividers */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mx: '20px',
          mb: '1.2rem',
        }}
      >
        <Divider
          sx={{
            flex: 1,
            borderColor: THEME_COLORS.paper,
            borderWidth: 1,
          }}
        />
        <Typography
          sx={{
            fontFamily: uiConfigStore.config.fonts.teamDivider,
            fontWeight: 'bold',
            color: THEME_COLORS.paper.primary,
            textAlign: 'center',
            fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
            px: 2,
          }}
        >
          {sectionLabel}
        </Typography>
        <Divider
          sx={{
            flex: 1,
            borderColor: THEME_COLORS.paper,
            borderWidth: 1,
          }}
        />
      </Box>

      <section>
        {groups.map(([order, characters]) => (
          <div key={order} className="storyteller-nightorder-group">
            {characters.map((character) => (
              <div
                key={character.id}
                className="storyteller-nightorder-entry"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '12px',
                  paddingLeft: '20px',
                  marginBottom: '0.5rem',
                }}
              >
                <CharacterImage
                  src={character.image}
                  alt={character.name}
                  sx={{
                    width: `${config.iconSize * 40}px`,
                    height: `${config.iconSize * 40}px`,
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
                      fontSize: config.textSize > 0 ? `${config.textSize}rem` : '1rem',
                      marginBottom: '0.15rem',
                    }}
                  >
                    {character.name}
                  </div>

                  <div
                    className="storyteller-nightorder-text"
                    style={{
                      fontFamily: uiConfigStore.config.fonts.characterAbility,
                      fontSize: config.textSize > 0 ? `${config.textSize * 0.85}rem` : '0.85rem',
                    }}
                  >
                    {character[reminderField]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
});