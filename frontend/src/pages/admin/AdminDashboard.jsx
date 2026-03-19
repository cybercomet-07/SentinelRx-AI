import { useState, useEffect } from 'react'
import DashboardStats from '../../components/admin/DashboardStats'
import ExpiringMedicinesAlert from '../../components/admin/ExpiringMedicinesAlert'
import RevenueChart from '../../components/admin/RevenueChart'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import { adminService } from '../../services/adminService'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const load = () => {
    setError(false)
    setErrorMsg('')
    setLoading(true)
    adminService.getDashboardStats()
      .then(r => setStats(r.data))
      .catch((err) => {
        setError(true)
        const detail = err?.response?.data?.detail
        const msg = err?.code === 'ERR_NETWORK' || !err?.response
          ? 'Cannot connect. Make sure the backend is running on port 8000.'
          : (typeof detail === 'string' ? detail : 'Unable to load.')
        setErrorMsg(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])
  useEffect(() => {
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <Loader center />
  if (error) return <ErrorState message={errorMsg} onRetry={load} />

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <DashboardStats stats={stats} />
      <RevenueChart data={stats?.monthly_data ?? []} />

      {stats?.expiring_medicines_count > 0 && (
        <ExpiringMedicinesAlert count={stats.expiring_medicines_count} />
      )}

      {stats?.top_medicines?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-semibold text-gray-900 mb-4">Top Medicines This Month</h3>
          <div className="space-y-2">
            {stats.top_medicines.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-mint-50 text-mint-700'}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-800">{m.name}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{m.orders} orders</span>
                <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-mint-400 rounded-full" style={{ width: `${(m.orders / stats.top_medicines[0].orders) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
