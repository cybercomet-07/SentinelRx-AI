import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, Receipt, X, Camera, QrCode, Banknote, CheckCircle, Clock, AlertCircle, Shield, IndianRupee } from 'lucide-react'
import { hospitalService } from '../../services/hospitalService'

const GOVT_SCHEMES = [
  'No Scheme / Self-Pay',
  'Ayushman Bharat (PMJAY)',
  'Central Govt Health Scheme (CGHS)',
  'Employees State Insurance (ESI)',
  'Rashtriya Swasthya Bima Yojana (RSBY)',
  'Mahatma Jyotiba Phule Jan Arogya Yojana (Maharashtra)',
  'Dr. YSR Aarogyashri (Andhra Pradesh)',
  'West Bengal Swasthya Sathi',
  'Rajasthan Govt Health Scheme (RGHS)',
  'Karunya Arogya Suraksha Padhathi (Kerala)',
  'Chiranjeevi Swasthya Bima Yojana (Rajasthan)',
  'Chief Minister CHIS (Tamil Nadu)',
  'Yeshasvini (Karnataka)',
  'Other Scheme',
]

const STATUS_COLOR = {
  PAID:    'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
}
const STATUS_ICON = {
  PAID:    CheckCircle,
  PENDING: Clock,
  PARTIAL: AlertCircle,
}

const EMPTY_FORM = {
  patient_name: '', patient_phone: '',
  services_description: '',
  total_amount: '', amount_paid: '',
  payment_method: 'COD',
  payment_status: 'PENDING',
  govt_scheme: 'No Scheme / Self-Pay',
  bill_date: new Date().toISOString().split('T')[0],
  notes: '',
}

