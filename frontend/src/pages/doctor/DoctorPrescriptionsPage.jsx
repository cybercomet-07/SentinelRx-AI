import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FileText, User, Calendar, Search, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { doctorService } from '../../services/doctorService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const navigate = useNavigate()

  const load = () => {
    setError(false)
    setLoading(true)
    doctorService.getPrescriptions()
      .then(r => setPrescriptions(r.data.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading && prescriptions.length === 0) return <Loader center />
  if (error && prescriptions.length === 0) return <ErrorState message="Unable to load prescriptions." onRetry={load} />

  const filtered = prescriptions.filter(p => {
    const s = search.toLowerCase()
    return !s || p.patient_name?.toLowerCase().includes(s) || p.prescription_issued?.toLowerCase().includes(s)
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescriptions Issued</h1>
          <p className="text-slate-500 text-sm mt-0.5">All digital prescriptions you have issued</p>
        </div>
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          <Plus size={15} /> Issue New
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by patient name or medicine..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <FileText size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No prescriptions yet</p>
          <p className="text-slate-400 text-sm mb-4">Issue a prescription from a completed appointment</p>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            Go to Appointments
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rx => (
            <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(expanded === rx.id ? null : rx.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <FileText size={18} className="text-teal-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 text-sm">{rx.patient_name}</p>
                    <p className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Calendar size={10} /> {rx.appointment_date}
                      {rx.appointment_type && <span>· {rx.appointment_type}</span>}
                    </p>
                  </div>
                </div>
                {expanded === rx.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {expanded === rx.id && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  {rx.symptoms && (
                    <p className="text-xs text-slate-500 mb-2">
                      <span className="font-medium text-slate-600">Symptoms:</span> {rx.symptoms}
                    </p>
                  )}
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-teal-700 mb-1">Prescription</p>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{rx.prescription_issued}</pre>
                  </div>
                  {rx.notes && (
                    <p className="text-xs text-slate-500 mt-2">
                      <span className="font-medium text-slate-600">Notes:</span> {rx.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
