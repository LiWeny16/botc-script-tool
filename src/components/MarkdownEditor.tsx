import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  ToggleButton,
  Typography,
  Paper,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatStrikethrough,
  FormatUnderlined,
  Title,
  FormatListBulleted,
  FormatListNumbered,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import MarkdownRenderer from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  textFieldSx?: object;
  teamColor: string;
  label?: string;
  minRows?: number;
  maxRows?: number;
}

type WrappingStyle = [string, string]; // [prefix, suffix]

const TOOLS: { key: string; icon: React.ReactNode; title: string; wrap: WrappingStyle; shortcut: string }[] = [
  { key: 'bold', icon: <FormatBold fontSize="small" />, title: 'Bold', wrap: ['**', '**'], shortcut: 'Ctrl+B' },
  { key: 'italic', icon: <FormatItalic fontSize="small" />, title: 'Italic', wrap: ['*', '*'], shortcut: 'Ctrl+I' },
  { key: 'underline', icon: <FormatUnderlined fontSize="small" />, title: 'Underline', wrap: ['<u>', '</u>'], shortcut: 'Ctrl+U' },
  { key: 'strikethrough', icon: <FormatStrikethrough fontSize="small" />, title: 'Strikethrough', wrap: ['~~', '~~'], shortcut: 'Ctrl+Shift+S' },
];

const BLOCK_TOOLS: { key: string; icon: React.ReactNode; title: string; prefix: string; shortcut: string }[] = [
  { key: 'heading', icon: <Title fontSize="small" />, title: 'Heading', prefix: '## ', shortcut: 'Ctrl+H' },
  { key: 'ul', icon: <FormatListBulleted fontSize="small" />, title: 'Unordered List', prefix: '- ', shortcut: 'Ctrl+Shift+U' },
  { key: 'ol', icon: <FormatListNumbered fontSize="small" />, title: 'Ordered List', prefix: '1. ', shortcut: 'Ctrl+Shift+O' },
];

const btnSx = {
  width: 30,
  height: 30,
  borderRadius: 1,
  color: '#475467',
  '&:hover': { backgroundColor: alpha('#101828', 0.08), color: '#101828' },
};

export default function MarkdownEditor({
  value,
  onChange,
  disabled = false,
  textFieldSx,
  teamColor,
  label,
  minRows = 4,
  maxRows = 7,
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep a ref to the latest value so keyboard handler doesn't have stale closure
  const valueRef = useRef(value);
  valueRef.current = value;

  const insertWrap = useCallback(([prefix, suffix]: WrappingStyle) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + prefix + suffix);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
    onChange(newText);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      el.focus();
      if (selected) {
        el.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        const pos = start + prefix.length;
        el.setSelectionRange(pos, pos);
      }
    });
  }, [value, onChange]);

  const insertBlock = useCallback((prefix: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + prefix);
      return;
    }
    const start = el.selectionStart;
    // Find the start of the current line
    const beforeCursor = value.substring(0, start);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const linePrefix = value.substring(lineStart, start);
    const newText = value.substring(0, lineStart) + prefix + linePrefix + value.substring(start);
    onChange(newText);
    requestAnimationFrame(() => {
      el.focus();
      const pos = lineStart + prefix.length + (start - lineStart);
      el.setSelectionRange(pos, pos);
    });
  }, [value, onChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || preview) return;
      // Only handle when textarea is focused
      if (document.activeElement !== textareaRef.current) return;

      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'b') { e.preventDefault(); insertWrap(['**', '**']); }
      else if (ctrl && e.key === 'i') { e.preventDefault(); insertWrap(['*', '*']); }
      else if (ctrl && e.key === 'u') { e.preventDefault(); insertWrap(['<u>', '</u>']); }
      else if (ctrl && e.shiftKey && e.key === 'S') { e.preventDefault(); insertWrap(['~~', '~~']); }
      else if (ctrl && e.key === 'h') { e.preventDefault(); insertBlock('## '); }
    };
    const el = textareaRef.current;
    if (el) el.addEventListener('keydown', handleKeyDown);
    return () => { if (el) el.removeEventListener('keydown', handleKeyDown); };
  }, [disabled, preview, insertWrap, insertBlock]);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          px: 0.75,
          py: 0.25,
          mb: 0.75,
          borderRadius: 1.5,
          backgroundColor: alpha('#101828', 0.03),
          border: `1px solid ${alpha('#101828', 0.06)}`,
        }}
      >
        {TOOLS.map(t => (
          <IconButton
            key={t.key}
            size="small"
            disabled={disabled}
            title={`${t.title} (${t.shortcut})`}
            onClick={() => insertWrap(t.wrap)}
            sx={btnSx}
          >
            {t.icon}
          </IconButton>
        ))}
        <Box sx={{ width: 1, height: 18, backgroundColor: alpha('#101828', 0.08), mx: 0.25 }} />
        {BLOCK_TOOLS.map(t => (
          <IconButton
            key={t.key}
            size="small"
            disabled={disabled}
            title={`${t.title} (${t.shortcut})`}
            onClick={() => insertBlock(t.prefix)}
            sx={btnSx}
          >
            {t.icon}
          </IconButton>
        ))}
        <Box sx={{ flex: 1 }} />
        <ToggleButton
          value="preview"
          size="small"
          disabled={disabled}
          selected={preview}
          onChange={() => setPreview(!preview)}
          title={preview ? 'Edit' : 'Preview'}
          sx={{
            width: 30, height: 30, borderRadius: 1, border: 'none',
            color: preview ? teamColor : '#475467',
            '&.Mui-selected': { backgroundColor: alpha(teamColor, 0.1), '&:hover': { backgroundColor: alpha(teamColor, 0.15) } },
          }}
        >
          {preview ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </ToggleButton>
      </Paper>

      {preview ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            minHeight: minRows * 24 + 16,
            borderRadius: 2,
            backgroundColor: '#f4f6f7',
            boxShadow: `inset 0 0 0 1px ${alpha('#101828', 0.06)}, 0 1px 2px ${alpha('#101828', 0.03)}`,
            '& p': { m: 0, '&:not(:last-child)': { mb: 0.5 } },
            '& ul, & ol': { m: 0, pl: 2.5, '&:not(:last-child)': { mb: 0.5 } },
            '& li': { '&:not(:last-child)': { mb: 0.25 } },
            '& h1,h2,h3,h4': { m: 0, fontSize: 15, '&:not(:last-child)': { mb: 0.5 } },
            '& strong': { fontWeight: 700 },
            '& em': { fontStyle: 'italic' },
            '& del, & s': { textDecoration: 'line-through', opacity: 0.7 },
            '& u': { textDecoration: 'underline' },
          }}
        >
          <MarkdownRenderer content={value} />
        </Paper>
      ) : (
        <TextField
          fullWidth
          multiline
          minRows={minRows}
          maxRows={maxRows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          sx={textFieldSx}
          slotProps={{ htmlInput: { ref: textareaRef, 'aria-label': label } }}
        />
      )}
    </Box>
  );
}
