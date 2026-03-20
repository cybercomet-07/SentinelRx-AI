import { useState, useEffect } from 'react'
import { ngoService } from '../../services/ngoService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import toast from 'react-hot-toast'
import { Plus, Droplets } from 'lucide-react'

const STATUS_CONFIG = {
  UPCOMING:  { label: 'Upcoming',  class: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  ONGOING:   { label: 'Ongoing',   class: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Completed', class: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-50 text-red-600 border-red-200' },
}

function AddCampModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', date: '', location: '', target_units: 50, volunteers: 0, notes: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.title || !form.date || !form.location) return toast.error('Title, date and location are required')
    setSaving(true)
    try {
      await ngoService.createBloodCamp(form)
      toast.success('Blood camp scheduled!')
      onSaved(); onClose()
    } catch { toast.error('Failed to create') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-float w-full max-w-md p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Schedule Blood Camp</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Nagpur City Blood Donation Drive"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Target Units</label>
              <input type="number" value={form.target_units} onChange={e => setForm(f => ({ ...f, target_units: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Location *</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Volunteers</label>
            <input type="number" value={form.volunteers} onChange={e => setForm(f => ({ ...f, volunteers: parseInt(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Scheduling…' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BloodCampsPage() {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setError(false); setLoading(true)
    ngoService.getBloodCamps()
      .then(r => setCamps(r.data?.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const markStatus = async (id, status) => {
    setUpdating(id)
    try {
      const updated = await ngoService.updateBloodCamp(id, { status })
      setCamps(prev => prev.map(c => c.id === id ? updated.data : c))
      toast.success(`Marked as ${status.toLowerCase()}`)
    } catch { toast.error('Failed to update') }
    finally { setUpdating(null) }
  }

  if (loading) return <Loader center />
  if (error) return <ErrorState onRetry={load} />

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus size={15} /> Schedule Camp
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {camps.length === 0 ? (
          <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-12 text-center text-slate-400">No blood camps yet.</div>
        ) : camps.map(c => {
          const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.UPCOMING
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Droplets size={18} className="text-red-500" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${cfg.class}`}>{cfg.label}</span>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 text-sm leading-snug">{c.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{c.date} · {c.location}</p>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{c.collected_units} units collected</span>
                  <span>Target: {c.target_units}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${Math.min(c.progress_pct, 100)}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{c.volunteers} volunteers · {c.progress_pct}% complete</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                {c.status === 'UPCOMING' && (
                  <button onClick={() => markStatus(c.id, 'ONGOING')} disabled={updating === c.id}
                    className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 disabled:opacity-50">
                    Start Camp
                  </button>
                )}
                {c.status === 'ONGOING' && (
                  <button onClick={() => markStatus(c.id, 'COMPLETED')} disabled={updating === c.id}
                    className="flex-1 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 disabled:opacity-50">
                    Mark Complete
                  </button>
                )}
                {(c.status === 'UPCOMING' || c.status === 'ONGOING') && (
                  <button onClick={() => markStatus(c.id, 'CANCELLED')} disabled={updating === c.id}
                    className="py-1.5 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && <AddCampModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  )
}
