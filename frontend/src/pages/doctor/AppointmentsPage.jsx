import { useState, useEffect } from 'react'
import { doctorService } from '../../services/doctorService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import { CheckCircle, XCircle, Clock, VideoIcon, Phone, MapPin, Search, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   class: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  CONFIRMED: { label: 'Confirmed', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Completed', class: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-50 text-red-600 border-red-200' },
  NO_SHOW:   { label: 'No Show',   class: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const TYPE_ICON = { 'In Person': MapPin, 'Video': VideoIcon, 'Phone': Phone }

const FILTERS = ['All', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState(null)
  const [rxModal, setRxModal] = useState(null) // appointment object
  const [rxForm, setRxForm] = useState({ medicines: '', prescription_text: '' })
  const [rxSaving, setRxSaving] = useState(false)

  const load = () => {
    setError(false)
    setLoading(true)
    doctorService.getAppointments()
      .then(r => setAppointments(r.data?.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleStatus = async (id, newStatus) => {
    setUpdating(id)
    try {
      const updated = await doctorService.updateAppointment(id, { status: newStatus })
      setAppointments(prev => prev.map(a => a.id === id ? updated.data : a))
      toast.success(`Appointment ${newStatus.toLowerCase()}`)
    } catch {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const handleIssuePrescription = async () => {
    if (!rxForm.prescription_text.trim()) { toast.error('Prescription text is required'); return }
    setRxSaving(true)
    try {
      const updated = await doctorService.issuePrescription(rxModal.id, rxForm)
      setAppointments(prev => prev.map(a => a.id === rxModal.id ? updated.data : a))
      toast.success('Prescription issued')
      setRxModal(null)
      setRxForm({ medicines: '', prescription_text: '' })
    } catch {
      toast.error('Failed to issue prescription')
    } finally {
      setRxSaving(false)
    }
  }

  const displayed = appointments.filter(a => {
    const matchFilter = filter === 'All' || a.status === filter
    const matchSearch = !search || a.patient_name?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  if (loading) return <Loader center />
  if (error) return <ErrorState onRetry={load} />

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-gray-200 hover:border-blue-300'}`}>
              {f === 'All' ? 'All' : STATUS_CONFIG[f]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Patient', 'Date & Time', 'Type', 'Symptoms', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No appointments found.</td></tr>
              ) : displayed.map(a => {
                const TypeIcon = TYPE_ICON[a.appointment_type] || MapPin
                const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.PENDING
                const isUpdating = updating === a.id
                return (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                          {a.patient_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{a.patient_name}</p>
                          <p className="text-xs text-slate-400">{a.patient_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{a.appointment_date}</p>
                      <p className="text-xs text-slate-400">{a.time_slot}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <TypeIcon size={14} />
                        <span className="text-xs">{a.appointment_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-slate-600 truncate">{a.symptoms || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${cfg.class}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {a.status === 'PENDING' && (
                          <button onClick={() => handleStatus(a.id, 'CONFIRMED')} disabled={isUpdating}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50" title="Confirm">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                          <>
                            <button onClick={() => handleStatus(a.id, 'COMPLETED')} disabled={isUpdating}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50" title="Mark Complete">
                              <Clock size={15} />
                            </button>
                            <button onClick={() => handleStatus(a.id, 'CANCELLED')} disabled={isUpdating}
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50" title="Cancel">
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        {(a.status === 'CONFIRMED' || a.status === 'COMPLETED') && (
                          <button
                            onClick={() => { setRxModal(a); setRxForm({ medicines: '', prescription_text: a.prescription_issued || '' }) }}
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
                            title={a.prescription_issued ? 'Edit Prescription' : 'Issue Prescription'}
                          >
                            <FileText size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-right">{displayed.length} appointments shown</p>

      {/* Prescription Modal */}
      {rxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Issue Prescription</h3>
              <button onClick={() => setRxModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Patient: <strong className="text-slate-700">{rxModal.patient_name}</strong> · {rxModal.appointment_date}
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Medicines (one per line)</label>
                <textarea
                  value={rxForm.medicines}
                  onChange={e => setRxForm(f => ({ ...f, medicines: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Paracetamol 500mg – 1 tab 3×/day × 5 days"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Instructions / Notes <span className="text-red-500">*</span></label>
                <textarea
                  value={rxForm.prescription_text}
                  onChange={e => setRxForm(f => ({ ...f, prescription_text: e.target.value }))}
                  rows={3}
                  placeholder="Dosage instructions, rest advice, follow-up..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRxModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleIssuePrescription} disabled={rxSaving}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                {rxSaving ? 'Saving...' : 'Issue Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
