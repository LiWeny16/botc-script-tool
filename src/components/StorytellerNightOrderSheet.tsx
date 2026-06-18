import React from 'react';
import type { Character } from '../types';
import { uiConfigStore } from '../stores/UIConfigStore';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../utils/i18n';

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
          }}
        >
          {title}
        </h1>

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
                  <div className="storyteller-nightorder-name"
                  style={{
                    fontWeight: 'bold',
                  }}
                  >
                    {character.name}
                  </div>

                  <div className="storyteller-nightorder-text">
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