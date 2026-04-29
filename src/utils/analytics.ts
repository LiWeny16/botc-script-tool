/**
 * Google Analytics 4 integration module.
 *
 * Usage:
 *   import { initAnalytics, initWebVitals, trackGenerateScript, ... } from '../utils/analytics';
 *
 *   // In main.tsx (once):
 *   initAnalytics();
 *   initWebVitals();
 *
 *   // In components:
 *   trackGenerateScript({ characterCount: 12, hasCustomTitle: true });
 */

import { configStore } from '../stores/ConfigStore';
import type { Language } from './languages';

// GA4 Measurement ID — set via Vite define at build time
declare const VITE_GA_MEASUREMENT_ID: string | undefined;

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push(arguments);
  }
}

function getLanguage(): string {
  try {
    return configStore.language;
  } catch {
    return 'cn';
  }
}

// ---- Page view tracking ----

let _initialized = false;

export function initAnalytics() {
  if (_initialized) return;
  _initialized = true;

  window.addEventListener('hashchange', () => {
    gtag('event', 'page_view', {
      page_location: window.location.href,
      page_title: document.title,
      page_path: window.location.hash || '/',
    });
  });
}

// ---- Web Vitals ----

let _webVitalsInitialized = false;

export function initWebVitals() {
  if (_webVitalsInitialized) return;
  _webVitalsInitialized = true;

  import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
    function sendMetric({ name, delta, id, rating }: any) {
      gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: id,
        value: Math.round(name === 'CLS' ? delta * 1000 : delta),
        metric_id: id,
        metric_value: delta,
        metric_rating: rating,
        metric_name: name,
        non_interaction: true,
      });
    }
    onCLS(sendMetric);
    onFCP(sendMetric);
    onINP(sendMetric);
    onLCP(sendMetric);
    onTTFB(sendMetric);
  });
}

// ---- Custom event tracking functions ----

function track(eventName: string, params?: Record<string, unknown>) {
  gtag('event', eventName, { ...params, language: getLanguage() });
}

export function trackGenerateScript(params: { characterCount: number; hasCustomTitle: boolean }) {
  track('generate_script', {
    character_count: params.characterCount,
    has_custom_title: params.hasCustomTitle,
  });
}

export function trackExportJson(params: { exportType: 'original' | 'current_language' | 'id_only' }) {
  track('export_json', { export_type: params.exportType });
}

export function trackExportImage() {
  track('export_image');
}

export function trackExportPdf() {
  track('export_pdf');
}

export function trackLanguageSwitch(params: { from: Language; to: Language }) {
  track('language_switch', { from_language: params.from, to_language: params.to });
}

export function trackAddCharacter(params: { characterId: string; team: string }) {
  track('add_character', { character_id: params.characterId, team: params.team });
}

export function trackRemoveCharacter(params: { characterId: string; team: string }) {
  track('remove_character', { character_id: params.characterId, team: params.team });
}

export function trackEditCharacter(params: { characterId: string }) {
  track('edit_character', { character_id: params.characterId });
}

export function trackClearScript() {
  track('clear_script');
}

export function trackUploadJson() {
  track('upload_json');
}

export function trackOpenRepo() {
  track('open_repo');
}

export function trackPreviewScript(params: { scriptName: string }) {
  track('preview_script', { script_name: params.scriptName });
}

export function trackShareScript() {
  track('share_script');
}
