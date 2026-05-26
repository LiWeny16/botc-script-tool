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
// import NewPreview from './pages/NewPreview.tsx'
import { I18nProvider } from './utils/i18n.tsx'
import { initAnalytics, initWebVitals } from './utils/analytics'
import { supabase } from './lib/supabase'

// Supabase OAuth lands with #access_token=... — HashRouter can't route it.
// Manually parse the token params and call setSession before swapping hash.
(async () => {
  const hash = window.location.hash;
  if (hash?.includes('access_token')) {
    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
    window.location.hash = '#/image-gen';
  }
})();

// Register service worker for long-term image caching (icons + background)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

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
          {/* <Route path="/new-preview" element={<NewPreview />} /> */}
          {/* <Route path="/new-preview/:scriptName" element={<NewPreview />} /> */}
        </Routes>
      </HashRouter>
    </I18nProvider>
  </StrictMode>,
)
