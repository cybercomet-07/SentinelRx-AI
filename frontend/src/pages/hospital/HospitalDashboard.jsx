import { useAuth } from '../../hooks/useAuth'
import { Users, BedDouble, Pill, Receipt, TrendingUp } from 'lucide-react'

const STATS = [
  { label: 'Total Patients Today', value: '—', icon: Users,     color: 'bg-orange-50 text-orange-600' },
  { label: 'Beds Available',       value: '—', icon: BedDouble, color: 'bg-blue-50 text-blue-600' },
  { label: 'Medicine Stock Items', value: '—', icon: Pill,      color: 'bg-green-50 text-green-600' },
  { label: 'Pending Bills',        value: '—', icon: Receipt,   color: 'bg-purple-50 text-purple-600' },
]

export default function HospitalDashboard() {
  const { user } = useAuth()
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <p className="text-orange-100 text-sm mb-1">Hospital Admin Portal</p>
        <h2 className="text-2xl font-bold">{user?.name} 🏥</h2>
        <p className="text-orange-100 text-sm mt-1">Hospital Management System — Features coming in Phase 4.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon size={20} strokeWidth={2} /></div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-orange-500" />
          <h3 className="font-semibold text-slate-800">Upcoming Features (Phase 4)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            '🛏️ Real-time bed tracking (ICU/General)',
            '👤 Patient registration with OCR',
            '💊 Medicine inventory management',
            '💵 Auto billing & insurance',
            '🎤 Voice AI commands (Hindi/Marathi)',
            '📊 Hospital analytics dashboard',
          ].map(f => (
            <div key={f} className="p-3 bg-orange-50 rounded-xl text-sm text-orange-700">{f}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
