import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { hospitalService } from '../../services/hospitalService'
import { Users, BedDouble, Activity, Receipt, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'

const STATUS_COLOR = { ADMITTED: 'bg-orange-50 text-orange-700', DISCHARGED: 'bg-green-50 text-green-700', TRANSFERRED: 'bg-blue-50 text-blue-700' }

export default function HospitalDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    setError(false)
    setLoading(true)
    Promise.all([hospitalService.getStats(), hospitalService.getAdmissions({ status: 'ADMITTED' })])
      .then(([s, a]) => { setStats(s.data); setAdmissions((a.data?.items || []).slice(0, 5)) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <Loader center />
  if (error) return <ErrorState message="Unable to load dashboard." onRetry={load} />

  const STAT_CARDS = [
    { label: 'Current Patients', value: stats?.current_patients ?? 0,    icon: Users,     color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
    { label: 'Available Beds',   value: stats?.available_beds ?? 0,      icon: BedDouble, color: 'bg-green-50 text-green-600',   border: 'border-green-100' },
    { label: 'Occupied Beds',    value: stats?.occupied_beds ?? 0,       icon: Activity,  color: 'bg-red-50 text-red-500',       border: 'border-red-100' },
    { label: 'Pending Bills',    value: stats?.pending_bills ?? 0,       icon: Receipt,   color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-orange-100 text-sm mb-0.5">Hospital Admin</p>
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-orange-100 text-xs mt-1">{stats?.total_beds || 0} beds total · {stats?.occupancy_rate || 0}% occupancy</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{stats?.occupancy_rate || 0}%</p>
          <p className="text-orange-100 text-xs">Bed Occupancy</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl p-4 border shadow-soft ${border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon size={18} strokeWidth={2} /></div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Current Admissions</h3>
          <Link to="/hospital/patients" className="text-orange-600 text-sm font-medium flex items-center gap-1 hover:underline">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        {admissions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No current admissions.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {admissions.map(a => (
              <div key={a.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                  {a.patient_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{a.patient_name}</p>
                  <p className="text-xs text-slate-400 truncate">{a.diagnosis || 'No diagnosis'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">{a.bed_number || 'No bed'}</p>
                  <p className="text-xs font-bold text-orange-600">₹{a.total_bill?.toLocaleString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[a.status]}`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
