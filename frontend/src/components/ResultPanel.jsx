import { Download, AlertCircle } from 'lucide-react'
import { reportDownloadUrl } from '../api'

const TYPE_COLORS = {
  'No Tumor': 'bg-emerald-500',
  Glioma: 'bg-rose-500',
  Meningioma: 'bg-amber-500',
  Pituitary: 'bg-violet-500',
}

export default function ResultPanel({ result, loading, error }) {
  if (error) {
    return (
      <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-6 flex items-start gap-3">
        <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-rose-300 font-medium">Prediction failed</p>
          <p className="text-rose-400/80 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-800 rounded w-5/6" />
          <div className="h-3 bg-slate-800 rounded w-2/3" />
        </div>
        <p className="text-slate-500 text-sm mt-4 font-mono">Running inference on model…</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 h-full flex items-center justify-center text-center">
        <p className="text-slate-500 text-sm">
          Upload an MRI scan and click <span className="text-slate-300">Analyze Scan</span> to see
          the prediction here.
        </p>
      </div>
    )
  }

  const color = TYPE_COLORS[result.prediction] || 'bg-cyan-500'

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
      {result.mock_mode && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
          ⚠️ <span className="font-medium">Mock mode</span> — no trained model detected on the
          backend, so this prediction is simulated for demo purposes, not from a real CNN. Train
          the model (see README) to get real predictions.
        </div>
      )}
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-mono">Prediction</p>
        <div className="flex items-center gap-3 mt-2">
          <span className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="text-2xl font-semibold text-slate-100">{result.prediction}</h3>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Confidence:{' '}
          <span className="font-mono text-cyan-300">{result.confidence.toFixed(2)}%</span>
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-mono">
          Class Probabilities
        </p>
        {Object.entries(result.all_scores).map(([label, score]) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">{label}</span>
              <span className="text-slate-500 font-mono">{score.toFixed(2)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${TYPE_COLORS[label] || 'bg-cyan-500'} transition-all duration-700`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <a
        href={reportDownloadUrl(result.id)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-medium"
      >
        <Download size={16} />
        Download PDF report
      </a>

      <p className="text-xs text-slate-600 border-t border-slate-800 pt-4">
        This tool is for educational/demonstration purposes only and is not a substitute for
        professional medical diagnosis.
      </p>
    </div>
  )
}
