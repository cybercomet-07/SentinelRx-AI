import { useState, useEffect } from 'react'
import { prescriptionService } from '../../services/prescriptionService'
import { medicineService } from '../../services/medicineService'
import { FileText, Send, Plus, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [adminReply, setAdminReply] = useState('')
  const [recommendedMedicines, setRecommendedMedicines] = useState([]) // [{ medicine_id, quantity }]
  const [saving, setSaving] = useState(false)
  const [medicineSearch, setMedicineSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    prescriptionService.adminList()
      .then((res) => setPrescriptions(res.data || []))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    medicineService.getAll({ limit: 100 })
      .then((res) => setMedicines(res.data?.items || []))
      .catch(() => setMedicines([]))
  }, [])

  useEffect(() => {
    if (selected) {
      setAdminReply(selected.admin_reply || '')
      setRecommendedMedicines((selected.recommended_medicines || []).map((rm) => ({
        medicine_id: rm.medicine_id,
        quantity: rm.quantity,
        medicine_name: rm.medicine_name,
        medicine_price: rm.medicine_price,
      })))
    }
  }, [selected])

  useEffect(() => {
    if (!medicineSearch.trim()) {
      setSearchResults([])
      return
    }
    const term = medicineSearch.toLowerCase()
    const matches = medicines.filter(
      (m) => m.name?.toLowerCase().includes(term) && m.quantity > 0
    ).slice(0, 8)
    setSearchResults(matches)
  }, [medicineSearch, medicines])

  const addMedicine = (med, qty = 1) => {
    if (recommendedMedicines.some((r) => r.medicine_id === med.id)) return
    setRecommendedMedicines((prev) => [
      ...prev,
      { medicine_id: med.id, quantity: qty, medicine_name: med.name, medicine_price: med.price },
    ])
    setMedicineSearch('')
    setSearchResults([])
  }

  const removeMedicine = (medicineId) => {
    setRecommendedMedicines((prev) => prev.filter((r) => r.medicine_id !== medicineId))
  }

  const updateQuantity = (medicineId, quantity) => {
    setRecommendedMedicines((prev) =>
      prev.map((r) => (r.medicine_id === medicineId ? { ...r, quantity: Math.max(1, quantity) } : r))
    )
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await prescriptionService.adminUpdate(selected.id, {
        admin_reply: adminReply.trim() || null,
        recommended_medicines: recommendedMedicines.map((r) => ({
          medicine_id: r.medicine_id,
          quantity: r.quantity,
        })),
      })
      toast.success('Prescription updated')
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...p, admin_reply: adminReply, recommended_medicines: recommendedMedicines } : p))
      )
      setSelected(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText size={24} className="text-mint-600" />
        <h1 className="text-xl font-semibold text-gray-900">Prescription Management</h1>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* List */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 size={24} className="animate-spin text-mint-500" />
              </div>
            ) : prescriptions.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">No prescriptions yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                {prescriptions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selected?.id === p.id ? 'bg-mint-50 border-l-4 border-mint-500' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-900">#{p.id} · {p.patient_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                    {p.admin_reply && (
                      <span className="inline-block mt-1 text-xs bg-mint-100 text-mint-700 px-2 py-0.5 rounded">
                        Replied
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Prescription #{selected.id} · {selected.patient_name}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {selected.image_url && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">Prescription photo</p>
                  <img
                    src={selected.image_url}
                    alt="Prescription"
                    className="max-h-64 rounded-lg border border-gray-200 object-contain"
                  />
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Prescription text</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {selected.prescription_text}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Your reply to user</label>
                <textarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="Type your reply, recommended medicines, instructions..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Recommended medicines (user can buy)</label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={medicineSearch}
                    onChange={(e) => setMedicineSearch(e.target.value)}
                    placeholder="Search medicine to add..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {searchResults.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addMedicine(m)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex justify-between"
                        >
                          <span>{m.name}</span>
                          <span className="text-gray-500">₹{m.price} · Stock: {m.quantity}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {recommendedMedicines.map((r) => (
                    <div
                      key={r.medicine_id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{r.medicine_name}</p>
                        <p className="text-xs text-gray-500">₹{r.medicine_price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={r.quantity}
                          onChange={(e) => updateQuantity(r.medicine_id, parseInt(e.target.value, 10) || 1)}
                          className="w-14 px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedicine(r.medicine_id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-mint-500 hover:bg-mint-600 disabled:opacity-60 text-white rounded-lg font-medium"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Save reply & medicines
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p>Select a prescription to view and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
