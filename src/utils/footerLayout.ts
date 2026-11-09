import type { FooterComponent } from '../types';
import { DEFAULT_EXPLANATION_WIDTH, DEFAULT_LEGEND_WIDTH } from './defaultFooterComponents';

export const NIGHT_LEGEND_CLOUD_FRACTION = 0.34;
// Bounds of the generated cloud within its transparent PNG.
export const NIGHT_LEGEND_ASPECT_RATIO = 1490 / 596;

/** Preserve the old ornament's visible cloud size and center until the item is next saved. */
export function normalizeLegendLayout(item: FooterComponent): FooterComponent {
  if (item.type !== 'nightLegend' || item.cloudOnly) return item;
  const width = Math.max(0, Math.min(100, item.width * NIGHT_LEGEND_CLOUD_FRACTION));
  return { ...item, x: Math.max(0, Math.min(100 - width, item.x + (item.width - width) / 2)),
    width, y: 0, cloudOnly: true };
}

export function resetFooterComponentLayout(item: FooterComponent): FooterComponent {
  const defaults: Pick<FooterComponent, 'x' | 'y' | 'width' | 'height' | 'reserveSpace'> = item.type === 'nightLegend'
    ? { x: (100 - DEFAULT_LEGEND_WIDTH) / 2, y: 0, width: DEFAULT_LEGEND_WIDTH, height: undefined, reserveSpace: undefined }
    : item.type === 'stateLayout'
      ? { x: 0, y: 0, width: DEFAULT_EXPLANATION_WIDTH, height: undefined, reserveSpace: undefined }
      : item.type === 'image'
        ? { x: 2, y: 0, width: 20, height: undefined, reserveSpace: undefined }
        : { x: 30, y: 96, width: 55, height: undefined, reserveSpace: undefined };
  return { ...item, ...defaults, ...(item.type === 'nightLegend' ? { cloudOnly: true } : {}),
    ...(item.type === 'stateLayout' ? { defaultWidthAdaptive: true } : {}) };
}

export function nudgeFooterComponentLayout(
  item: FooterComponent,
  key: string,
  stepPx: number,
  containerWidth: number,
): FooterComponent | null {
  if (key === 'Home') return resetFooterComponentLayout(item);
  if (containerWidth <= 0) return null;
  const maxX = Math.max(0, 100 - Math.max(0, item.width));
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const dx = stepPx / containerWidth * 100;
    return {
      ...item,
      x: Math.max(0, Math.min(maxX, item.x + (key === 'ArrowRight' ? dx : -dx))),
    };
  }
  if (item.type === 'nightLegend') return null;
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    return {
      ...item,
      y: Math.max(0, item.y + (key === 'ArrowUp' ? stepPx : -stepPx)),
    };
  }
  return null;
}
