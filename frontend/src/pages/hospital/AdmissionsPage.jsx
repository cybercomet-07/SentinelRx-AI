import { useState, useEffect } from 'react'
import { hospitalService } from '../../services/hospitalService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import toast from 'react-hot-toast'
import { Plus, Search, IndianRupee, LogOut } from 'lucide-react'

const STATUS_CONFIG = {
  ADMITTED:    { label: 'Admitted',    class: 'bg-orange-50 text-orange-700 border-orange-200' },
  DISCHARGED:  { label: 'Discharged', class: 'bg-green-50 text-green-700 border-green-200' },
  TRANSFERRED: { label: 'Transferred', class: 'bg-blue-50 text-blue-700 border-blue-200' },
}

function AddAdmissionModal({ onClose, onSaved }) {
  const [beds, setBeds] = useState([])
  const [form, setForm] = useState({ patient_name: '', patient_phone: '', patient_age: '', patient_gender: 'Male', diagnosis: '', admit_date: new Date().toISOString().slice(0, 10), total_bill: 0, bed_id: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    hospitalService.getBeds({ status: 'AVAILABLE' }).then(r => setBeds(r.data?.items || []))
  }, [])

  const save = async () => {
    if (!form.patient_name || !form.admit_date) return toast.error('Patient name and admit date are required')
    setSaving(true)
    try {
      await hospitalService.createAdmission({ ...form, bed_id: form.bed_id || null })
      toast.success('Patient admitted!')
      onSaved()
      onClose()
    } catch { toast.error('Failed to admit patient') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-float w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-slate-800 mb-4">Admit New Patient</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Patient Name *</label>
              <input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
              <input value={form.patient_phone} onChange={e => setForm(f => ({ ...f, patient_phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Age</label>
              <input type="number" value={form.patient_age} onChange={e => setForm(f => ({ ...f, patient_age: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
              <select value={form.patient_gender} onChange={e => setForm(f => ({ ...f, patient_gender: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Diagnosis</label>
            <input value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Admit Date *</label>
              <input type="date" value={form.admit_date} onChange={e => setForm(f => ({ ...f, admit_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Initial Bill (₹)</label>
              <input type="number" value={form.total_bill} onChange={e => setForm(f => ({ ...f, total_bill: parseFloat(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Assign Bed (optional)</label>
            <select value={form.bed_id} onChange={e => setForm(f => ({ ...f, bed_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
              <option value="">— No bed assigned —</option>
              {beds.map(b => <option key={b.id} value={b.id}>{b.bed_number} ({b.ward})</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Admitting…' : 'Admit Patient'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setError(false)
    setLoading(true)
    hospitalService.getAdmissions()
      .then(r => setAdmissions(r.data?.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const discharge = async (id) => {
    setUpdating(id)
    try {
      const today = new Date().toISOString().slice(0, 10)
      await hospitalService.updateAdmission(id, { status: 'DISCHARGED', discharge_date: today })
      load()
      toast.success('Patient discharged')
    } catch { toast.error('Failed to discharge') }
    finally { setUpdating(null) }
  }

  const displayed = admissions.filter(a => {
    const matchS = filterStatus === 'All' || a.status === filterStatus
    const matchQ = !search || a.patient_name?.toLowerCase().includes(search.toLowerCase())
    return matchS && matchQ
  })

  if (loading) return <Loader center />
  if (error) return <ErrorState onRetry={load} />

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient…"
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white w-52" />
          </div>
          {['All', 'ADMITTED', 'DISCHARGED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${filterStatus === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-gray-200'}`}>
              {s === 'All' ? 'All' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus size={15} /> Admit Patient
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Patient', 'Bed', 'Diagnosis', 'Admit Date', 'Discharge', 'Bill', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">No admissions found.</td></tr>
              ) : displayed.map(a => {
                const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.ADMITTED
                return (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{a.patient_name}</p>
                      <p className="text-xs text-slate-400">{a.patient_age ? `${a.patient_age}y` : ''} {a.patient_gender || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{a.bed_number || '—'}</td>
                    <td className="px-4 py-3 max-w-[150px]"><p className="text-xs text-slate-600 truncate">{a.diagnosis || '—'}</p></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{a.admit_date}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{a.discharge_date || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-700 font-semibold text-xs">
                        <IndianRupee size={11} />{a.total_bill?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.class}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === 'ADMITTED' && (
                        <button onClick={() => discharge(a.id)} disabled={updating === a.id}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium disabled:opacity-50">
                          <LogOut size={13} /> Discharge
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && <AddAdmissionModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  )
}
