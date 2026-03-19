import { useState } from 'react'
import Modal from '../ui/Modal'
import { medicineService } from '../../services/medicineService'
import toast from 'react-hot-toast'

const EMPTY = { name: '', category: '', price: '', quantity: '', description: '', image_url: '', product_id: '', pin: '', manufacturing_date: '', expiry_date: '' }

export default function AddMedicineModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.quantity) { toast.error('Fill required fields'); return }
    setSaving(true)
    try {
      await medicineService.create({
        ...form,
        price: +form.price,
        quantity: +form.quantity,
        product_id: form.product_id || undefined,
        pin: form.pin || undefined,
        manufacturing_date: form.manufacturing_date || undefined,
        expiry_date: form.expiry_date || undefined,
      })
      toast.success('Medicine added!')
      onSuccess?.()
      onClose()
      setForm(EMPTY)
    } catch { toast.error('Failed to add medicine') }
    finally { setSaving(false) }
  }

  const fields = [
    { k: 'name', label: 'Name *', placeholder: 'e.g. Paracetamol 500mg' },
    { k: 'product_id', label: 'Product ID', placeholder: 'e.g. 202796' },
    { k: 'pin', label: 'PIN', placeholder: 'e.g. 00795287' },
    { k: 'category', label: 'Category', placeholder: 'e.g. Pain Relief' },
    { k: 'price', label: 'Price (₹) *', placeholder: '20', type: 'number' },
    { k: 'quantity', label: 'Quantity *', placeholder: '100', type: 'number' },
    { k: 'manufacturing_date', label: 'Manufacturing Date', type: 'date' },
    { k: 'expiry_date', label: 'Expiry Date', type: 'date' },
    { k: 'image_url', label: 'Image URL', placeholder: 'https://...' },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Add New Medicine">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ k, label, placeholder, type = 'text' }) => (
            <div key={k} className={k === 'name' ? 'col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[k]}
                onChange={e => set(k, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mint-300 focus:border-transparent"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            placeholder="Short description…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mint-300 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-mint-500 hover:bg-mint-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
            {saving ? 'Saving…' : 'Add Medicine'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
