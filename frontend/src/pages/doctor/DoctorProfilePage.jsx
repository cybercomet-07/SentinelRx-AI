import { useState, useEffect } from 'react'
import { doctorService } from '../../services/doctorService'
import Loader from '../../components/ui/Loader'
import toast from 'react-hot-toast'
import { Save, Stethoscope, Star, Award } from 'lucide-react'

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics',
  'Gynecology', 'Neurology', 'Psychiatry', 'ENT', 'Ophthalmology', 'Dental', 'Oncology',
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    doctorService.getProfile()
      .then(r => { setProfile(r.data); setForm(r.data) })
      .finally(() => setLoading(false))
  }, [])

  const toggleDay = (day) => {
    const days = (form.available_days || '').split(',').filter(Boolean)
    const newDays = days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    setForm(f => ({ ...f, available_days: newDays.join(',') }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await doctorService.updateProfile(form)
      setProfile(res.data)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader center />

  const activeDays = (form.available_days || '').split(',').filter(Boolean)

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {profile?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Dr. {profile?.name}</h2>
          <p className="text-blue-600 text-sm font-medium">{profile?.specialization}</p>
          <p className="text-slate-400 text-xs">{profile?.email}</p>
        </div>
        {profile?.rating > 0 && (
          <div className="ml-auto flex items-center gap-1.5 bg-yellow-50 px-3 py-2 rounded-xl">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-slate-800">{profile.rating}</span>
            <span className="text-slate-400 text-xs">({profile.total_reviews})</span>
          </div>
        )}
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 space-y-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Stethoscope size={16} className="text-blue-500" /> Professional Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Specialization</label>
            <select value={form.specialization || ''} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">License No.</label>
            <input value={form.license_no || ''} onChange={e => setForm(f => ({ ...f, license_no: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Hospital Name</label>
            <input value={form.hospital_name || ''} onChange={e => setForm(f => ({ ...f, hospital_name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Consultation Fee (₹)</label>
            <input type="number" value={form.consultation_fee || ''} onChange={e => setForm(f => ({ ...f, consultation_fee: parseFloat(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Experience (years)</label>
            <input type="number" value={form.experience_years || ''} onChange={e => setForm(f => ({ ...f, experience_years: parseInt(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Languages</label>
            <input value={form.languages || ''} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))}
              placeholder="e.g. English, Hindi, Marathi"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Hospital Address</label>
          <input value={form.hospital_address || ''} onChange={e => setForm(f => ({ ...f, hospital_address: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Bio</label>
          <textarea rows={3} value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2">Available Days</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(d => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activeDays.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-gray-200 hover:border-blue-300'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Available for Appointments</label>
          <button type="button" onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_available ? 'bg-blue-600' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
          <Save size={15} />{saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
