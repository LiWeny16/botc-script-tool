import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Snackbar,
    Alert,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { scriptStore } from '../../stores/ScriptStore';
import { deepStripHtml } from '../../utils/richTextEditorUtils';

// 1. 定义 props 的 TypeScript 接口
interface ExportJsonDialogProps {
    /**
     * 对话框是否打开
     */
    open: boolean;
    /**
     * 关闭对话框的回调函数
     */
    onClose: () => void;
    /**
     * "导出原始JSON" 的点击处理函数
     */
    onExportOriginal: () => void;
    /**
     * "导出当前语言" 的点击处理函数
     */
    onExportCurrentLanguage: () => void;
    /**
     * "导出仅ID" 的点击处理函数
     */
    onExportIdOnly: () => void;
    /**
     * 国际化 (i18n) 的 t 函数
     * (这里使用了通用的类型，你也可以从 i18next 导入 TFunction 类型)
     */
    t: (key: string) => string;
}

/**
 * Copy text to clipboard with fallback for environments without clipboard API.
 */
async function copyTextToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

/**
 * 导出JSON的通用对话框组件
 */
const ExportJsonDialog: React.FC<ExportJsonDialogProps> = ({
    open,
    onClose,
    onExportOriginal,
    onExportCurrentLanguage,
    onExportIdOnly,
    t,
}) => {
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopyOriginalJson = async () => {
        try {
            const rawJson = scriptStore.originalJson;
            if (!rawJson) return;
            const parsed = JSON.parse(rawJson);
            const cleaned = deepStripHtml(parsed);
            const jsonString = JSON.stringify(cleaned, null, 2);
            await copyTextToClipboard(jsonString);
            setCopySuccess(true);
        } catch (error) {
            console.error('Failed to copy original JSON:', error);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose} // 使用传入的onClose
            disableScrollLock={true}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    pb: 2,
                    pt: 3,
                    px: 3,
                }}
            >
                <InfoIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                    {t('dialog.exportJsonTitle')}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ px: 3, pb: 3 }}>
                <Typography variant="body2" sx={{ color: '#666', mb: 3, lineHeight: 1.7 }}>
                    {t('dialog.exportJsonMessage')}
                </Typography>

                {/* 选项1: 原始JSON */}
                <Box
                    sx={{
                        mb: 2,
                        p: 2.5,
                        borderRadius: 2,
                        border: '2px solid #fff3e0',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: '#ff9800',
                            backgroundColor: '#fff3e0',
                        },
                    }}
                    onClick={onExportOriginal} // 使用传入的处理函数
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ff9800', mb: 1 }}>
                        {t('dialog.exportOriginalJson')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                        {t('dialog.exportOriginalJsonDesc')}
                    </Typography>
                </Box>

                {/* 选项2: 当前语言 */}
                <Box
                    sx={{
                        mb: 2,
                        p: 2.5,
                        borderRadius: 2,
                        border: '2px solid #e3f2fd',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: '#1976d2',
                            backgroundColor: '#e3f2fd',
                        },
                    }}
                    onClick={onExportCurrentLanguage} // 使用传入的处理函数
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
                        {t('dialog.exportCurrentLangJson')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                        {t('dialog.exportCurrentLangJsonDesc')}
                    </Typography>
                </Box>

                {/* 选项3: 仅官方ID */}
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: '2px solid #e8f5e9',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: '#4caf50',
                            backgroundColor: '#e8f5e9',
                        },
                    }}
                    onClick={onExportIdOnly} // 使用传入的处理函数
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                        {t('dialog.exportIdOnly')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                        {t('dialog.exportIdOnlyDesc')}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2.5, backgroundColor: '#fafafa', justifyContent: 'space-between' }}>
                <Button
                    onClick={handleCopyOriginalJson}
                    disabled={!scriptStore.originalJson}
                    startIcon={<ContentCopyIcon />}
                    sx={{
                        px: 3,
                        py: 1,
                        fontWeight: 500,
                        color: '#ff9800',
                        borderColor: '#ff9800',
                        '&:hover': {
                            backgroundColor: '#fff3e0',
                            borderColor: '#ff9800',
                        },
                    }}
                    variant="outlined"
                >
                    {copySuccess ? 'Copied!' : 'Copy Original JSON'}
                </Button>
                <Button
                    onClick={onClose} // "取消"按钮也使用传入的onClose
                    sx={{
                        px: 3,
                        py: 1,
                        fontWeight: 500,
                        color: '#757575',
                        '&:hover': {
                            backgroundColor: '#eeeeee',
                        },
                    }}
                >
                    {t('common.cancel')}
                </Button>
            </DialogActions>
            <Snackbar
                open={copySuccess}
                autoHideDuration={2000}
                onClose={() => setCopySuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setCopySuccess(false)}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {t('input.jsonCopied')}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default ExportJsonDialog;