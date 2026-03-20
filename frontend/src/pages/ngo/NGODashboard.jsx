import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ngoService } from '../../services/ngoService'
import { Users, Droplets, Gift, IndianRupee, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Loader from '../../components/ui/Loader'

const CAMP_STATUS = { UPCOMING: 'bg-yellow-50 text-yellow-700', ONGOING: 'bg-blue-50 text-blue-700', COMPLETED: 'bg-green-50 text-green-700', CANCELLED: 'bg-red-50 text-red-600' }

export default function NGODashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [camps, setCamps] = useState([])
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([ngoService.getStats(), ngoService.getBloodCamps(), ngoService.getDonations()])
      .then(([s, c, d]) => {
        setStats(s.data)
        setCamps((c.data?.items || []).slice(0, 3))
        setDrives((d.data?.items || []).filter(x => x.status === 'ONGOING').slice(0, 3))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader center />

  const STAT_CARDS = [
    { label: 'Beneficiaries',    value: stats?.total_beneficiaries ?? 0, icon: Users,       color: 'bg-green-50 text-green-600',  border: 'border-green-100' },
    { label: 'Scheme Eligible',  value: stats?.scheme_eligible ?? 0,     icon: Users,       color: 'bg-teal-50 text-teal-600',    border: 'border-teal-100' },
    { label: 'Units Collected',  value: stats?.units_collected ?? 0,     icon: Droplets,    color: 'bg-red-50 text-red-600',      border: 'border-red-100' },
    { label: 'Total Raised (₹)', value: `₹${(stats?.total_raised ?? 0).toLocaleString()}`, icon: IndianRupee, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-2xl p-5 text-white">
        <p className="text-green-100 text-sm mb-0.5">NGO Portal</p>
        <h2 className="text-xl font-bold">{user?.name} 🤝</h2>
        <p className="text-green-100 text-xs mt-1">{stats?.total_beneficiaries || 0} beneficiaries · {stats?.blood_camps || 0} blood camps · {stats?.donation_drives || 0} drives</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl p-4 border shadow-soft ${border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon size={18} strokeWidth={2} /></div>
            <p className="text-xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Blood Camps */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Droplets size={15} className="text-red-500" /> Blood Camps</h3>
            <Link to="/ngo/blood-camps" className="text-green-600 text-xs font-medium flex items-center gap-1 hover:underline">View all <ChevronRight size={12} /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {camps.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">No camps yet.</div>
              : camps.map(c => (
                <div key={c.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.date} · {c.location}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-red-600">{c.collected_units}/{c.target_units} units</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CAMP_STATUS[c.status]}`}>{c.status}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Donation Drives */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Gift size={15} className="text-purple-500" /> Active Drives</h3>
            <Link to="/ngo/donations" className="text-green-600 text-xs font-medium flex items-center gap-1 hover:underline">View all <ChevronRight size={12} /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {drives.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">No active drives.</div>
              : drives.map(d => (
                <div key={d.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-800 truncate flex-1">{d.title}</p>
                    <p className="text-xs font-bold text-green-700 ml-2">{d.progress_pct}%</p>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(d.progress_pct, 100)}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">₹{d.raised_amount?.toLocaleString()} / ₹{d.target_amount?.toLocaleString()}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
