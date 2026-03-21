/**
 * Extract user-friendly error message from API error response.
 * Handles our backend format { error: { message } }, FastAPI detail, and network errors.
 */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback
  const data = err.response?.data
  if (data?.error?.message) return data.error.message
  if (data?.detail) {
    if (Array.isArray(data.detail)) return data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; ')
    if (typeof data.detail === 'string') return data.detail
  }
  if (err.message && !err.message.includes('Network Error')) return err.message
  if (!err.response) return 'Could not reach server. Please check your connection.'
  return fallback
}
