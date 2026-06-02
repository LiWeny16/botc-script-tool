import { useState } from 'react';
import { Box, Typography, IconButton, Collapse, alpha } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CodeIcon from '@mui/icons-material/Code';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../utils/i18n';
import MarkdownIt from 'markdown-it';
import type { AgentMessage, AgentToolCall } from '../../stores/AgentStore';
import { agentAccent, agentAccentDark, agentBgElevated } from './agentStyles';

const md = new MarkdownIt({ breaks: true, html: false, linkify: false });

interface AgentBubbleProps {
  message: AgentMessage;
}

const bubbleAnim = {
  initial: { opacity: 0, y: 8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.2, ease: 'easeOut' as const },
};

function ToolCallPanel({ tc }: { tc: AgentToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const inputStr = typeof tc.toolInput === 'string' ? tc.toolInput : JSON.stringify(tc.toolInput, null, 2);
  const resultStr = tc.toolResult != null
    ? (typeof tc.toolResult === 'string' ? tc.toolResult : JSON.stringify(tc.toolResult, null, 2))
    : '...';

  return (
    <Box sx={{ mb: 0.75 }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          px: 1.2,
          py: 0.4,
          borderRadius: 2,
          bgcolor: alpha(agentAccent, 0.07),
          border: `1px solid ${alpha(agentAccent, 0.15)}`,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { bgcolor: alpha(agentAccent, 0.12) },
          transition: 'background 0.15s',
        }}
      >
        <CodeIcon sx={{ fontSize: 13, color: agentAccent }} />
        <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: agentAccent }}>
          {tc.toolName}
        </Typography>
        <KeyboardArrowDownIcon
          sx={{
            fontSize: 14,
            color: alpha(agentAccent, 0.6),
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </Box>
      <Collapse in={expanded}>
        <Box
          sx={{
            mt: 0.5,
            px: 1.2,
            py: 0.8,
            borderRadius: 1.5,
            bgcolor: alpha('#000', 0.03),
            border: `1px solid ${alpha('#000', 0.06)}`,
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: alpha('#000', 0.45), fontWeight: 600 }}>
            INPUT
          </Typography>
          <Typography
            component="pre"
            sx={{
              fontSize: '0.7rem',
              m: 0,
              mt: 0.2,
              mb: 1,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
            }}
          >
            {inputStr.length > 500 ? inputStr.slice(0, 500) + '...' : inputStr}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: alpha('#000', 0.45), fontWeight: 600 }}>
            OUTPUT
          </Typography>
          <Typography
            component="pre"
            sx={{
              fontSize: '0.7rem',
              m: 0,
              mt: 0.2,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              color: tc.toolResult == null ? alpha('#000', 0.3) : 'inherit',
            }}
          >
            {resultStr.length > 800 ? resultStr.slice(0, 800) + '...' : resultStr}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

const AgentBubble = observer(({ message }: AgentBubbleProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.streaming;
  const isError = message.isError === true;
  const hasToolCalls = !isUser && !!message.toolCalls?.length;
  const showBubble = isUser || !!message.content || isStreaming || hasToolCalls;

  const renderedHtml = (() => {
    if (isUser || !message.content) return null;
    return md.render(message.content);
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <Box
      component={motion.div}
      {...bubbleAnim}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
        px: 0.5,
      }}
    >
      {/* Inline tool call panels (assistant messages only) */}
      {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
        <Box sx={{ mb: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {message.toolCalls.map(tc => (
            <ToolCallPanel key={tc.toolCallId} tc={tc} />
          ))}
        </Box>
      )}

      {/* Bubble */}
      {showBubble && (
        <Box
          sx={{
            maxWidth: '90%',
            px: 1.8,
            py: 1.2,
            borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
            bgcolor: isUser
              ? agentAccentDark
              : isError
                ? '#ffebee'
                : agentBgElevated,
            color: isUser ? '#fff' : isError ? '#c62828' : '#1a1a1a',
            border: isUser ? 'none' : `1px solid ${alpha('#000', 0.06)}`,
            boxShadow: isUser
              ? `0 2px 8px ${alpha(agentAccentDark, 0.3)}`
              : '0 1px 6px rgba(0,0,0,0.04)',
            wordBreak: 'break-word',
          }}
        >
          {isUser ? (
            <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          ) : message.content ? (
            <Box
              className="agent-markdown"
              dangerouslySetInnerHTML={{ __html: renderedHtml || '' }}
              sx={{
                fontSize: '0.85rem',
                lineHeight: 1.6,
                '& p': { m: 0, '& + p': { mt: 0.5 } },
                '& h1,h2,h3': { fontSize: '0.95rem', fontWeight: 700, mt: 0.8, mb: 0.3 },
                '& ul,ol': { m: 0, pl: 2.5, '& li': { mb: 0.15 } },
                '& code': { fontSize: '0.78rem', px: 0.4, py: 0.15, borderRadius: 0.5, bgcolor: alpha('#000', 0.06) },
                '& pre': { fontSize: '0.78rem', p: 1, borderRadius: 1, bgcolor: alpha('#000', 0.04), overflow: 'auto', maxHeight: 200 },
                '& blockquote': { m: 0, pl: 1, borderLeft: `3px solid ${alpha(agentAccent, 0.3)}`, color: alpha('#000', 0.65) },
                '& table': { fontSize: '0.78rem', borderCollapse: 'collapse', '& th,td': { px: 1, py: 0.4, border: `1px solid ${alpha('#000', 0.1)}` } },
                '& a': { color: agentAccent },
              }}
            />
          ) : isStreaming ? (
            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: alpha('#000', 0.45), fontStyle: 'italic' }}>
              {t('agent.streamingHint')}
            </Typography>
          ) : null}

          {/* Streaming cursor */}
          {isStreaming && message.content && (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: 8,
                height: 16,
                bgcolor: agentAccent,
                ml: 0.25,
                verticalAlign: 'text-bottom',
                animation: 'blink 0.9s infinite',
                '@keyframes blink': {
                  '0%, 50%': { opacity: 1 },
                  '51%, 100%': { opacity: 0.3 },
                },
              }}
            />
          )}
        </Box>
      )}

      {/* Copy button (assistant, non-streaming, non-empty) */}
      {!isUser && !isStreaming && message.content && (
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{
            mt: 0.3,
            ml: 0.5,
            p: 0.3,
            color: copied ? '#4caf50' : alpha('#000', 0.25),
            '&:hover': { color: alpha('#000', 0.5), bgcolor: 'transparent' },
            transition: 'color 0.2s',
          }}
        >
          {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
        </IconButton>
      )}
    </Box>
  );
});

export default AgentBubble;
