import { useState, useEffect } from 'react'
import { hospitalService } from '../../services/hospitalService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import { Search, AlertTriangle } from 'lucide-react'

export default function HospitalInventoryPage() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setError(false)
    setLoading(true)
    hospitalService.getInventory({ search: search || undefined })
      .then(r => setMedicines(r.data?.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSearch = (e) => {
    if (e.key === 'Enter') load()
  }

  if (loading) return <Loader center />
  if (error) return <ErrorState onRetry={load} />

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search medicine… (Enter to search)"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Medicine', 'Category', 'Price', 'Stock', 'Expiry', 'Rx Required'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {medicines.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No medicines found.</td></tr>
              ) : medicines.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">{m.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">₹{m.price}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {m.stock < 20 && <AlertTriangle size={13} className="text-red-500" />}
                      <span className={m.stock < 20 ? 'text-red-600 font-semibold' : 'text-slate-700'}>{m.stock}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{m.expiry_date || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.requires_prescription ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                      {m.requires_prescription ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
