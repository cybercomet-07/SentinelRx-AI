import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { medicineService } from '../../services/medicineService'
import toast from 'react-hot-toast'

export default function EditMedicineModal({ open, onClose, medicine, onSuccess }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (medicine) setForm(medicine) }, [medicine])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await medicineService.update(form.id, {
        ...form,
        price: +form.price,
        quantity: +form.quantity,
        product_id: form.product_id || undefined,
        pin: form.pin || undefined,
      })
      toast.success('Updated!')
      onSuccess?.()
      onClose()
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  const fields = [
    { k: 'name', label: 'Name' },
    { k: 'product_id', label: 'Product ID' },
    { k: 'pin', label: 'PIN' },
    { k: 'category', label: 'Category' },
    { k: 'price', label: 'Price (₹)', type: 'number' },
    { k: 'quantity', label: 'Quantity', type: 'number' },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Edit Medicine">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {fields.map(({ k, label, type = 'text' }) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[k] || ''}
                onChange={e => set(k, e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mint-300"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
          <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mint-300 resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-mint-500 hover:bg-mint-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
