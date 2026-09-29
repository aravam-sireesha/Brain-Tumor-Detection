import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import ResultPanel from '../components/ResultPanel.jsx'

export default function ResultPage() {
  const { result, analyzedFile } = useOutletContext()
  if (!result) return <Navigate to="/analyze" replace />

  return (
    <section className="page-container page-section result-page">
      <Link to="/analyze" className="back-link"><ArrowLeft size={16} /> Analyze another scan</Link>
      <div className="page-heading result-heading">
        <span className="eyebrow">ANALYSIS COMPLETE</span>
        <h1>Prediction result</h1>
        <p>Review the classification and confidence scores returned by the AI service.</p>
      </div>
      <ResultPanel result={result} imageFile={analyzedFile} />
    </section>
  )
}
