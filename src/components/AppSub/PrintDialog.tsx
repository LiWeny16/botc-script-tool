import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
} from '@mui/material';
import {
    Print as PrintIcon,
    CheckCircleOutline as CheckIcon,
    InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import React from 'react';

// 定义Props
interface PrintDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    t: (key: string) => string;
    language: string;
}

const PrintDialog: React.FC<PrintDialogProps> = ({ open, onClose, onConfirm, t, language }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            disableScrollLock={true}
            aria-labelledby="print-dialog-title"
            aria-describedby="print-dialog-description"
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                }
            }}
        >
            <DialogTitle
                id="print-dialog-title"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    pb: 2,
                    pt: 3,
                    px: 3,
                }}
            >
                <PrintIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                    {t('dialog.printTitle')}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ px: 3, pb: 2 }}>
                {/* 提示信息 */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 2.5,
                        mb: 3,
                        backgroundColor: '#f0f7ff',
                        borderRadius: 2,
                        border: '1px solid #d0e7ff',
                    }}
                >
                    <InfoIcon sx={{ color: '#1976d2', flexShrink: 0, mt: 0.2, fontSize: 22 }} />
                    <Typography variant="body2" sx={{ color: '#1565c0', lineHeight: 1.7, fontSize: '0.9rem' }}>
                        {t('dialog.printMessage')}
                    </Typography>
                </Box>

                {/* 推荐设置列表 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* 浏览器推荐 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                        <CheckIcon sx={{ color: '#2e7d32', fontSize: 22, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                            {t('dialog.printBrowser')}
                        </Typography>
                    </Box>

                    {/* 设备提示 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                        <CheckIcon sx={{ color: '#2e7d32', fontSize: 22, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                            {t('dialog.printDevice')}
                        </Typography>
                    </Box>

                    {/* 分割线 */}
                    <Box sx={{ my: 1.5, borderTop: '1px solid #e0e0e0' }} />

                    {/* 高级设置标题 */}
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: '#424242',
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            mb: 1.5,
                        }}
                    >
                        {language === 'zh-CN' ? '推荐配置' : 'Recommended Settings'}
                    </Typography>

                    {/* 设置项 */}
                    <Box sx={{
                        backgroundColor: '#fafafa',
                        borderRadius: 2,
                        p: 2.5,
                        border: '1px solid #e0e0e0',
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* 纸张大小 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        minWidth: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: '#757575',
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                                    {t('dialog.printPaper')}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        minWidth: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: '#757575',
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                                    {t('dialog.printScale')}
                                </Typography>
                            </Box>

                            {/* 页边距 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        minWidth: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: '#757575',
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.9rem' }}>
                                    {t('dialog.printMargin')}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5, backgroundColor: '#fafafa' }}>
                <Button
                    onClick={onClose}
                    sx={{
                        px: 3,
                        py: 1,
                        fontWeight: 500,
                        color: '#757575',
                        '&:hover': {
                            backgroundColor: '#eeeeee',
                        }
                    }}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    autoFocus
                    startIcon={<PrintIcon />}
                    sx={{
                        px: 3.5,
                        py: 1,
                        fontWeight: 600,
                        backgroundColor: '#1976d2',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                        '&:hover': {
                            backgroundColor: '#1565c0',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                        }
                    }}
                >
                    {t('dialog.printConfirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PrintDialog;