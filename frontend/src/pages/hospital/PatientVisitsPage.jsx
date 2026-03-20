import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, CalendarClock, User, X, Calendar, Phone, Shield } from 'lucide-react'
import { hospitalService } from '../../services/hospitalService'

const GOVT_SCHEMES = [
  'No Scheme / Self-Pay',
  'Ayushman Bharat (PMJAY)',
  'Central Govt Health Scheme (CGHS)',
  'Employees State Insurance (ESI)',
  'Rashtriya Swasthya Bima Yojana (RSBY)',
  'Mahatma Jyotiba Phule Jan Arogya Yojana (Maharashtra)',
  'Dr. YSR Aarogyashri (Andhra Pradesh)',
  'West Bengal Swasthya Sathi',
  'Rajasthan Govt Health Scheme (RGHS)',
  'Karunya Arogya Suraksha Padhathi (Kerala)',
  'Chiranjeevi Swasthya Bima Yojana (Rajasthan)',
  'Chief Minister CHIS (Tamil Nadu)',
  'Yeshasvini (Karnataka)',
  'Other Scheme',
]

const STATUS_OPTIONS = ['VISITED', 'FOLLOW_UP', 'REFERRED', 'ADMITTED', 'DISCHARGED']
const STATUS_COLOR = {
  VISITED: 'bg-blue-100 text-blue-700',
  FOLLOW_UP: 'bg-amber-100 text-amber-700',
  REFERRED: 'bg-purple-100 text-purple-700',
  ADMITTED: 'bg-orange-100 text-orange-700',
  DISCHARGED: 'bg-green-100 text-green-700',
}

const EMPTY_FORM = {
  patient_name: '', patient_phone: '', patient_age: '', patient_gender: '',
  visit_date: new Date().toISOString().split('T')[0],
  diagnosis: '', treatment: '', prescription_notes: '',
  next_visit_date: '', next_visit_notes: '',
  govt_scheme: 'No Scheme / Self-Pay', status: 'VISITED',
}

export default function PatientVisitsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpcoming, setShowUpcoming] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const load = () => {
    setLoading(true)
    hospitalService.getVisits({ search, upcoming: showUpcoming || undefined })
      .then(r => setItems(r.data.items || []))
      .catch(() => toast.error('Failed to load visits'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, showUpcoming])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (v) => {
    setEditing(v)
    setForm({
      patient_name: v.patient_name, patient_phone: v.patient_phone || '',
      patient_age: v.patient_age || '', patient_gender: v.patient_gender || '',
      visit_date: v.visit_date, diagnosis: v.diagnosis || '',
      treatment: v.treatment || '', prescription_notes: v.prescription_notes || '',
      next_visit_date: v.next_visit_date || '', next_visit_notes: v.next_visit_notes || '',
      govt_scheme: v.govt_scheme || 'No Scheme / Self-Pay', status: v.status,
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.patient_name.trim()) return toast.error('Patient name is required')
    setSaving(true)
    try {
      const payload = { ...form, patient_age: form.patient_age ? +form.patient_age : null }
      if (editing) {
        await hospitalService.updateVisit(editing.id, payload)
        toast.success('Visit record updated')
      } else {
        await hospitalService.createVisit(payload)
        toast.success('Visit recorded')
      }
      setShowModal(false)
      load()
    } catch { toast.error('Failed to save visit') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this visit record?')) return
    try {
      await hospitalService.deleteVisit(id)
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const upcomingCount = items.filter(v => v.next_visit_date && new Date(v.next_visit_date) >= new Date()).length

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Visits</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {items.length} records
            {upcomingCount > 0 && !showUpcoming && (
              <span className="ml-2 text-amber-600 font-medium">· {upcomingCount} upcoming follow-ups</span>
            )}
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> New Visit
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <button
          onClick={() => setShowUpcoming(s => !s)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
            showUpcoming ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
          }`}>
          <CalendarClock size={15} /> Upcoming Follow-ups
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <User size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">{showUpcoming ? 'No upcoming follow-ups' : 'No visit records yet'}</p>
          <p className="text-slate-400 text-sm mt-1">Click "New Visit" to record a patient visit</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(v => (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Summary row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(expanded === v.id ? null : v.id)}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {v.patient_name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{v.patient_name}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {v.patient_age && <span className="text-xs text-slate-500">{v.patient_age}y {v.patient_gender || ''}</span>}
                    {v.patient_phone && <span className="flex items-center gap-0.5 text-xs text-slate-500"><Phone size={10} />{v.patient_phone}</span>}
                    {v.govt_scheme && v.govt_scheme !== 'No Scheme / Self-Pay' && (
                      <span className="flex items-center gap-0.5 text-xs text-blue-600 font-medium"><Shield size={10} />{v.govt_scheme}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[v.status] || 'bg-slate-100 text-slate-600'}`}>{v.status}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Calendar size={10} />{v.visit_date}</span>
                </div>
                <div className="flex gap-1.5 ml-2">
                  <button onClick={e => { e.stopPropagation(); openEdit(v) }} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Pencil size={13} /></button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(v.id) }} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === v.id && (
                <div className="border-t border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50">
                  {v.diagnosis && <Detail label="Diagnosis" value={v.diagnosis} />}
                  {v.treatment && <Detail label="Treatment" value={v.treatment} />}
                  {v.prescription_notes && <Detail label="Prescription Notes" value={v.prescription_notes} className="sm:col-span-2" />}
                  {v.next_visit_date && (
                    <div className="sm:col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
                      <CalendarClock size={16} className="text-amber-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">Next Visit: {v.next_visit_date}</p>
                        {v.next_visit_notes && <p className="text-xs text-amber-700 mt-0.5">{v.next_visit_notes}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-lg">{editing ? 'Edit Visit Record' : 'New Patient Visit'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Patient Info */}
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Patient Information</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Name *</label>
                  <input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input value={form.patient_phone} onChange={e => setForm(f => ({ ...f, patient_phone: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
                  <input type="number" min="0" max="120" value={form.patient_age} onChange={e => setForm(f => ({ ...f, patient_age: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                  <select value={form.patient_gender} onChange={e => setForm(f => ({ ...f, patient_gender: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Visit Date *</label>
                  <input type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" required />
                </div>

                {/* Clinical Info */}
                <div className="col-span-2 pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Clinical Details</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Diagnosis</label>
                  <input value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Treatment</label>
                  <textarea rows={2} value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Prescription Notes</label>
                  <textarea rows={2} value={form.prescription_notes} onChange={e => setForm(f => ({ ...f, prescription_notes: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                </div>

                {/* Follow-up & Scheme */}
                <div className="col-span-2 pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Follow-up & Scheme</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Next Visit Date</label>
                  <input type="date" value={form.next_visit_date} onChange={e => setForm(f => ({ ...f, next_visit_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Follow-up Notes</label>
                  <input value={form.next_visit_notes} onChange={e => setForm(f => ({ ...f, next_visit_notes: e.target.value }))}
                    placeholder="e.g. Blood test required, bring reports"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Government Scheme</label>
                  <select value={form.govt_scheme} onChange={e => setForm(f => ({ ...f, govt_scheme: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    {GOVT_SCHEMES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                  {saving ? 'Saving…' : editing ? 'Update Visit' : 'Save Visit'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  )
}
