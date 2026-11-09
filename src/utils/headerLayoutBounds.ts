import type { HeaderRect } from './headerAlignment';
import type { HeaderLayoutTarget } from './headerLayout';

export interface HeaderLayoutBounds {
  layout: HeaderRect;
  screen: HeaderRect;
  scale: number;
}

/** Header objects may move anywhere in the page width and the header band, never into the role list. */
export function measureHeaderLayoutBounds(root: HTMLElement, page: HTMLElement, target?: HeaderLayoutTarget): HeaderLayoutBounds {
  const rootRect = root.getBoundingClientRect();
  const pageRect = page.getBoundingClientRect();
  const scale = page.offsetWidth ? pageRect.width / page.offsetWidth : 1;
  const contentStart = root.querySelector<HTMLElement>('[data-header-content-start]');
  const divider = target?.startsWith('authorLine') ? root.querySelector<HTMLElement>('[data-header-gap-divider]') : null;
  const dividerRect = divider?.getBoundingClientRect();
  const lowerEdge = dividerRect ? dividerRect.top + dividerRect.height / 2 : contentStart?.getBoundingClientRect().top;
  const padding = Math.max(1, scale);
  const bottom = Math.max(
    pageRect.top + padding,
    Math.min(
      rootRect.bottom - padding,
      lowerEdge ?? rootRect.bottom,
    ),
  );
  const screen: HeaderRect = {
    left: pageRect.left + padding,
    right: pageRect.right - padding,
    top: pageRect.top + padding,
    bottom,
  };
  return {
    screen,
    scale,
    layout: {
      left: (screen.left - pageRect.left) / scale,
      right: (screen.right - pageRect.left) / scale,
      top: (screen.top - pageRect.top) / scale,
      bottom: (screen.bottom - pageRect.top) / scale,
    },
  };
}
