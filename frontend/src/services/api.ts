import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  // No withCredentials needed — Vite proxy makes requests same-origin,
  // so the browser sends cookies automatically.
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize axios errors for consumers
    const status = error.response?.status
    const message = error.response?.data?.error ?? error.message ?? 'Request failed'
    return Promise.reject({ status, message, raw: error })
  }
)

export default api
