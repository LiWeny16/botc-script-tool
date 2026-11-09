import { clampRectMove, LAYOUT_SNAP_THRESHOLD_PX, snapHeaderMove } from '../utils/headerAlignment';

export function createFooterDragGuides(paper: HTMLElement, item: HTMLElement) {
  const page = paper.getBoundingClientRect();
  const scale = paper.offsetWidth ? page.width / paper.offsetWidth : 1;
  const divider = paper.querySelector<HTMLElement>('[data-header-gap-divider]');
  const contentStart = paper.querySelector<HTMLElement>('[data-header-content-start]');
  const dividerRect = divider?.getBoundingClientRect();
  const headerBottom = dividerRect ? dividerRect.top + dividerRect.height / 2 : contentStart?.getBoundingClientRect().top;
  const guideTop = headerBottom === undefined ? 0 : Math.max(0, Math.min(page.height, headerBottom - page.top));
  const vertical = [(page.left + page.right) / 2], horizontal: number[] = [];
  paper.querySelectorAll<HTMLElement>('[data-footer-item], [data-tower-item]').forEach(other => {
    if (other === item) return;
    const r = other.getBoundingClientRect();
    vertical.push(r.left, (r.left + r.right) / 2, r.right);
    horizontal.push(r.top, (r.top + r.bottom) / 2, r.bottom);
  });
  const wrapper = document.createElement('div'); wrapper.className = 'footer-drag-guides';
  wrapper.style.cssText = 'position:absolute;inset:0;z-index:30;pointer-events:none';
  const xLine = document.createElement('div');
  xLine.dataset.guideAxis = 'vertical';
  xLine.style.cssText = `display:none;position:absolute;top:${guideTop / scale}px;bottom:0;border-left:1px dashed #00929f;filter:drop-shadow(0 0 1px white)`;
  const yLine = document.createElement('div');
  yLine.dataset.guideAxis = 'horizontal';
  yLine.style.cssText = 'display:none;position:absolute;left:0;width:100%;border-top:1px dashed #00929f;filter:drop-shadow(0 0 1px white)';
  wrapper.append(xLine, yLine); paper.appendChild(wrapper);
  return {
    move(rect: DOMRect, bounds: DOMRect, dx: number, dy: number, lockY = false) {
      const snapped = snapHeaderMove(rect, dx, dy, vertical, lockY ? [] : horizontal, LAYOUT_SNAP_THRESHOLD_PX * scale);
      const safe = clampRectMove(rect, bounds, snapped.dx, lockY ? 0 : snapped.dy);
      xLine.style.display = snapped.vertical !== null && Math.abs(safe.dx - snapped.dx) < .5 ? 'block' : 'none';
      yLine.style.display = !lockY && snapped.horizontal !== null && snapped.horizontal >= page.top + guideTop
        && Math.abs(safe.dy - snapped.dy) < .5 ? 'block' : 'none';
      if (snapped.vertical !== null) xLine.style.left = `${(snapped.vertical - page.left) / scale}px`;
      if (snapped.horizontal !== null) yLine.style.top = `${(snapped.horizontal - page.top) / scale}px`;
      return safe;
    },
    remove() { wrapper.remove(); },
  };
}
