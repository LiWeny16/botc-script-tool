/**
 * BOTC Script Tool — Free Blood on the Clocktower layout beautifier & custom script generator.
 * AGPL-3.0 | github.com/LiWeny16/botc-script-tool | botc.letshare.fun
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './print.css'
import App from './App.tsx'
import ScriptRepository from './pages/ScriptRepository.tsx'
import ScriptPreview from './pages/ScriptPreview.tsx'
import Changelog from './pages/Changelog.tsx'
import AllCharacters from './pages/AllCharacters.tsx'
import ImageGen from './pages/ImageGen.tsx'
import { I18nProvider } from './utils/i18n.tsx'

// ── Global crash prevention (white-screen defense) ───────────────────────
// These run OUTSIDE React — they catch anything the ErrorBoundary can't:
// unhandled promise rejections, event handler crashes, third-party lib crashes.

const CRASH_STYLE = `
  #crash-recovery-overlay {
    position:fixed;inset:0;z-index:99999;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:#1a1a2e;color:#eee;font-family:system-ui,sans-serif;padding:2rem;
  }
  #crash-recovery-overlay h2 { color:#e74c3c;margin-bottom:1rem; }
  #crash-recovery-overlay pre {
    max-width:600px;max-height:200px;overflow:auto;background:#16213e;
    padding:1rem;border-radius:8px;font-size:0.85rem;margin-bottom:1.5rem;
    white-space:pre-wrap;word-break:break-all;
  }
  #crash-recovery-overlay button {
    background:#e74c3c;color:#fff;border:none;padding:0.75rem 2rem;
    border-radius:8px;font-size:1rem;cursor:pointer;margin:0.5rem;
  }
  #crash-recovery-overlay button.secondary { background:#2c3e50; }
`;

function showCrashRecovery(message: string) {
  // Avoid stacking multiple overlays
  if (document.getElementById('crash-recovery-overlay')) return;

  const style = document.createElement('style');
  style.textContent = CRASH_STYLE;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'crash-recovery-overlay';
  overlay.innerHTML = `
    <h2>Application Error</h2>
    <p>An unexpected error occurred. Your data may be recoverable.</p>
    <pre>${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    <div>
      <button id="crash-reload">Reload Page</button>
      <button id="crash-reset" class="secondary">Reset All Data &amp; Reload</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('crash-reload')!.onclick = () => location.reload();
  document.getElementById('crash-reset')!.onclick = () => {
    try { localStorage.clear(); } catch { /* quota or disabled */ }
    location.reload();
  };
}

window.addEventListener('error', (event) => {
  // Only catch unhandled errors (not ones already caught by React ErrorBoundary)
  if (event.error && !event.defaultPrevented) {
    console.error('[Global] Unhandled error:', event.error);
    // React ErrorBoundary sets event.defaultPrevented — if not set, React didn't catch it
    const msg = event.error?.message || event.error?.toString() || event.message || 'Unknown error';
    showCrashRecovery(`Unhandled Error: ${msg}`);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] Unhandled rejection:', event.reason);
  const msg = event.reason?.message || event.reason?.toString() || 'Unknown rejection';
  showCrashRecovery(`Unhandled Promise Rejection: ${msg}`);
});

// ── React mount ──────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/repo" element={<ScriptRepository />} />
          <Route path="/repo/preview" element={<ScriptPreview />} />
          <Route path="/repo/:scriptName" element={<ScriptPreview />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/all-characters" element={<AllCharacters />} />
          <Route path="/image-gen" element={<ImageGen />} />
          <Route path="/shared/:shareId" element={<ScriptPreview />} />
        </Routes>
      </HashRouter>
    </I18nProvider>
  </StrictMode>,
)

