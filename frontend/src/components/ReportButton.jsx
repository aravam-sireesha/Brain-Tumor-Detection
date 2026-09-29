import { useState } from 'react'
import { Download } from 'lucide-react'
import { downloadReport, getApiError } from '../api.js'
import LoadingSpinner from './LoadingSpinner.jsx'

export default function ReportButton({ recordId, compact = false }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setLoading(true)
    setError('')
    try {
      await downloadReport(recordId)
    } catch (downloadError) {
      setError(getApiError(downloadError, 'report'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`report-action${compact ? ' is-compact' : ''}`}>
      <button
        type="button"
        className={compact ? 'icon-button' : 'button button-secondary'}
        onClick={handleDownload}
        disabled={loading}
        aria-label={`Download report for record ${recordId}`}
        title="Download report"
      >
        {loading ? <LoadingSpinner label="Downloading..." /> : (
          <>
            <Download size={compact ? 17 : 16} />
            {!compact && 'Download PDF Report'}
          </>
        )}
      </button>
      {error && <span className="report-error" role="alert">{error}</span>}
    </div>
  )
}
