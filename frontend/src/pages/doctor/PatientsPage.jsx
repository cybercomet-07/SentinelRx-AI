import { useState, useEffect } from 'react'
import { doctorService } from '../../services/doctorService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import { Search, CalendarDays, User } from 'lucide-react'

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setError(false)
    setLoading(true)
    doctorService.getPatients()
      .then(r => setPatients(r.data?.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = patients.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Loader center />
  if (error) return <ErrorState onRetry={load} />

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search patients…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Patient', 'Contact', 'Gender / DOB', 'Total Visits', 'Last Visit', 'Last Symptoms'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No patients yet.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-semibold text-xs">
                        {p.name?.[0]?.toUpperCase()}
                      </div>
                      <p className="font-medium text-slate-800">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-600 text-xs">{p.email}</p>
                    <p className="text-slate-400 text-xs">{p.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {p.gender || '—'} {p.date_of_birth ? `/ ${p.date_of_birth}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {p.total_appointments}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <CalendarDays size={13} className="text-slate-400" />
                      {p.last_visit || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-xs text-slate-500 truncate">{p.last_symptoms || '—'}</p>
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
