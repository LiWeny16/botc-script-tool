import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './print.css'
import App from './App.tsx'
import ScriptRepository from './pages/ScriptRepository.tsx'
import ScriptPreview from './pages/ScriptPreview.tsx'
// import NewPreview from './pages/NewPreview.tsx'
import { I18nProvider } from './utils/i18n.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/repo" element={<ScriptRepository />} />
          <Route path="/repo/preview" element={<ScriptPreview />} />
          <Route path="/repo/:scriptName" element={<ScriptPreview />} />
          {/* <Route path="/new-preview" element={<NewPreview />} /> */}
          {/* <Route path="/new-preview/:scriptName" element={<NewPreview />} /> */}
        </Routes>
      </HashRouter>
    </I18nProvider>
  </StrictMode>,
)
