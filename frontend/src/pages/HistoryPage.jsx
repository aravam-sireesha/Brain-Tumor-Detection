import { useCallback, useEffect, useState } from 'react'
import { Clock3, RefreshCw } from 'lucide-react'
import { fetchHistory, getApiError } from '../api.js'
import ErrorMessage from '../components/ErrorMessage.jsx'
import HistoryList from '../components/HistoryList.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setHistory(await fetchHistory())
    } catch (requestError) {
      setError(getApiError(requestError, 'history'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  return (
    <section className="page-container page-section history-page">
      <div className="page-heading history-heading">
        <div>
          <span className="eyebrow"><Clock3 size={14} /> SAVED RECORDS</span>
          <h1>Prediction history</h1>
          <p>Records retrieved from the connected backend database.</p>
        </div>
        <button className="button button-outline refresh-button" type="button" onClick={loadHistory} disabled={loading}>
          {loading ? <LoadingSpinner label="Loading..." /> : <><RefreshCw size={16} /> Refresh</>}
        </button>
      </div>

      {error ? (
        <ErrorMessage title="History could not be loaded" onRetry={loadHistory}>{error}</ErrorMessage>
      ) : loading ? (
        <div className="loading-card"><LoadingSpinner label="Loading prediction history..." /></div>
      ) : (
        <HistoryList history={history} />
      )}
    </section>
  )
}
