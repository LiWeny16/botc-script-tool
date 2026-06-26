import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Box, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { TowerImage } from '../stores/UIConfigStore';

interface TowerImageOverlayProps {
  image: TowerImage;
  onUpdate: (id: string, partial: Partial<TowerImage>) => void;
  onDelete: (id: string) => void;
  containerRef: React.RefObject<HTMLElement>;
}

export default function TowerImageOverlay({
  image,
  onUpdate,
  onDelete,
  containerRef,
}: TowerImageOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const imgRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartLeftRef = useRef(image.x);
  const resizeStartRef = useRef({ x: 0, scale: image.scale });
  const rafRef = useRef<number | null>(null);

  // Drag handlers
  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartLeftRef.current = image.x;
  }, [image.x]);

  const handleDragMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !imgRef.current) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current || !imgRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const imgRect = imgRef.current.getBoundingClientRect();
      const imgWidthPercent = (imgRect.width / containerRect.width) * 100;

      const deltaX = e.clientX - dragStartXRef.current;
      const deltaPercent = (deltaX / containerRect.width) * 100;

      let newX = dragStartLeftRef.current + deltaPercent;
      newX = Math.max(0, Math.min(newX, 100 - imgWidthPercent));

      onUpdate(image.id, { x: Math.round(newX * 10) / 10 });
    });
  }, [isDragging, containerRef, image.id, onUpdate]);

  const handleDragMouseUp = useCallback(() => {
    setIsDragging(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleDragMouseMove);
    window.addEventListener('mouseup', handleDragMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleDragMouseMove);
      window.removeEventListener('mouseup', handleDragMouseUp);
    };
  }, [isDragging, handleDragMouseMove, handleDragMouseUp]);

  // Resize handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = { x: e.clientX, scale: image.scale };
  }, [image.scale]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaPercent = deltaX / containerWidth;
    const newScale = Math.max(0.2, Math.min(2.0, resizeStartRef.current.scale + deltaPercent));

    onUpdate(image.id, { scale: Math.round(newScale * 100) / 100 });
  }, [isResizing, containerRef, image.id, onUpdate]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  // Precomputed styles to avoid complex expressions inside sx
  const containerSx = useMemo(() => ({
    position: 'absolute' as const,
    left: `${image.x}%`,
    bottom: `${image.y}%`,
    zIndex: 2,
    opacity: isHovered ? Math.min(1, image.opacity + 0.15) : image.opacity,
    transform: `scale(${image.scale})`,
    transformOrigin: 'bottom center',
    cursor: isDragging ? ('grabbing' as const) : ('grab' as const),
    userSelect: 'none' as const,
    WebkitUserDrag: 'none' as const,
    transition: isDragging || isResizing ? ('none' as const) : ('opacity 0.2s' as const),
  }), [image.x, image.y, image.scale, image.opacity, isHovered, isDragging, isResizing]);

  const imgSx = useMemo(() => ({
    display: 'block' as const,
    width: 'auto' as const,
    height: 'auto' as const,
    maxWidth: '100%' as const,
    maxHeight: { xs: '35vh', sm: '50vh', md: '60vh' },
    pointerEvents: 'auto' as const,
  }), []);

  const deleteBtnSx = useMemo(() => ({
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: 'white',
    opacity: isHovered ? 1 : 0,
    transition: 'opacity 0.2s',
    width: 24,
    height: 24,
    '&:hover': {
      backgroundColor: '#ffebee',
    },
    '& .MuiSvgIcon-root': {
      fontSize: 16,
    },
  }), [isHovered]);

  const resizeHandleSx = useMemo(() => ({
    position: 'absolute' as const,
    bottom: -4,
    right: -4,
    width: 12,
    height: 12,
    backgroundColor: 'white',
    border: '2px solid',
    borderColor: 'primary.main',
    borderRadius: '2px',
    cursor: 'nwse-resize',
    opacity: isHovered ? 1 : 0,
    transition: 'opacity 0.2s',
  }), [isHovered]);

  return (
    <Box
      ref={imgRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={containerSx}
    >
      <Box
        component="img"
        src={image.url}
        alt={image.id}
        onMouseDown={handleDragMouseDown}
        sx={imgSx}
        draggable={false}
      />

      {/* Delete button (hover-revealed) */}
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(image.id);
        }}
        sx={deleteBtnSx}
      >
        <DeleteIcon fontSize="inherit" />
      </IconButton>

      {/* Resize handle (bottom-right corner) */}
      <Box
        onMouseDown={handleResizeMouseDown}
        sx={resizeHandleSx}
      />
    </Box>
  );
}
