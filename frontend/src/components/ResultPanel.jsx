import { AlertTriangle, CheckCircle2, Clock3, Hash, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import ImagePreview from './ImagePreview.jsx'
import ReportButton from './ReportButton.jsx'

export default function ResultPanel({ result, imageFile }) {
  const scores = Object.entries(result.all_scores || {})

  return (
    <div className="result-content">
      <article className="result-hero-panel">
        {result.mock_mode && (
          <div className="mock-warning" role="alert">
            <AlertTriangle size={16} />
            The backend marked this result as mock mode. It is not a model-generated prediction.
          </div>
        )}
        <div className="result-hero-grid">
          <div className="result-image-frame">
            <ImagePreview file={imageFile} />
            {imageFile && <span className="result-image-name">{imageFile.name}</span>}
          </div>
          <div className="result-primary">
            <span className="result-eyebrow"><CheckCircle2 size={15} /> AI CLASSIFICATION RESULT</span>
            <span className="result-label">Prediction</span>
            <h2>{result.prediction}</h2>
            <div className="result-confidence">
              <span>Confidence</span>
              <strong>{formatScore(result.confidence)}<small>%</small></strong>
            </div>
            <dl className="result-metadata">
              <div><dt><UserRound size={15} />Patient name</dt><dd>{result.patient_name || 'Not provided'}</dd></div>
              <div><dt><Hash size={15} />Record ID</dt><dd>#{result.id}</dd></div>
              <div><dt><Clock3 size={15} />Analysis date</dt><dd>{formatDate(result.created_at)}</dd></div>
            </dl>
            <ReportButton recordId={result.id} />
            <div className="result-actions">
              <Link className="button result-action-secondary" to="/analyze">Analyze Another MRI</Link>
              <Link className="button result-action-tertiary" to="/history">View History</Link>
            </div>
          </div>
        </div>
      </article>

      <article className="score-card">
        <div className="score-heading">
          <div><span className="eyebrow">MODEL OUTPUT</span><h2>Class probabilities</h2></div>
          <span>Scores returned by the backend</span>
        </div>
        <div className="score-list">
          {scores.map(([label, value]) => {
            const score = Number(value)
            const width = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0
            return (
              <div className="score-row" key={label}>
                <div className="score-row-label"><span>{label}</span><strong>{formatScore(value)}%</strong></div>
                <div className="score-track" role="meter" aria-label={`${label} score`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Number.isFinite(score) ? score : 0}>
                  <span className="score-fill" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
          {!scores.length && <p className="empty-score">No class scores were returned for this prediction.</p>}
        </div>
        <p className="medical-disclaimer">This academic AI system is not a substitute for professional medical diagnosis.</p>
      </article>
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
