import { useAuth } from '../../hooks/useAuth'
import { Users, Droplets, Gift, Heart, TrendingUp } from 'lucide-react'

const STATS = [
  { label: 'Beneficiaries',    value: '—', icon: Users,    color: 'bg-green-50 text-green-600' },
  { label: 'Blood Camps',      value: '—', icon: Droplets, color: 'bg-red-50 text-red-600' },
  { label: 'Donation Drives',  value: '—', icon: Gift,     color: 'bg-purple-50 text-purple-600' },
  { label: 'Lives Impacted',   value: '—', icon: Heart,    color: 'bg-pink-50 text-pink-600' },
]

export default function NGODashboard() {
  const { user } = useAuth()
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
        <p className="text-green-100 text-sm mb-1">NGO Portal</p>
        <h2 className="text-2xl font-bold">{user?.name} 🤝</h2>
        <p className="text-green-100 text-sm mt-1">NGO Management Panel — Features coming in Phase 5.</p>
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
          <TrendingUp size={20} className="text-green-500" />
          <h3 className="font-semibold text-slate-800">Upcoming Features (Phase 5)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            '👥 Beneficiary management',
            '🩸 Blood camp scheduling',
            '💝 Donation drive tracking',
            '🏛️ Govt scheme integration',
            '📊 Impact analytics',
            '📱 SMS/WhatsApp alerts',
          ].map(f => (
            <div key={f} className="p-3 bg-green-50 rounded-xl text-sm text-green-700">{f}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
