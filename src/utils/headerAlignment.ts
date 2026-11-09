export interface HeaderRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const LAYOUT_SNAP_THRESHOLD_PX = 5;
export const LAYOUT_DRAG_THRESHOLD_PX = 3;

export function unionHeaderRects(a: HeaderRect, b?: HeaderRect | null): HeaderRect {
  return b ? { left: Math.min(a.left, b.left), right: Math.max(a.right, b.right),
    top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom) } : a;
}

export function insetHeaderRect(rect: HeaderRect, amount = 1): HeaderRect {
  return { left: rect.left + amount, right: rect.right - amount, top: rect.top + amount, bottom: rect.bottom - amount };
}

/** Keep a translated rectangle inside its page, even when an old layout was outside it. */
export function clampRectMove(rect: HeaderRect, bounds: HeaderRect, dx: number, dy: number) {
  const axis = (start: number, end: number, min: number, max: number, delta: number) => {
    if (end - start > max - min) return min - start;
    return Math.max(min - start, Math.min(max - end, delta));
  };
  return { dx: axis(rect.left, rect.right, bounds.left, bounds.right, dx),
    dy: axis(rect.top, rect.bottom, bounds.top, bounds.bottom, dy) };
}

function closestAlignment(edges: number[], candidates: number[], threshold: number) {
  let best: { offset: number; position: number } | null = null;
  for (const position of candidates) {
    for (const edge of edges) {
      const offset = position - edge;
      if (Math.abs(offset) <= threshold && (!best || Math.abs(offset) < Math.abs(best.offset))) {
        best = { offset, position };
      }
    }
  }
  return best;
}

export function snapHeaderMove(rect: HeaderRect, dx: number, dy: number, vertical: number[], horizontal: number[], threshold = 5) {
  const x = closestAlignment([rect.left + dx, (rect.left + rect.right) / 2 + dx, rect.right + dx], vertical, threshold);
  const y = closestAlignment([rect.top + dy, (rect.top + rect.bottom) / 2 + dy, rect.bottom + dy], horizontal, threshold);
  return {
    dx: dx + (x?.offset || 0), dy: dy + (y?.offset || 0),
    vertical: x?.position ?? null, horizontal: y?.position ?? null,
  };
}
