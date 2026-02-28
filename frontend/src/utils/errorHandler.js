import toast from 'react-hot-toast'

export const handleError = (err) => {
  const msg = err?.response?.data?.detail || err?.message || 'Something went wrong'
  toast.error(msg)
  return msg
}
