import { useState, useEffect } from 'react'
import { contactService } from '../../services/contactService'
import { Mail, User, Phone, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminContactPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(15)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    contactService.list(page, limit)
      .then((res) => {
        setItems(res.data?.items || [])
        setTotal(res.data?.total ?? 0)
      })
      .catch(() => toast.error('Failed to load contact messages'))
      .finally(() => setLoading(false))
  }, [page, limit])

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900">Contact Submissions</h1>
        <p className="text-slate-500 mt-1">Messages sent by users via the Contact Us form.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No contact messages yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <User size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{m.full_name}</p>
                      <p className="text-xs text-slate-500">
                        From: {m.user_name || 'Unknown'} ({m.user_email || '—'})
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    <span>{m.contact_details}</span>
                  </div>
                  {m.date_of_birth && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{new Date(m.date_of_birth).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.description}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
