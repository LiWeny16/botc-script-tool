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
import SharedScriptView from './pages/SharedScriptView'
import ScriptRepository from './pages/ScriptRepository.tsx'
import ScriptPreview from './pages/ScriptPreview.tsx'
import Changelog from './pages/Changelog.tsx'
import AllCharacters from './pages/AllCharacters.tsx'
import ImageGen from './pages/ImageGen.tsx'
// import NewPreview from './pages/NewPreview.tsx'
import { I18nProvider } from './utils/i18n.tsx'
import { initAnalytics, initWebVitals } from './utils/analytics'

// Initialize GA4 page view tracking and web vitals
initAnalytics();
initWebVitals();

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
          <Route path="/shared/:shareId" element={<SharedScriptView />} />
          {/* <Route path="/new-preview" element={<NewPreview />} /> */}
          {/* <Route path="/new-preview/:scriptName" element={<NewPreview />} /> */}
        </Routes>
      </HashRouter>
    </I18nProvider>
  </StrictMode>,
)
