import { useEffect, useState } from 'react'
import { Brain, Activity, History as HistoryIcon } from 'lucide-react'
import UploadCard from './components/UploadCard.jsx'
import ResultPanel from './components/ResultPanel.jsx'
import HistoryList from './components/HistoryList.jsx'
import { predictImage, fetchHistory } from './api.js'

export default function App() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [patientName, setPatientName] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('scan') // 'scan' | 'history'

  const loadHistory = async () => {
    try {
      const data = await fetchHistory()
      setHistory(data)
    } catch {
      // silent - history is non-critical
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleFileSelected = (f) => {
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  const handleClear = () => {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await predictImage(file, patientName)
      setResult(data)
      loadHistory()
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Could not reach the prediction server. Is the FastAPI backend running?'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Brain className="text-cyan-400" size={20} />
            </div>
            <div>
              <h1 className="font-semibold text-slate-100 leading-tight">
                Brain Tumor Detection
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                MRI classifier · EfficientNetB0 · TensorFlow
              </p>
            </div>
          </div>
          <nav className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setTab('scan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'scan' ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity size={14} /> Scan
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'history' ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HistoryIcon size={14} /> History
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {tab === 'scan' ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <UploadCard
                onFileSelected={handleFileSelected}
                previewUrl={previewUrl}
                onClear={handleClear}
              />

              <input
                type="text"
                placeholder="Patient name (optional)"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />

              <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold py-2.5 transition-colors"
              >
                {loading ? 'Analyzing…' : 'Analyze Scan'}
              </button>
            </div>

            <ResultPanel result={result} loading={loading} error={error} />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Prediction History</h2>
            <HistoryList history={history} />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-slate-600">
          Built as an end-to-end AI internship project · Not for clinical use
        </div>
      </footer>
    </div>
  )
}
