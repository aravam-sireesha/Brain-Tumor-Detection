import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
})

export async function predictImage(file, patientName) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('patient_name', patientName)

  const response = await api.post('/predict', formData)
  return response.data
}

export async function fetchHistory() {
  const response = await api.get('/history')
  if (!Array.isArray(response.data?.history)) {
    throw new Error('The history service returned an unexpected response.')
  }
  return response.data.history
}

export async function downloadReport(recordId) {
  const response = await api.get(`/history/${encodeURIComponent(recordId)}/report`, {
    responseType: 'blob',
  })
  const blobUrl = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  const disposition = response.headers['content-disposition'] || ''
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1]

  link.href = blobUrl
  link.download = filename || `brain_tumor_report_${recordId}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}

export function getApiError(error, action) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }

  if (!error.response) {
    return 'Unable to connect to the AI server. Please make sure the backend is running.'
  }

  const status = error.response.status
  if (status === 422) {
    if (action === 'report') {
      return 'The report request could not be validated. Please try again.'
    }
    return action === 'prediction'
      ? 'The server could not validate the request. Check that a patient name and valid MRI image were provided.'
      : 'The history request could not be validated.'
  }
  if (status === 400) {
    const detail = error.response.data?.detail
    return typeof detail === 'string' && detail.length < 240
      ? detail
      : 'The image could not be accepted. Please choose a valid JPG or PNG MRI scan.'
  }
  if (status === 404 && action === 'report') {
    return 'No report was found for this record.'
  }
  if (status >= 500) {
    return action === 'history'
      ? 'The server could not load prediction history. Please try again.'
      : action === 'report'
        ? 'The report could not be generated or downloaded. Please try again.'
        : 'The AI server encountered an error while analyzing the image. Please try again.'
  }

  return action === 'history'
    ? 'Unable to load prediction history. Please try again.'
    : action === 'report'
      ? 'Unable to download the report. Please try again.'
      : 'The image could not be analyzed. Please check the file and try again.'
}
