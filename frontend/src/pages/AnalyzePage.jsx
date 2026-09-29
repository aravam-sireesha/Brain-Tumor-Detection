import { useState } from 'react'
import { ArrowLeft, LockKeyhole, ScanLine } from 'lucide-react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { getApiError, predictImage } from '../api.js'
import UploadCard from '../components/UploadCard.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function AnalyzePage() {
  const [file, setFile] = useState(null)
  const [patientName, setPatientName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setResult, setAnalyzedFile } = useOutletContext()
  const navigate = useNavigate()

  const handleAnalyze = async (event) => {
    event.preventDefault()
    setError('')
    if (!file) {
      setError('Choose an MRI image before starting the analysis.')
      return
    }
    if (!file.size) {
      setError('The selected file is empty. Please choose another image.')
      return
    }

    setLoading(true)
    try {
      const data = await predictImage(file, patientName.trim() || 'Anonymous')
      setResult(data)
      setAnalyzedFile(file)
      navigate('/result')
    } catch (requestError) {
      setError(getApiError(requestError, 'prediction'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-container page-section analyze-page">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to home</Link>
      <div className="page-heading">
        <span className="eyebrow">NEW ANALYSIS</span>
        <h1>Analyze Brain MRI</h1>
        <p>Upload an MRI scan for AI-based classification.</p>
      </div>

      <form className="analysis-layout" onSubmit={handleAnalyze}>
        <div className="analysis-form-card">
          <div className="card-heading">
            <span className="card-icon"><ScanLine size={20} /></span>
            <div><h2>Scan details</h2><p>Provide the image to analyze</p></div>
          </div>

          <label className="field-label" htmlFor="patient-name">Patient name <span>Optional</span></label>
          <input
            id="patient-name"
            className="text-input"
            type="text"
            autoComplete="off"
            maxLength={120}
            placeholder="Enter patient name"
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            disabled={loading}
          />
          <div className="field-heading">
            <label className="field-label" htmlFor="mri-file">MRI scan</label>
            <span className="field-hint">JPG or PNG · One image</span>
          </div>
          <UploadCard
            file={file}
            onFileSelected={(selectedFile) => { setFile(selectedFile); setError('') }}
            onClear={() => setFile(null)}
            onError={setError}
            disabled={loading}
          />
          <ErrorMessage title="Unable to analyze scan">{error}</ErrorMessage>
          <button className="button button-primary analyze-button" type="submit" disabled={loading || !file}>
            {loading ? <LoadingSpinner label="Analyzing MRI..." /> : <>Analyze MRI <ScanLine size={17} /></>}
          </button>
          {loading && <p className="analysis-progress-copy">Processing image · Running AI classification</p>}
          <p className="privacy-note"><LockKeyhole size={14} /> Image submission is sent to the configured analysis server.</p>
        </div>

        <aside className="analysis-aside">
          <span className="aside-icon"><ScanLine size={21} /></span>
          <h2>Before you begin</h2>
          <ul>
            <li>Use an MRI image in JPG or PNG format.</li>
            <li>Make sure the image is clear and correctly oriented.</li>
            <li>The prediction will appear after the server responds.</li>
          </ul>
          <div className="aside-disclaimer">
            <strong>Academic use only</strong>
            <p>This tool does not provide a medical diagnosis. Consult a qualified clinician for medical advice.</p>
          </div>
        </aside>
      </form>
    </section>
  )
}
