import { useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import AnalyzePage from './pages/AnalyzePage.jsx'
import ResultPage from './pages/ResultPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

function AppLayout() {
  const [result, setResult] = useState(null)
  const [analyzedFile, setAnalyzedFile] = useState(null)

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Outlet context={{ result, setResult, analyzedFile, setAnalyzedFile }} />
      </main>
      <footer className="site-footer">
        <div className="page-container footer-content">
          <span>Brain Tumor Detection</span>
          <span>Academic AI project · Not a substitute for professional medical diagnosis.</span>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
