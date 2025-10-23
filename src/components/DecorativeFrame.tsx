import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface DecorativeFrameProps {
    /**
     * 框内显示的文本内容
     */
    text?: string;
    /**
     * 框的宽度
     */
    width?: string | Record<string, string>;
    /**
     * 框的高度
     */
    height?: string | number;
    /**
     * 容器高度（外层Box）
     */
    containerHeight?: number;
    /**
     * 边框颜色
     */
    borderColor?: string;
    /**
     * 角落装饰颜色
     */
    cornerColor?: string;
    /**
     * 文字颜色
     */
    textColor?: string;
    /**
     * 文字大小
     */
    fontSize?: string | Record<string, string>;
    /**
     * 粒子装饰颜色数组
     */
    particleColors?: string[];
    /**
     * 是否显示装饰性粒子
     */
    showParticles?: boolean;
    /**
     * 是否显示角落装饰
     */
    showCorners?: boolean;
    /**
     * 自定义样式
     */
    sx?: SxProps<Theme>;
    /**
     * 文本前后的装饰符号
     */
    decorativeSymbol?: string;
}

/**
 * 装饰性框架组件
 * 用于显示带有装饰边框、角落元素和可选粒子效果的文本框
 */
export const DecorativeFrame: React.FC<DecorativeFrameProps> = ({
    text = '*代表非首个夜晚',
    width = { xs: "90%", sm: "80%", md: "20%" },
    height = 100,
    containerHeight = 120,
    borderColor = 'transparent',
    cornerColor = '#d4af37',
    textColor = '#000000',
    fontSize = { xs: '0.72rem', sm: '0.78rem', md: '1.2rem' },
    particleColors = ['#d4af37', '#2d5c4f', '#b21e1d'],
    showParticles = true,
    showCorners = true,
    sx = {},
    decorativeSymbol = '✦',
}) => {
    return (
        <Box
            aria-hidden
            sx={{
                width: "100%",
                height: 150,
                // height: containerHeight,
                zIndex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                mt: 2,
                ...sx,
            }}
        >
            {/* 主装饰框 */}
            <Box
                sx={{
                    position: "relative",
                    width: width,
                    height: height,
                    border: `2px solid ${borderColor}`,
                    borderRadius: "16px",
                    backdropFilter: "blur(8px)",
                    boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: "-4px",
                        left: "-4px",
                        right: "-4px",
                        bottom: "-4px",
                        borderRadius: "20px",
                        zIndex: -1,
                        opacity: 0.6,
                    },
                    "&::after": {
                        content: '""',
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        right: "8px",
                        bottom: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        pointerEvents: "none",
                    }
                }}
            >
                {/* 装饰性角落元素 */}
                {showCorners && (
                    <>
                        {/* 左上角 */}
                        <Box
                            sx={{
                                position: "absolute",
                                top: "12px",
                                left: "12px",
                                width: "20px",
                                height: "20px",
                                border: `2px solid ${cornerColor}`,
                                borderRight: "none",
                                borderBottom: "none",
                                borderRadius: "4px 0 0 0",
                            }}
                        />
                        {/* 右上角 */}
                        <Box
                            sx={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                width: "20px",
                                height: "20px",
                                border: `2px solid ${cornerColor}`,
                                borderLeft: "none",
                                borderBottom: "none",
                                borderRadius: "0 4px 0 0",
                            }}
                        />
                        {/* 左下角 */}
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: "12px",
                                left: "12px",
                                width: "20px",
                                height: "20px",
                                border: `2px solid ${cornerColor}`,
                                borderRight: "none",
                                borderTop: "none",
                                borderRadius: "0 0 0 4px",
                            }}
                        />
                        {/* 右下角 */}
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: "12px",
                                right: "12px",
                                width: "20px",
                                height: "20px",
                                border: `2px solid ${cornerColor}`,
                                borderLeft: "none",
                                borderTop: "none",
                                borderRadius: "0 0 4px 0",
                            }}
                        />
                    </>
                )}

                {/* 中心内容 */}
                <Box
                    sx={{
                        textAlign: "center",
                        position: "relative",
                        zIndex: 2,
                    }}
                >
                    <Typography
                        sx={{
                            color: textColor,
                            fontSize: fontSize,
                            lineHeight: 1.2,
                            letterSpacing: '0.02em',
                            m: 0,
                            fontWeight: 500,
                            position: "relative",
                            "&::before": decorativeSymbol ? {
                                content: `"${decorativeSymbol}"`,
                                position: "absolute",
                                left: "-24px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: cornerColor,
                                fontSize: "0.8em",
                            } : undefined,
                            "&::after": decorativeSymbol ? {
                                content: `"${decorativeSymbol}"`,
                                position: "absolute",
                                right: "-24px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: cornerColor,
                                fontSize: "0.8em",
                            } : undefined,
                        }}
                    >
                        {text}
                    </Typography>
                </Box>
            </Box>

            {/* 背景装饰粒子 */}
            {showParticles && particleColors.length > 0 && (
                <>
                    <Box
                        sx={{
                            position: "absolute",
                            top: "20%",
                            left: "10%",
                            width: "4px",
                            height: "4px",
                            background: particleColors[0],
                            borderRadius: "50%",
                            opacity: 0.6,
                            boxShadow: `0 0 8px ${particleColors[0]}`,
                        }}
                    />
                    {particleColors[1] && (
                        <Box
                            sx={{
                                position: "absolute",
                                top: "60%",
                                right: "15%",
                                width: "3px",
                                height: "3px",
                                background: particleColors[1],
                                borderRadius: "50%",
                                opacity: 0.5,
                                boxShadow: `0 0 6px ${particleColors[1]}`,
                            }}
                        />
                    )}
                    {particleColors[2] && (
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: "30%",
                                left: "20%",
                                width: "2px",
                                height: "2px",
                                background: particleColors[2],
                                borderRadius: "50%",
                                opacity: 0.4,
                                boxShadow: `0 0 4px ${particleColors[2]}`,
                            }}
                        />
                    )}
                </>
            )}
        </Box>
    );
};
