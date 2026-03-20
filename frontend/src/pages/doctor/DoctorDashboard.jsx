import { useAuth } from '../../hooks/useAuth'
import { CalendarDays, Users, FileText, Star, Clock, TrendingUp } from 'lucide-react'

const STATS = [
  { label: "Today's Appointments", value: '—', icon: CalendarDays, color: 'bg-blue-50 text-blue-600' },
  { label: 'Total Patients',        value: '—', icon: Users,        color: 'bg-purple-50 text-purple-600' },
  { label: 'Prescriptions Issued',  value: '—', icon: FileText,     color: 'bg-green-50 text-green-600' },
  { label: 'Average Rating',        value: '—', icon: Star,         color: 'bg-yellow-50 text-yellow-600' },
]

export default function DoctorDashboard() {
  const { user } = useAuth()

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold">Dr. {user?.name} 👋</h2>
        <p className="text-blue-100 text-sm mt-1">Your doctor portal is ready. Features coming in Phase 1.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-blue-500" />
          <h3 className="font-semibold text-slate-800">Upcoming Features (Phase 1)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            '📅 Manage appointment slots',
            '👤 View patient history',
            '💊 AI drug suggestions',
            '📋 Issue digital prescriptions',
            '🎥 Video consultations',
            '⭐ Patient reviews & ratings',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
