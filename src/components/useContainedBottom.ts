import { useEffect, useState } from 'react';

/** Keep bottom-anchored elements inside their paper when either the page or content changes size. */
export function useContainedBottom(container: React.RefObject<HTMLElement | null>, element: React.RefObject<HTMLElement | null>) {
  const [bounds, setBounds] = useState({ maxBottom: Number.POSITIVE_INFINITY, paperHeight: Number.POSITIVE_INFINITY, paperWidth: Number.POSITIVE_INFINITY });
  useEffect(() => {
    const paper = container.current, item = element.current;
    if (!paper || !item) return;
    const measure = () => {
      const height = paper.clientHeight;
      const next = { maxBottom: Math.max(0, height - item.offsetHeight), paperHeight: height, paperWidth: paper.clientWidth };
      setBounds(old => old.maxBottom === next.maxBottom && old.paperHeight === next.paperHeight && old.paperWidth === next.paperWidth ? old : next);
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(paper); observer.observe(item);
    return () => observer.disconnect();
  }, [container, element]);
  return bounds;
}
