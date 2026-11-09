import type { FooterComponent } from '../types';

export const DEFAULT_EXPLANATION_WIDTH = 60;
export const DEFAULT_LEGEND_WIDTH = 14;

/** Add defaults only when a script first enters the editor; the marker respects later deletions. */
export function withDefaultFooterComponents(json: string, addDefaults = true): string {
  const entries: unknown = JSON.parse(json);
  if (!Array.isArray(entries)) return json;
  let meta = entries.find(item => item && typeof item === 'object' && item.id === '_meta');
  if (!meta) { meta = { id: '_meta' }; entries.unshift(meta); }
  let components: FooterComponent[] = Array.isArray(meta.footer_components) ? [...meta.footer_components] : [];
  let changed = false;
  if (meta.footer_layout_version !== 1) {
    components = components.map(item => item?.type === 'stateLayout' ? { ...item, x: 0, y: 0, width: DEFAULT_EXPLANATION_WIDTH, height: undefined, defaultWidthAdaptive: true }
      : item?.type === 'nightLegend' ? { ...item, x: (100 - DEFAULT_LEGEND_WIDTH) / 2, y: 0, width: DEFAULT_LEGEND_WIDTH, cloudOnly: true } : item);
    meta.footer_layout_version = 1;
    changed = true;
  }
  if (meta.footer_defaults_version === 1) {
    if (Array.isArray(meta.footer_components)) meta.footer_components = components;
    return changed ? JSON.stringify(entries, null, 2) : json;
  }
  const hasExplanation = components.some(item => item && (item.type === 'stateLayout' || item.type === 'list'))
    || (Array.isArray(meta.state) && meta.state.length > 0) || (Array.isArray(meta.status) && meta.status.length > 0);
  if (addDefaults && !hasExplanation) components.push({ id: 'default-explanation', type: 'stateLayout', page: 1, x: 0, y: 0,
    width: DEFAULT_EXPLANATION_WIDTH, defaultContent: true });
  if (addDefaults && !components.some(item => item && item.type === 'nightLegend' && item.page === 1)) {
    components.push({ id: 'default-night-legend', type: 'nightLegend', page: 1, x: (100 - DEFAULT_LEGEND_WIDTH) / 2, y: 0,
      width: DEFAULT_LEGEND_WIDTH, cloudOnly: true, autoReserve: true });
  }
  if (components.length || Array.isArray(meta.footer_components)) meta.footer_components = components;
  meta.footer_defaults_version = 1;
  return JSON.stringify(entries, null, 2);
}
