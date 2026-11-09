export const HEADER_LAYOUT_TARGETS = [
  'title', 'titleWithRules', 'rule', 'titleMobile', 'titleWithRulesMobile', 'ruleMobile',
  'design', 'author', 'designWithRules', 'authorWithRules',
  'designMobile', 'authorMobile', 'designWithRulesMobile', 'authorWithRulesMobile',
  'authorLine', 'authorLineMobile', 'authorLineWithRules', 'authorLineWithRulesMobile',
] as const;

export type HeaderLayoutTarget = typeof HEADER_LAYOUT_TARGETS[number];
export interface HeaderLayoutAdjustment {
  x: number;
  y: number;
  widthDelta: number;
  minHeight: number;
  scale: number;
}
export type HeaderLayout = Record<HeaderLayoutTarget, HeaderLayoutAdjustment>;

const clamp = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value))) : 0;

export function normalizeHeaderAdjustment(value?: Partial<HeaderLayoutAdjustment>): HeaderLayoutAdjustment {
  return {
    // The measured header, rather than a fixed offset, defines the usable area.
    x: clamp(value?.x, -10000, 10000),
    y: clamp(value?.y, -10000, 10000),
    widthDelta: clamp(value?.widthDelta, -10000, 10000),
    minHeight: clamp(value?.minHeight, 0, 10000),
    scale: typeof value?.scale === 'number' && Number.isFinite(value.scale)
      ? Math.round(Math.max(0.6, Math.min(1.5, value.scale)) * 100) / 100 : 1,
  };
}

export function defaultHeaderAdjustment(target: HeaderLayoutTarget): HeaderLayoutAdjustment {
  return normalizeHeaderAdjustment({ y: target === 'design' || target === 'author' ? 24 : 0 });
}

export function normalizeHeaderLayout(value?: Partial<HeaderLayout>): HeaderLayout {
  return Object.fromEntries(HEADER_LAYOUT_TARGETS.map((target) => [target,
    normalizeHeaderAdjustment({ ...defaultHeaderAdjustment(target), ...value?.[target] })])) as HeaderLayout;
}
