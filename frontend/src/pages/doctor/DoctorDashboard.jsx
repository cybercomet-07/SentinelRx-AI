import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { doctorService } from '../../services/doctorService'
import { CalendarDays, Users, CheckCircle, Clock, Star, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'

const STATUS_BADGE = {
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PENDING:   'bg-yellow-50 text-yellow-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-600',
  NO_SHOW:   'bg-gray-100 text-gray-600',
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    setError(false)
    setLoading(true)
    Promise.all([doctorService.getStats(), doctorService.getAppointments()])
      .then(([s, a]) => {
        setStats(s.data)
        const today = new Date().toISOString().slice(0, 10)
        setAppointments((a.data?.items || []).filter(x => x.appointment_date === today))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <Loader center />
  if (error) return <ErrorState message="Unable to load dashboard." onRetry={load} />

  const STAT_CARDS = [
    { label: "Today's Appointments", value: stats?.today_appointments ?? 0,    icon: CalendarDays, color: 'bg-blue-50 text-blue-600',   border: 'border-blue-100' },
    { label: 'Total Patients',        value: stats?.total_patients ?? 0,         icon: Users,        color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
    { label: 'Completed',             value: stats?.completed_appointments ?? 0, icon: CheckCircle,  color: 'bg-green-50 text-green-600',  border: 'border-green-100' },
    { label: 'Pending / Confirmed',   value: stats?.pending_appointments ?? 0,   icon: Clock,        color: 'bg-yellow-50 text-yellow-600', border: 'border-yellow-100' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm mb-0.5">Welcome back,</p>
          <h2 className="text-xl font-bold">Dr. {user?.name}</h2>
          <p className="text-blue-100 text-xs mt-1">You have {stats?.today_appointments || 0} appointments today</p>
        </div>
        {stats?.rating > 0 && (
          <div className="text-center">
            <div className="flex items-center gap-1 bg-white/20 rounded-xl px-3 py-2">
              <Star size={14} className="text-yellow-300 fill-yellow-300" />
              <span className="font-bold text-white">{stats.rating}</span>
            </div>
            <p className="text-blue-100 text-xs mt-1">{stats.total_reviews} reviews</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl p-4 border shadow-soft ${border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Today's Appointments</h3>
          <Link to="/doctor/appointments" className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        {appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No appointments scheduled for today.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointments.map(a => (
              <div key={a.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                  {a.patient_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.patient_name}</p>
                  <p className="text-xs text-slate-400 truncate">{a.symptoms || 'No symptoms listed'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-slate-600">{a.time_slot}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.status] || 'bg-gray-100 text-gray-600'}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
