export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <span className="loading-inline" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
