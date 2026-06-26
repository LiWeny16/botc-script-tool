import React from 'react';
import { Box } from '@mui/material';
import type { Character } from '../types';
import { uiConfigStore } from '../stores/UIConfigStore';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../utils/i18n';
import { getTeamColor } from '../theme/colors';

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

  const title =
    mode === 'firstNight'
      ? t('firstNight')
      : t('otherNight');

  const groups = groupByNightOrder(
    characters,
    mode,
    reminderField,
  );

  return (
    <div
      className="storyteller-nightorder-sheet"
      style={{
        paddingLeft: '20px',
        paddingRight: '20px',
      }}
    >
      <section>
        <h1
          style={{
            fontFamily: uiConfigStore.config.fonts.teamDivider,
            paddingLeft: '20px',
            fontSize: '3rem',
            marginTop: '0px',
            marginBottom: '0.3rem',
          }}
        >
          {title}
        </h1>

        <Box
          component="hr"
          sx={{
            border: 'none',
            borderTop: '2px solid',
            borderColor: 'divider',
            mx: '20px',
            mb: '1.5rem',
            opacity: 0.6,
          }}
        />

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
                <img
                  src={character.image}
                  alt={character.name}
                  className="storyteller-nightorder-icon"
                  style={{
                    width: `${config.iconSize * 40}px`,
                    height: `${config.iconSize * 40}px`,
                    objectFit: 'contain',
                    flexShrink: 0,
                    display: 'block',
                  }}
                />

                <div
                  className="storyteller-nightorder-content"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
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