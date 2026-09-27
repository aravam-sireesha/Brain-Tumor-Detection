import { Clock, Download } from 'lucide-react'
import { reportDownloadUrl } from '../api'

export default function HistoryList({ history }) {
  if (!history?.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center">
        <p className="text-slate-500 text-sm">No predictions yet. Your history will show up here.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800">
      {history.map((item) => (
        <div key={item.id} className="p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-slate-200 font-medium truncate">{item.prediction}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <Clock size={12} />
              {new Date(item.created_at).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{item.patient_name}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-mono text-cyan-300">
              {item.confidence.toFixed(1)}%
            </span>
            <a
              href={reportDownloadUrl(item.id)}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-cyan-400"
              aria-label="Download report"
            >
              <Download size={16} />
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
