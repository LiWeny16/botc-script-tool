import { useCallback, useLayoutEffect, useState } from 'react';
import { reaction, toJS } from 'mobx';
import type { Script } from '../types';
import type { A4Viewport } from '../utils/a4Layout';
import { A4_LIVE_FRAME_CSS } from '../utils/a4Layout';
import { scriptStore } from '../stores/ScriptStore';
import { uiConfigStore } from '../stores/UIConfigStore';
import { configStore } from '../stores/ConfigStore';

/** A fallback live source for read-only pages without an editor thumbnail. */
export default function A4PreviewSourceFrame({ script, viewport, onFrame }: {
  script?: Script; viewport: A4Viewport; onFrame: (frame: HTMLIFrameElement | null) => void;
}) {
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const ref = useCallback((node: HTMLIFrameElement | null) => { setFrame(node); onFrame(node); }, [onFrame]);
  useLayoutEffect(() => {
    if (!frame) return;
    let ready = false;
    let timer = 0;
    let requestId = 0;
    let pending: { script: Script | null; uiConfig: ReturnType<typeof toJS<typeof uiConfigStore.config>>; appConfig: ReturnType<typeof toJS<typeof configStore.config>> } | null = null;
    const send = () => {
      if (!ready || !pending?.script) return;
      const id = ++requestId; frame.dataset.a4RequestId = String(id);
      frame.contentWindow?.postMessage({ type: 'botc-export-snapshot', snapshot: pending, requestId: id }, location.origin);
    };
    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(send, 100); };
    const receive = (event: MessageEvent<{ type?: string; requestId?: number }>) => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type === 'botc-export-ready') {
        const doc = frame.contentDocument;
        if (!doc) return;
        const style = doc.createElement('style'); style.textContent = A4_LIVE_FRAME_CSS; doc.head.appendChild(style);
        ready = true; schedule();
      } else if (event.data?.requestId === requestId && event.data?.type === 'botc-export-layout') {
        frame.dataset.a4Status = 'layout';
      } else if (event.data?.requestId === requestId && event.data?.type === 'botc-export-rendered') {
        frame.dataset.a4Status = 'ready';
      }
    };
    window.addEventListener('message', receive);
    const stop = reaction(() => ({ script: toJS(script ?? scriptStore.script), uiConfig: toJS(uiConfigStore.config), appConfig: toJS(configStore.config) }),
      value => { pending = value; requestId++; frame.dataset.a4Status = 'pending'; schedule(); }, { fireImmediately: true });
    frame.src = new URL(`${import.meta.env.BASE_URL}export-render.html`, location.origin).href;
    return () => { stop(); window.clearTimeout(timer); window.removeEventListener('message', receive); };
  }, [frame, script]);
  return <iframe ref={ref} title="A4 render layout" aria-hidden="true" sandbox="allow-scripts allow-same-origin" tabIndex={-1}
    style={{ position: 'fixed', left: -20000, top: 0, width: viewport.width, height: viewport.height, border: 0, pointerEvents: 'none' }} />;
}
