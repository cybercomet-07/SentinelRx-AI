import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, AlertTriangle, Pill, X, Package } from 'lucide-react'
import { hospitalService } from '../../services/hospitalService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'

const EMPTY_FORM = {
  name: '', category: '', quantity: 0, unit: 'tablets',
  price: 0, expiry_date: '', manufacturer: '', reorder_level: 10, notes: '',
}

const UNITS = ['tablets', 'capsules', 'ml', 'mg', 'syrup', 'injection', 'cream', 'drops', 'sachets', 'strips']
const CATEGORIES = ['Antibiotics', 'Analgesics', 'Antacids', 'Antivirals', 'Vitamins', 'Cardiac', 'Diabetic', 'Neurological', 'Respiratory', 'Surgical', 'Topical', 'Other']

export default function HospitalMedicinesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setError(false)
    setLoading(true)
    hospitalService.getMedicines({ search })
      .then(r => setItems(r.data.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (m) => {
    setEditing(m)
    setForm({
      name: m.name, category: m.category || '', quantity: m.quantity,
      unit: m.unit, price: m.price, expiry_date: m.expiry_date || '',
      manufacturer: m.manufacturer || '', reorder_level: m.reorder_level, notes: m.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Medicine name is required')
    setSaving(true)
    try {
      if (editing) {
        await hospitalService.updateMedicine(editing.id, form)
        toast.success('Medicine updated')
      } else {
        await hospitalService.createMedicine(form)
        toast.success('Medicine added')
      }
      setShowModal(false)
      load()
    } catch { toast.error('Failed to save medicine') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return
    try {
      await hospitalService.deleteMedicine(id)
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const lowStockCount = items.filter(m => m.low_stock).length

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Medicine Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {items.length} medicines · {lowStockCount > 0 && <span className="text-red-500 font-medium">{lowStockCount} low stock</span>}
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Add Medicine
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search medicines..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300" />
      </div>

      {/* Table */}
      {loading && items.length === 0 ? (
        <Loader center />
      ) : error && items.length === 0 ? (
        <ErrorState message="Failed to load medicines." onRetry={load} />
      ) : loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Pill size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No medicines added yet</p>
          <p className="text-slate-400 text-sm mt-1">Click "Add Medicine" to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50 border-b border-orange-100">
                <tr>
                  {['Medicine', 'Category', 'Stock', 'Price', 'Expiry', 'Reorder At', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                          <Pill size={14} className="text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{m.name}</p>
                          {m.manufacturer && <p className="text-xs text-slate-400">{m.manufacturer}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.category || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {m.low_stock && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                        <span className={`font-semibold ${m.low_stock ? 'text-red-600' : 'text-slate-900'}`}>
                          {m.quantity} {m.unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">₹{m.price}</td>
                    <td className="px-4 py-3">
                      {m.expiry_date ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          new Date(m.expiry_date) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>{m.expiry_date}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{m.reorder_level} {m.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-lg">{editing ? 'Edit Medicine' : 'Add Medicine'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Medicine Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                  <input type="number" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expiry Date</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Reorder Level</label>
                  <input type="number" min="0" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: +e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Manufacturer</label>
                  <input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                  {saving ? 'Saving…' : editing ? 'Update Medicine' : 'Add Medicine'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
