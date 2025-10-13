import React, { useState, useCallback } from 'react';
import { Box, Avatar } from '@mui/material';

interface CharacterImageProps {
  src: string;
  alt: string;
  sx?: any;
  component?: 'img' | 'avatar';
  fallbackSrc?: string;
  [key: string]: any; // 允许传递其他props
}

// 将clocktower-wiki链接转换为oss备用链接的函数
const getBackupImageUrl = (originalUrl: string): string => {
  try {
    const url = new URL(originalUrl);
    
    // 检查是否是clocktower-wiki域名
    if (url.hostname === 'clocktower-wiki.gstonegames.com') {
      // 从路径中提取文件名
      const pathParts = url.pathname.split('/');
      let filename = pathParts[pathParts.length - 1];
      
      // 处理thumb路径的情况，如 /images/thumb/3/3d/Marionette.png/300px-Marionette.png
      if (pathParts.includes('thumb') && filename.includes('px-')) {
        // 提取原始文件名，去掉尺寸前缀
        const match = filename.match(/\d+px-(.+)/);
        if (match) {
          filename = match[1];
        }
      }
      
      // 去掉文件扩展名，转换为小写
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').toLowerCase();
      
      // 生成oss备用链接
      return `https://oss.gstonegames.com/data_file/clocktower/web/icons/${nameWithoutExt}.png`;
    }
    
    return originalUrl;
  } catch (error) {
    console.warn('Failed to parse image URL:', originalUrl, error);
    return originalUrl;
  }
};

export default function CharacterImage({ 
  src, 
  alt, 
  sx, 
  component = 'img',
  fallbackSrc = '/imgs/icons/75px-Di.png',
  ...props 
}: CharacterImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [triedBackup, setTriedBackup] = useState(false);

  const handleError = useCallback(() => {
    if (!triedBackup && src) {
      // 第一次失败，尝试备用链接
      const backupUrl = getBackupImageUrl(src);
      if (backupUrl !== src) {
        setCurrentSrc(backupUrl);
        setTriedBackup(true);
        return;
      }
    }
    
    // 备用链接也失败了，或者没有备用链接，使用最终fallback
    setCurrentSrc(fallbackSrc);
    setHasError(true);
  }, [src, triedBackup, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setHasError(false);
  }, []);

  // 当src改变时重置状态
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setTriedBackup(false);
  }, [src]);

  if (component === 'avatar') {
    return (
      <Avatar
        src={currentSrc}
        alt={alt}
        sx={sx}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    );
  }

  return (
    <Box
      component="img"
      src={currentSrc}
      alt={alt}
      sx={sx}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
}

// 导出备用链接生成函数，供其他地方使用
export { getBackupImageUrl };
