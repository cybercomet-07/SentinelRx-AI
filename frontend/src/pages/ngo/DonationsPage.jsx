import { useState, useEffect } from 'react'
import { ngoService } from '../../services/ngoService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import toast from 'react-hot-toast'
import { Plus, Gift, IndianRupee, TrendingUp } from 'lucide-react'

const STATUS_CONFIG = {
  UPCOMING:  { label: 'Upcoming',  class: 'bg-yellow-50 text-yellow-700 border-yellow-200',  bar: 'bg-yellow-400' },
  ONGOING:   { label: 'Ongoing',   class: 'bg-blue-50 text-blue-700 border-blue-200',        bar: 'bg-blue-500' },
  COMPLETED: { label: 'Completed', class: 'bg-green-50 text-green-700 border-green-200',     bar: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-50 text-red-600 border-red-200',           bar: 'bg-red-400' },
}

function AddDriveModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', target_amount: 0 })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.title || !form.start_date) return toast.error('Title and start date are required')
    setSaving(true)
    try {
      await ngoService.createDonation({ ...form, end_date: form.end_date || undefined })
      toast.success('Donation drive created!')
      onSaved(); onClose()
    } catch { toast.error('Failed to create') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-float w-full max-w-md p-6">
        <h3 className="font-semibold text-slate-800 mb-4">New Donation Drive</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date *</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Target Amount (₹)</label>
            <input type="number" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: parseFloat(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Creating…' : 'Create Drive'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DonationsPage() {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setError(false); setLoading(true)
    ngoService.getDonations()
      .then(r => setDrives(r.data?.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const markStatus = async (id, status) => {
    setUpdating(id)
    try {
      const updated = await ngoService.updateDonation(id, { status })
      setDrives(prev => prev.map(d => d.id === id ? updated.data : d))
      toast.success(`Drive ${status.toLowerCase()}`)
    } catch { toast.error('Failed to update') }
    finally { setUpdating(null) }
  }

  if (loading) return <Loader center />
  if (error) return <ErrorState onRetry={load} />

  const totalRaised = drives.reduce((s, d) => s + (d.raised_amount || 0), 0)
  const totalTarget = drives.reduce((s, d) => s + (d.target_amount || 0), 0)

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-purple-100 text-sm">Total Raised</p>
          <p className="text-2xl font-bold">₹{totalRaised.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-purple-100 text-sm">Target</p>
          <p className="text-xl font-bold">₹{totalTarget.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus size={15} /> New Drive
        </button>
      </div>

      <div className="space-y-4">
        {drives.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-slate-400">No donation drives yet.</div>
        ) : drives.map(d => {
          const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.UPCOMING
          return (
            <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Gift size={20} className="text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{d.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${cfg.class}`}>{cfg.label}</span>
                  </div>
                  {d.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{d.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">{d.start_date} {d.end_date ? `→ ${d.end_date}` : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800">₹{d.raised_amount?.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">of ₹{d.target_amount?.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-medium">{d.progress_pct}% raised</span>
                  <span>₹{(d.target_amount - d.raised_amount).toLocaleString()} remaining</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${Math.min(d.progress_pct, 100)}%` }} />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {d.status === 'UPCOMING' && (
                  <button onClick={() => markStatus(d.id, 'ONGOING')} disabled={updating === d.id}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 disabled:opacity-50">
                    Start Drive
                  </button>
                )}
                {d.status === 'ONGOING' && (
                  <button onClick={() => markStatus(d.id, 'COMPLETED')} disabled={updating === d.id}
                    className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 disabled:opacity-50">
                    Mark Complete
                  </button>
                )}
                {(d.status === 'UPCOMING' || d.status === 'ONGOING') && (
                  <button onClick={() => markStatus(d.id, 'CANCELLED')} disabled={updating === d.id}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && <AddDriveModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  )
}
