import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DataObjectIcon from '@mui/icons-material/DataObject';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTranslation } from '../utils/i18n';
import { alertSuccess, alertError } from '../utils/alert';

/**
 * Small dependency-free JSON editor.
 *
 * The visible text is a syntax-highlighted `<pre>`; a transparent `<textarea>` sits on top
 * of it and owns editing, caret and selection. Both use identical typography and wrapping,
 * and both live in normal flow inside one scroll container, so they can never drift apart.
 */

const MONO_FONT = '"Cascadia Code", "Fira Code", "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';
const FONT_SIZE = 12.5;
const LINE_HEIGHT = 19;
const PADDING_X = 12;
const PADDING_Y = 10;

const TOKEN_PATTERN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

export interface JsonParseFailure {
  message: string;
  line: number;
  column: number;
  hint: string;
}

const parseFailure = (value: string): JsonParseFailure | null => {
  if (!value.trim()) return null;
  try {
    JSON.parse(value);
    return null;
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const positionMatch = /position\s+(\d+)/i.exec(raw);
    const lineColumnMatch = /line\s+(\d+)\s+column\s+(\d+)/i.exec(raw);
    const position = positionMatch ? Number(positionMatch[1]) : -1;

    let line = 1;
    let column = 1;
    if (lineColumnMatch) {
      line = Number(lineColumnMatch[1]);
      column = Number(lineColumnMatch[2]);
    } else if (position >= 0) {
      const upto = value.slice(0, Math.min(position, value.length));
      const lines = upto.split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    let hintKey = 'jsonEditorErrGeneric';
    if (/unterminated|bad control character|expected ':' after property/i.test(raw)) hintKey = 'jsonEditorErrString';
    else if (/unexpected end|end of json input|end of data|unexpected end of/i.test(raw)) hintKey = 'jsonEditorErrIncomplete';
    else if (/property names must be double-quoted|expected property name|expected double-quoted/i.test(raw)) hintKey = 'jsonEditorErrKey';
    else if (/" expected|expected ','|expected '\}'|expected '\]'|after (array element|object)|unexpected (token|non-whitespace)/i.test(raw)) hintKey = 'jsonEditorErrComma';

    return { message: raw, line, column, hint: hintKey };
  }
};

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Notified whenever the validity of the buffer changes (null = valid). */
  onChangeValidity?: (failure: { line: number; column: number; hint: string } | null) => void;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  accentColor?: string;
  /** Hide the validity chip + format/copy buttons when space is tight. */
  dense?: boolean;
}

export default function JsonEditor({
  value,
  onChange,
  onChangeValidity,
  disabled = false,
  ariaLabel,
  placeholder,
  minHeight = 150,
  maxHeight = 420,
  accentColor,
  dense = false,
}: JsonEditorProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastErrorLine = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);

  const failure = useMemo(() => parseFailure(value), [value]);

  useEffect(() => {
    onChangeValidity?.(failure ? { line: failure.line, column: failure.column, hint: failure.hint } : null);
  }, [failure, onChangeValidity]);

  // Keep the offending line in view when the syntax error moves.
  useEffect(() => {
    const line = failure?.line ?? null;
    if (line === null || line === lastErrorLine.current) {
      lastErrorLine.current = line;
      return;
    }
    lastErrorLine.current = line;

    const container = scrollRef.current;
    if (!container) return;
    const lineTop = (line - 1) * LINE_HEIGHT;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    if (lineTop < visibleTop || lineTop + LINE_HEIGHT > visibleBottom) {
      container.scrollTo({ top: Math.max(0, lineTop - LINE_HEIGHT * 2), behavior: 'smooth' });
    }
  }, [failure]);

  const tokens = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;
    TOKEN_PATTERN.lastIndex = 0;

    for (let match = TOKEN_PATTERN.exec(value); match; match = TOKEN_PATTERN.exec(value)) {
      if (match.index > lastIndex) nodes.push(value.slice(lastIndex, match.index));

      const [full, stringToken, colonToken, literalToken, numberToken] = match;
      if (stringToken !== undefined) {
        const isKey = colonToken !== undefined;
        nodes.push(
          <span key={`s${key++}`} style={{ color: isKey ? '#0b6fb8' : '#1a7f5a', fontWeight: isKey ? 650 : 500 }}>
            {stringToken}
          </span>,
        );
        if (colonToken) nodes.push(<span key={`c${key++}`} style={{ color: '#8894a0' }}>{colonToken}</span>);
      } else if (literalToken !== undefined) {
        nodes.push(<span key={`l${key++}`} style={{ color: '#b4520f', fontWeight: 650 }}>{literalToken}</span>);
      } else if (numberToken !== undefined) {
        nodes.push(<span key={`n${key++}`} style={{ color: '#7a4fbd', fontWeight: 600 }}>{numberToken}</span>);
      } else {
        nodes.push(<span key={`p${key++}`} style={{ color: '#8894a0' }}>{full}</span>);
      }

      lastIndex = match.index + full.length;
    }

    if (lastIndex < value.length) nodes.push(value.slice(lastIndex));
    return nodes;
  }, [value]);

  const lineCount = useMemo(() => value.split('\n').length, [value]);
  const lineNumbers = useMemo(() => Array.from({ length: Math.max(lineCount, 1) }, (_, index) => index + 1), [lineCount]);

  const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab' || event.shiftKey) return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${value.slice(0, start)}  ${value.slice(end)}`;
    onChange(next);
    // Restore the caret after React re-renders the controlled textarea.
    requestAnimationFrame(() => {
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    });
  }, [onChange, value]);

  const handleFormat = useCallback(() => {
    try {
      const formatted = JSON.stringify(JSON.parse(value), null, 2);
      onChange(formatted);
      alertSuccess(t('jsonEditorValid'), 1200);
    } catch {
      alertError(t('jsonEditorInvalid'), 1600);
      textareaRef.current?.focus();
    }
  }, [onChange, t, value]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alertError(t('jsonEditorInvalid'), 1200);
    }
  }, [t, value]);

  const accent = accentColor || '#1976d2';
  const typography = {
    fontFamily: MONO_FONT,
    fontSize: FONT_SIZE,
    lineHeight: `${LINE_HEIGHT}px`,
    letterSpacing: 0,
    tabSize: 2,
  } as const;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: failure ? alpha('#c62828', 0.5) : alpha('#101828', 0.12),
        borderRadius: 2,
        backgroundColor: '#fff',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:focus-within': {
          borderColor: alpha(accent, 0.6),
          boxShadow: `0 0 0 3px ${alpha(accent, 0.12)}`,
        },
      }}
    >
      {!dense && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1,
            py: 0.5,
            borderBottom: '1px solid',
            borderColor: alpha('#101828', 0.08),
            backgroundColor: '#fafbfc',
          }}
        >
          <DataObjectIcon sx={{ fontSize: 15, color: alpha('#101828', 0.45) }} />
          {failure ? (
            <Chip
              size="small"
              icon={<ErrorOutlineIcon sx={{ fontSize: 13 }} />}
              label={t('jsonEditorInvalid')}
              sx={{ height: 20, fontSize: 11, backgroundColor: alpha('#c62828', 0.1), color: '#b3261e' }}
            />
          ) : (
            <Chip
              size="small"
              icon={<CheckCircleOutlineIcon sx={{ fontSize: 13 }} />}
              label={t('jsonEditorValid')}
              sx={{ height: 20, fontSize: 11, backgroundColor: alpha('#2e7d32', 0.1), color: '#2e7d32' }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          <Tooltip title={t('jsonEditorCopy')}>
            <Button
              size="small"
              onClick={handleCopy}
              startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
              sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11.5, textTransform: 'none', color: alpha('#101828', 0.65) }}
            >
              {copied ? t('jsonEditorCopied') : t('jsonEditorCopy')}
            </Button>
          </Tooltip>
          <Tooltip title={t('jsonEditorFormat')}>
            <span>
              <Button
                size="small"
                onClick={handleFormat}
                disabled={!!failure || disabled}
                startIcon={<FormatAlignLeftIcon sx={{ fontSize: 14 }} />}
                sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11.5, textTransform: 'none', color: alpha('#101828', 0.65) }}
              >
                {t('jsonEditorFormat')}
              </Button>
            </span>
          </Tooltip>
        </Box>
      )}

      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          maxHeight,
          minHeight,
          overflow: 'auto',
          backgroundColor: '#fff',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 2,
            flex: '0 0 auto',
            py: `${PADDING_Y}px`,
            px: 0.75,
            textAlign: 'right',
            ...typography,
            color: alpha('#101828', 0.28),
            backgroundColor: '#f7f8fa',
            borderRight: '1px solid',
            borderColor: alpha('#101828', 0.08),
            userSelect: 'none',
          }}
        >
          {lineNumbers.map(line => (
            <div
              key={line}
              style={failure && failure.line === line ? { color: '#b3261e', fontWeight: 700 } : undefined}
            >
              {line}
            </div>
          ))}
        </Box>

        <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <pre
            aria-hidden
            style={{
              margin: 0,
              padding: `${PADDING_Y}px ${PADDING_X}px`,
              ...typography,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              color: '#1c2530',
              pointerEvents: 'none',
            }}
          >
            {tokens}
            {'\n'}
          </pre>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            aria-label={ariaLabel}
            placeholder={placeholder}
            style={{
              position: 'absolute',
              inset: 0,
              margin: 0,
              border: 0,
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              padding: `${PADDING_Y}px ${PADDING_X}px`,
              ...typography,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              background: 'transparent',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              caretColor: accent,
              cursor: disabled ? 'default' : 'text',
            }}
          />
        </Box>
      </Box>

      {failure && (
        <Box
          role="alert"
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.75,
            px: 1.25,
            py: 0.75,
            borderTop: '1px solid',
            borderColor: alpha('#c62828', 0.2),
            backgroundColor: alpha('#c62828', 0.06),
            color: '#8c1d18',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 15, mt: '1px', flexShrink: 0 }} />
          <Typography sx={{ fontSize: 11.5, lineHeight: 1.5 }}>
            <strong>
              {t('jsonEditorErrorAt')
                .replace('{line}', String(failure.line))
                .replace('{col}', String(failure.column))}
            </strong>
            {' — '}
            {t(failure.hint as never)}
            <Box component="span" sx={{ display: 'block', mt: 0.25, fontSize: 10.5, opacity: 0.65 }}>
              {failure.message}
            </Box>
          </Typography>
        </Box>
      )}

      {!failure && !dense && (
        <Typography
          sx={{
            px: 1.25,
            py: 0.5,
            fontSize: 11,
            color: alpha('#101828', 0.4),
            borderTop: '1px solid',
            borderColor: alpha('#101828', 0.06),
          }}
        >
          {t('jsonEditorHint')}
        </Typography>
      )}
    </Box>
  );
}

