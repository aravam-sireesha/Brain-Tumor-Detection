import axios from 'axios'

// Set VITE_API_URL in a .env file when deploying (e.g. your Render backend URL).
// Falls back to localhost for local development.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

export async function predictImage(file, patientName) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('patient_name', patientName || 'Anonymous')

  const res = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function fetchHistory(limit = 20) {
  const res = await api.get(`/history?limit=${limit}`)
  return res.data.history
}

export function reportDownloadUrl(id) {
  return `${API_BASE_URL}/history/${id}/report`
}
