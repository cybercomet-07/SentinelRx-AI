import { useState, useEffect } from 'react'
import { hospitalService } from '../../services/hospitalService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import toast from 'react-hot-toast'
import { Plus, BedDouble } from 'lucide-react'

const BED_TYPES = ['General', 'ICU', 'Private', 'Semi-Private', 'Emergency']
const STATUS_CONFIG = {
  AVAILABLE:   { label: 'Available',   class: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500' },
  OCCUPIED:    { label: 'Occupied',    class: 'bg-red-50 text-red-600 border-red-200',         dot: 'bg-red-500' },
  MAINTENANCE: { label: 'Maintenance', class: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  RESERVED:    { label: 'Reserved',    class: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-500' },
}

function AddBedModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ bed_number: '', ward: '', bed_type: 'General', floor: 1 })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.bed_number || !form.ward) return toast.error('Bed number and ward are required')
    setSaving(true)
    try {
      await hospitalService.createBed(form)
      toast.success('Bed added!')
      onSaved()
      onClose()
    } catch { toast.error('Failed to add bed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-float w-full max-w-md p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Add New Bed</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bed Number *</label>
              <input value={form.bed_number} onChange={e => setForm(f => ({ ...f, bed_number: e.target.value }))}
                placeholder="e.g. G-001"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Floor</label>
              <input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Ward *</label>
            <input value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))}
              placeholder="e.g. General Ward, ICU"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Bed Type</label>
            <select value={form.bed_type} onChange={e => setForm(f => ({ ...f, bed_type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
              {BED_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Adding…' : 'Add Bed'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BedsPage() {
  const [beds, setBeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('All')
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setError(false)
    setLoading(true)
    hospitalService.getBeds()
      .then(r => setBeds(r.data?.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      const updated = await hospitalService.updateBed(id, { status })
      setBeds(prev => prev.map(b => b.id === id ? updated.data : b))
      toast.success(`Bed marked as ${status.toLowerCase()}`)
    } catch { toast.error('Failed to update') }
    finally { setUpdating(null) }
  }

  const displayed = filterStatus === 'All' ? beds : beds.filter(b => b.status === filterStatus)

  // Group by ward
  const byWard = displayed.reduce((acc, b) => {
    if (!acc[b.ward]) acc[b.ward] = []
    acc[b.ward].push(b)
    return acc
  }, {})

  if (loading) return <Loader center />
  if (error) return <ErrorState onRetry={load} />

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          {['All', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterStatus === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-gray-200 hover:border-orange-300'}`}>
              {s === 'All' ? 'All' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus size={15} /> Add Bed
        </button>
      </div>

      {Object.entries(byWard).map(([ward, wardBeds]) => (
        <div key={ward} className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
            <BedDouble size={16} className="text-orange-500" />
            <h3 className="font-semibold text-slate-800">{ward}</h3>
            <span className="ml-auto text-xs text-slate-400">{wardBeds.length} beds</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
            {wardBeds.map(b => {
              const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.AVAILABLE
              return (
                <div key={b.id} className={`rounded-xl border p-3 ${cfg.class} relative`}>
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${cfg.dot}`} />
                  <p className="font-bold text-sm">{b.bed_number}</p>
                  <p className="text-xs opacity-70 mt-0.5">{b.bed_type}</p>
                  <p className="text-xs opacity-60">Floor {b.floor}</p>
                  <div className="mt-2 flex gap-1">
                    {b.status !== 'AVAILABLE' && (
                      <button onClick={() => updateStatus(b.id, 'AVAILABLE')} disabled={updating === b.id}
                        className="text-xs px-1.5 py-0.5 rounded bg-white/60 hover:bg-white font-medium transition-colors disabled:opacity-50">
                        Free
                      </button>
                    )}
                    {b.status !== 'MAINTENANCE' && (
                      <button onClick={() => updateStatus(b.id, 'MAINTENANCE')} disabled={updating === b.id}
                        className="text-xs px-1.5 py-0.5 rounded bg-white/60 hover:bg-white font-medium transition-colors disabled:opacity-50">
                        Maint.
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {showModal && <AddBedModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  )
}
