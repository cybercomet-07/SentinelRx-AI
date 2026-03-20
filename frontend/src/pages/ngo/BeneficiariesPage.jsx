import { useState, useEffect } from 'react'
import { ngoService } from '../../services/ngoService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, CheckCircle } from 'lucide-react'

function AddModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', age: '', gender: 'Female', health_condition: '', scheme_eligible: false, scheme_names: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name) return toast.error('Name is required')
    setSaving(true)
    try {
      await ngoService.createBeneficiary({ ...form, age: form.age ? parseInt(form.age) : null })
      toast.success('Beneficiary added!')
      onSaved(); onClose()
    } catch { toast.error('Failed to add') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-float w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-slate-800 mb-4">Add Beneficiary</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Age</label>
              <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
                {['Female', 'Male', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Health Condition</label>
            <input value={form.health_condition} onChange={e => setForm(f => ({ ...f, health_condition: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="scheme" checked={form.scheme_eligible} onChange={e => setForm(f => ({ ...f, scheme_eligible: e.target.checked }))} className="w-4 h-4 accent-green-600" />
            <label htmlFor="scheme" className="text-sm text-slate-700">Eligible for Govt Scheme</label>
          </div>
          {form.scheme_eligible && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Scheme Names</label>
              <input value={form.scheme_names} onChange={e => setForm(f => ({ ...f, scheme_names: e.target.value }))}
                placeholder="e.g. PM Jan Arogya, MJPJAY"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-medium">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BeneficiariesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setError(false)
    setLoading(true)
    ngoService.getBeneficiaries()
      .then(r => setItems(r.data?.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id) => {
    if (!confirm('Remove this beneficiary?')) return
    setDeleting(id)
    try { await ngoService.deleteBeneficiary(id); setItems(prev => prev.filter(x => x.id !== id)); toast.success('Removed') }
    catch { toast.error('Failed to remove') }
    finally { setDeleting(null) }
  }

  const filtered = items.filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <Loader center />
  if (error) return <ErrorState onRetry={load} />

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex gap-3 items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search beneficiary…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white" />
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Contact', 'Age/Gender', 'Health Condition', 'Scheme', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No beneficiaries found.</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-700 font-semibold text-xs">{b.name?.[0]?.toUpperCase()}</div>
                      <p className="font-medium text-slate-800">{b.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{b.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{b.age ? `${b.age}y` : '—'} {b.gender ? `/ ${b.gender}` : ''}</td>
                  <td className="px-4 py-3 max-w-[180px]"><p className="text-xs text-slate-500 truncate">{b.health_condition || '—'}</p></td>
                  <td className="px-4 py-3">
                    {b.scheme_eligible ? (
                      <div className="flex items-center gap-1 text-green-700">
                        <CheckCircle size={13} className="text-green-500" />
                        <span className="text-xs truncate max-w-[120px]">{b.scheme_names || 'Eligible'}</span>
                      </div>
                    ) : <span className="text-xs text-slate-400">Not eligible</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : b.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && <AddModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  )
}