export default function HospitalBillingPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [qrFile, setQrFile] = useState(null)
  const [qrPreview, setQrPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const fileRef = useRef()

  const load = () => {
    setLoading(true)
    hospitalService.getBills({ search, payment_status: statusFilter || undefined })
      .then(r => setItems(r.data.items || []))
      .catch(() => toast.error('Failed to load bills'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, statusFilter])

  const openAdd = () => {
    setForm(EMPTY_FORM); setQrFile(null); setQrPreview(null); setShowModal(true)
  }

  const handleQrSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')
    setQrFile(file)
    setQrPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.patient_name.trim()) return toast.error('Patient name is required')
    if (!form.total_amount || +form.total_amount <= 0) return toast.error('Enter a valid total amount')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      if (qrFile) fd.append('qr_image', qrFile)
      await hospitalService.createBill(fd)
      toast.success('Bill created successfully')
      setShowModal(false)
      load()
    } catch { toast.error('Failed to create bill') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return
    try {
      await hospitalService.deleteBill(id)
      toast.success('Bill deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const handleMarkPaid = async (bill) => {
    try {
      await hospitalService.updateBill(bill.id, { payment_status: 'PAID', amount_paid: bill.total_amount })
      toast.success('Marked as PAID')
      load()
    } catch { toast.error('Failed to update') }
  }

  const totalRevenue = items.filter(b => b.payment_status === 'PAID').reduce((s, b) => s + b.amount_paid, 0)
  const pendingCount = items.filter(b => b.payment_status === 'PENDING').length

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Billing & Payments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{items.length} bills · ₹{totalRevenue.toFixed(0)} collected · {pendingCount} pending</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Create Bill
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Collected', value: `₹${totalRevenue.toFixed(0)}`, color: 'bg-green-50 border-green-100 text-green-700' },
          { label: 'Pending Bills', value: pendingCount, color: 'bg-amber-50 border-amber-100 text-amber-700' },
          { label: 'Total Bills', value: items.length, color: 'bg-blue-50 border-blue-100 text-blue-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-2xl border p-4 ${c.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
        </select>
      </div>

      {/* Bills list */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Receipt size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No bills yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first bill to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(b => {
            const StatusIcon = STATUS_ICON[b.payment_status] || Clock
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {b.patient_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{b.patient_name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="flex items-center gap-0.5 text-xs text-slate-500">
                        {b.payment_method === 'QR' ? <QrCode size={10} /> : <Banknote size={10} />}
                        {b.payment_method}
                      </span>
                      {b.govt_scheme && b.govt_scheme !== 'No Scheme / Self-Pay' && (
                        <span className="flex items-center gap-0.5 text-xs text-blue-600 font-medium">
                          <Shield size={10} />{b.govt_scheme}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{b.bill_date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="flex items-center gap-1 font-bold text-slate-900 text-base">
                      <IndianRupee size={13} />{b.total_amount.toFixed(0)}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[b.payment_status] || 'bg-slate-100 text-slate-600'}`}>
                      <StatusIcon size={10} />{b.payment_status}
                    </span>
                  </div>
                  <div className="flex gap-1.5 ml-2">
                    {b.payment_status !== 'PAID' && (
                      <button onClick={e => { e.stopPropagation(); handleMarkPaid(b) }}
                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Mark as Paid">
                        <CheckCircle size={13} />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); handleDelete(b.id) }}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>

                {expanded === b.id && (
                  <div className="border-t border-slate-100 p-4 grid grid-cols-2 gap-4 bg-slate-50/50 text-sm">
                    {b.services_description && (
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Services</p>
                        <p className="text-slate-800 whitespace-pre-wrap">{b.services_description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Total Amount</p>
                      <p className="font-bold text-slate-900">₹{b.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Amount Paid</p>
                      <p className="font-bold text-green-600">₹{b.amount_paid.toFixed(2)}</p>
                    </div>
                    {b.balance > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Balance Due</p>
                        <p className="font-bold text-red-600">₹{b.balance.toFixed(2)}</p>
                      </div>
                    )}
                    {b.qr_image_url && (
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Payment QR</p>
                        <img src={b.qr_image_url} alt="Payment QR" className="w-32 h-32 object-contain rounded-xl border border-slate-200 bg-white p-1" />
                      </div>
                    )}
                    {b.notes && (
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Notes</p>
                        <p className="text-slate-600">{b.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-lg">Create Bill</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Patient */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Name *</label>
                  <input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input value={form.patient_phone} onChange={e => setForm(f => ({ ...f, patient_phone: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bill Date *</label>
                  <input type="date" value={form.bill_date} onChange={e => setForm(f => ({ ...f, bill_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" required />
                </div>

                {/* Services */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Services / Items</label>
                  <textarea rows={3} value={form.services_description} onChange={e => setForm(f => ({ ...f, services_description: e.target.value }))}
                    placeholder="e.g. Consultation - ₹300, Blood Test - ₹200, X-Ray - ₹500"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                </div>

                {/* Amounts */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Total Amount (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Paid (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.amount_paid} onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>

                {/* Payment method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                  <div className="flex gap-2">
                    {['COD', 'QR'].map(m => (
                      <button key={m} type="button"
                        onClick={() => setForm(f => ({ ...f, payment_method: m }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                          form.payment_method === m
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50'
                        }`}>
                        {m === 'COD' ? <Banknote size={14} /> : <QrCode size={14} />}
                        {m === 'COD' ? 'Cash' : 'UPI / QR'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Status</label>
                  <select value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                  </select>
                </div>

                {/* QR Photo upload — shown only when QR selected */}
                {form.payment_method === 'QR' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Patient's Payment QR Code
                      <span className="text-slate-400 font-normal ml-1">(take a photo of patient's QR)</span>
                    </label>
                    <input ref={fileRef} type="file" accept="image/*" capture="environment"
                      onChange={handleQrSelect} className="hidden" />
                    {qrPreview ? (
                      <div className="flex items-center gap-3">
                        <img src={qrPreview} alt="QR Preview" className="w-24 h-24 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1" />
                        <div className="space-y-2">
                          <p className="text-xs text-green-600 font-medium">QR image selected</p>
                          <button type="button" onClick={() => { setQrFile(null); setQrPreview(null); fileRef.current.value = '' }}
                            className="text-xs text-red-500 hover:text-red-700">Remove</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current.click()}
                        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-orange-200 rounded-xl text-orange-500 hover:bg-orange-50 transition-colors text-sm font-medium">
                        <Camera size={18} /> Scan / Upload QR Image
                      </button>
                    )}
                  </div>
                )}

                {/* Govt Scheme */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Government Scheme</label>
                  <select value={form.govt_scheme} onChange={e => setForm(f => ({ ...f, govt_scheme: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    {GOVT_SCHEMES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
              </div>

              {/* Balance preview */}
              {form.total_amount && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Balance Due</span>
                  <span className="font-bold text-slate-900">
                    ₹{Math.max(0, (+form.total_amount || 0) - (+form.amount_paid || 0)).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                  {saving ? 'Creating…' : 'Create Bill'}
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
