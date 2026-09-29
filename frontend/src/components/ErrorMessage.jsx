import { AlertCircle } from 'lucide-react'

export default function ErrorMessage({ children, title = 'Something went wrong', onRetry }) {
  if (!children) return null

  return (
    <div className="error-message" role="alert">
      <AlertCircle size={19} aria-hidden="true" />
      <div className="error-copy">
        <strong>{title}</strong>
        <p>{children}</p>
        {onRetry && (
          <button type="button" className="text-button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
