import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { SUPPORTED } from '../../i18n'
import i18n from '../../i18n'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    landmark: '',
    pin_code: '',
    date_of_birth: '',
    gender: '',
    preferred_language: 'en',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('sentinelrx_token')
    if (!token) {
      setLoading(false)
      return
    }
    // Show form immediately from auth context so profile opens even if API is slow/fails
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        landmark: user.landmark || '',
        pin_code: user.pin_code || '',
        date_of_birth: user.date_of_birth ? String(user.date_of_birth).split('T')[0] : '',
        gender: user.gender || 'prefer_not_to_say',
        preferred_language: user.preferred_language || 'en',
      })
      setLoading(false)
    }
    authService
      .me()
      .then((res) => {
        const u = res.data
        setForm({
          name: u?.name || '',
          email: u?.email || '',
          phone: u?.phone || '',
          address: u?.address || '',
          landmark: u?.landmark || '',
          pin_code: u?.pin_code || '',
          date_of_birth: u?.date_of_birth ? String(u.date_of_birth).split('T')[0] : '',
          gender: u?.gender || 'prefer_not_to_say',
          preferred_language: u?.preferred_language || 'en',
        })
      })
      .catch(() => {
        toast.error(t('profile.failedToLoad'))
      })
  }, [user?.id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (name === 'preferred_language') {
      const code = value || 'en'
      authService.updateProfile({ preferred_language: code })
        .then((res) => {
          updateUser({ ...user, preferred_language: code })
          i18n.changeLanguage(code)
          localStorage.setItem('sentinelrx_lang', code)
          toast.success(t('profile.profileUpdated'))
        })
        .catch(() => toast.error(t('profile.failedToUpdate')))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name?.trim()) { toast.error('Full legal name is required'); return }
    if (!form.phone?.trim()) { toast.error('Phone number is required'); return }
    if (form.phone.replace(/\D/g, '').length < 10) { toast.error('Please enter a valid phone number'); return }
    if (!form.address?.trim()) { toast.error('Full address is required'); return }
    if (!form.landmark?.trim()) { toast.error('Landmark is required'); return }
    if (!form.pin_code?.trim()) { toast.error('PIN code is required'); return }
    if (form.pin_code.replace(/\D/g, '').length < 5) { toast.error('Please enter a valid PIN code'); return }
    if (!form.date_of_birth) { toast.error('Date of birth is required'); return }
    setSaving(true)
    try {
      const res = await authService.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        landmark: form.landmark.trim(),
        pin_code: form.pin_code.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender || 'prefer_not_to_say',
        preferred_language: form.preferred_language || 'en',
      })
      const updated = res.data
      updateUser({ ...user, ...updated })
      setForm(prev => ({
        ...prev,
        name: updated.name ?? prev.name,
        phone: updated.phone ?? prev.phone,
        address: updated.address ?? prev.address,
        landmark: updated.landmark ?? prev.landmark,
        pin_code: updated.pin_code ?? prev.pin_code,
        date_of_birth: updated.date_of_birth ? updated.date_of_birth.split('T')[0] : prev.date_of_birth,
        gender: updated.gender ?? prev.gender,
        preferred_language: updated.preferred_language ?? prev.preferred_language,
      }))
      toast.success(t('profile.profileUpdated'))
    } catch (err) {
      toast.error(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || t('profile.failedToUpdate'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[200px]">
        <span className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col items-center">
      <div className="card-lift bg-white border border-gray-100 rounded-2xl p-4 sm:p-8 shadow-soft w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
            {form.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="font-display font-semibold text-gray-900 text-xl">{form.name || t('profile.title')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{form.email || t('profile.editInfo')}</p>
            {user?.role && (
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                <Shield size={12} />
                {user.role}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-100 pt-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.fullLegalName')} *</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="email"
                type="email"
                value={form.email}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{t('profile.emailCannotChange')}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.phone')} *</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.address')} *</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, area, city"
                rows={2}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white resize-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.landmark')} *</label>
              <input
                name="landmark"
                type="text"
                value={form.landmark}
                onChange={handleChange}
                placeholder="e.g. Near temple"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.pinCode')} *</label>
              <input
                name="pin_code"
                type="text"
                value={form.pin_code}
                onChange={handleChange}
                placeholder="e.g. 400001"
                maxLength={10}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.dateOfBirth')} *</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.gender')}</label>
            <select
              name="gender"
              value={form.gender || 'prefer_not_to_say'}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
            >
              <option value="male">{t('auth.male')}</option>
              <option value="female">{t('auth.female')}</option>
              <option value="other">{t('auth.other')}</option>
              <option value="prefer_not_to_say">{t('auth.preferNotToSay')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.preferredLanguage')}</label>
            <select
              name="preferred_language"
              value={form.preferred_language || 'en'}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
            >
              {SUPPORTED.map((code) => (
                <option key={code} value={code}>{t(`languages.${code}`)}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            {saving ? t('common.saving') : t('common.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  )
}
