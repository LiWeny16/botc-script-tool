import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { runInAction } from 'mobx';
import type { Script } from './types';
import type { AppConfig } from './stores/ConfigStore';
import type { UIConfig } from './stores/UIConfigStore';
import { configStore } from './stores/ConfigStore';
import { scriptStore } from './stores/ScriptStore';
import { uiConfigStore } from './stores/UIConfigStore';
import { I18nProvider } from './utils/i18n';
import { appTheme } from './theme/appTheme';
import ScriptRenderer from './components/ScriptRenderer';
import './index.css';

interface ExportSnapshot { script: Script; uiConfig: UIConfig; appConfig: AppConfig }

function nextFrame() { return new Promise<void>(resolve => requestAnimationFrame(() => resolve())); }

export function ExportRenderHost() {
  const [render, setRender] = useState<{ script: Script; requestId?: number } | null>(null);
  useEffect(() => {
    const receive = (event: MessageEvent<{ type: string; snapshot?: ExportSnapshot; requestId?: number }>) => {
      if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'botc-export-snapshot' || !event.data.snapshot) return;
      const snapshot = event.data.snapshot;
      runInAction(() => {
        uiConfigStore.config = snapshot.uiConfig;
        configStore.config = snapshot.appConfig;
        scriptStore.script = snapshot.script;
      });
      uiConfigStore.loadCustomFonts();
      setRender({ script: snapshot.script, requestId: event.data.requestId });
    };
    window.addEventListener('message', receive);
    window.parent.postMessage({ type: 'botc-export-ready' }, location.origin);
    return () => window.removeEventListener('message', receive);
  }, []);

  useEffect(() => {
    if (!render) return;
    let cancelled = false;
    void (async () => {
      // The live preview can show the layout immediately while images load.
      await nextFrame(); await nextFrame();
      if (!cancelled) window.parent.postMessage({ type: 'botc-export-layout', requestId: render.requestId }, location.origin);
      await document.fonts.ready;
      // Wait for image dimensions and React's fallback images before measuring.
      await Promise.all(Array.from(document.images, image => Promise.race([
        image.decode().catch(() => undefined),
        new Promise<void>(resolve => setTimeout(resolve, 12000)),
      ])));
      await nextFrame(); await nextFrame(); await nextFrame();
      if (!cancelled) window.parent.postMessage({ type: 'botc-export-rendered', requestId: render.requestId }, location.origin);
    })();
    return () => { cancelled = true; };
  }, [render]);

  return <ThemeProvider theme={appTheme}><CssBaseline /><I18nProvider>
    {render && <ScriptRenderer script={render.script} theme={appTheme} readOnly exportMode />}
  </I18nProvider></ThemeProvider>;
}

createRoot(document.getElementById('root')!).render(<ExportRenderHost />);
