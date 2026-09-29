import { Clock3, FileText, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import ReportButton from './ReportButton.jsx'

export default function HistoryList({ history }) {
  if (!history?.length) {
    return (
      <div className="empty-history">
        <span className="empty-history-icon"><FileText size={23} /></span>
        <h2>No MRI analyses yet.</h2>
        <p>Completed analyses saved by the backend will appear here.</p>
        <Link className="button button-primary empty-history-action" to="/analyze">Analyze Your First MRI</Link>
      </div>
    )
  }

  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th scope="col">Record</th>
            <th scope="col">Patient</th>
            <th scope="col">Prediction</th>
            <th scope="col">Confidence</th>
            <th scope="col">Date</th>
            <th scope="col"><span className="visually-hidden">Report</span></th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id}>
              <td><span className="record-id">#{item.id}</span></td>
              <td><span className="table-patient"><UserRound size={15} />{item.patient_name || 'Not provided'}</span></td>
              <td><span className="prediction-badge">{item.prediction}</span></td>
              <td><strong className="table-confidence">{formatScore(item.confidence)}%</strong></td>
              <td><span className="table-date"><Clock3 size={14} />{formatDate(item.created_at)}</span></td>
              <td><ReportButton recordId={item.id} compact /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="history-mobile-list">
        {history.map((item) => (
          <article className="history-mobile-card" key={item.id}>
            <div className="history-mobile-top">
              <span className="prediction-badge">{item.prediction}</span>
              <span className="table-confidence">{formatScore(item.confidence)}%</span>
            </div>
            <div className="history-mobile-meta">
              <span><UserRound size={14} />{item.patient_name || 'Not provided'}</span>
              <span><Clock3 size={14} />{formatDate(item.created_at)}</span>
              <span>Record #{item.id}</span>
            </div>
            <ReportButton recordId={item.id} />
          </article>
        ))}
      </div>
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString()
}

function formatScore(value) {
  const score = Number(value)
  return Number.isFinite(score) ? score.toFixed(2) : '—'
}
