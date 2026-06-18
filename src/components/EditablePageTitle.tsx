import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CharacterImage from './CharacterImage';
import { uiConfigStore } from '../stores/UIConfigStore';

interface Props {
  title: string;
  titleImage?: string;
  useImage?: boolean;
  imageSize?: number;
  fontSize?: string;
  readOnly?: boolean;
  onEdit?: (mode: 'main' | 'firstNight' | 'otherNight') => void;

  textAlignment?: 'left' | 'center' | 'right';
}

export default function EditablePageTitle({
  title,
  titleImage,
  useImage = false,
  imageSize = 160,
  fontSize = '5rem',
  readOnly = false,
  onEdit,
  textAlignment = 'center',
}: Props) {

  const [hovered, setHovered] = useState(false);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent:
          textAlignment === 'left'
            ? 'flex-start'
            : textAlignment === 'right'
            ? 'flex-end'
            : 'center',
        width: '100%',
      }}
    >
      {useImage && titleImage ? (
        <Box
          onMouseEnter={() => !readOnly && setHovered(true)}
          onMouseLeave={() => !readOnly && setHovered(false)}
          onDoubleClick={() => !readOnly && onEdit?.('firstNight')}
          sx={{
            position: 'relative',
            cursor: readOnly ? 'default' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <CharacterImage
            src={titleImage}
            alt={title}
            sx={{
              maxWidth: '100%',
              maxHeight: `${imageSize}px`,
              objectFit: 'contain',
              display: 'block',
            }}
          />

          {!readOnly && hovered && (
            <Box
              sx={{
                position: 'absolute',
                top: 58,
                right: 288,
                zIndex: 9999,
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.('firstNight');
                }}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  zIndex: 9999,
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          onMouseEnter={() => !readOnly && setHovered(true)}
          onMouseLeave={() => !readOnly && setHovered(false)}
          onDoubleClick={() => !readOnly && onEdit?.('otherNight')}
          sx={{
            position: 'relative',
            cursor: readOnly ? 'default' : 'pointer',
            width: '100%',
            display: 'flex',
            justifyContent:
              textAlignment === 'left'
                ? 'flex-start'
                : textAlignment === 'right'
                ? 'flex-end'
                : 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: uiConfigStore.scriptTitleFont,
              fontWeight: 'bold',
              fontSize,
              textAlign: textAlignment,
              whiteSpace: 'pre-wrap',

              background: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {title
              .split(/\n|<br\s*\/?>/)
              .map((line, index, array) => (
                <span key={index}>
                  {line}
                  {index < array.length - 1 && <br />}
                </span>
              ))}
          </Typography>

          {!readOnly && hovered && (
            <Box
              sx={{
                position: 'absolute',
                top: 58,
                right: 288,
                zIndex: 9999,
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.('otherNight');
                }}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  zIndex: 9999,
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}