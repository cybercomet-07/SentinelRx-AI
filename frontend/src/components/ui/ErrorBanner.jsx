import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

export default function ErrorBanner({ message }) {
  const [dismissed, setDismissed] = useState(false)
  if (!message || dismissed) return null
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={() => setDismissed(true)} className="shrink-0 hover:opacity-70">
        <X size={14} />
      </button>
    </div>
  )
}
