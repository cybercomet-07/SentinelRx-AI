import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { contactService } from '../../services/contactService'
import { Mail, Send, User, Phone, Calendar, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactUsPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    full_name: '',
    contact_details: '',
    date_of_birth: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name?.trim()) { toast.error(t('common.fullNameRequired')); return }
    if (!form.contact_details?.trim()) { toast.error(t('common.contactDetailsRequired')); return }
    if (!form.description?.trim()) { toast.error(t('common.descriptionRequired')); return }
    setLoading(true)
    try {
      await contactService.create({
        full_name: form.full_name.trim(),
        contact_details: form.contact_details.trim(),
        date_of_birth: form.date_of_birth || undefined,
        description: form.description.trim(),
      })
      toast.success(t('common.messageSent'))
      setForm({ full_name: '', contact_details: '', date_of_birth: '', description: '' })
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || t('common.failedToSendMessage')
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900">{t('contact.title')}</h1>
        <p className="text-slate-500 mt-1">{t('contact.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <div>
          <label htmlFor="full_name" className="block text-sm font-semibold text-slate-700 mb-1.5">
            {t('common.fullName')} *
          </label>
          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact_details" className="block text-sm font-semibold text-slate-700 mb-1.5">
            {t('common.contactDetails')} *
          </label>
          <div className="relative">
            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="contact_details"
              name="contact_details"
              type="text"
              value={form.contact_details}
              onChange={handleChange}
              placeholder="e.g. 9876543210 or you@email.com"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-semibold text-slate-700 mb-1.5">
            {t('auth.dateOfBirth')}
          </label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1.5">
            {t('common.description')} *
          </label>
          <div className="relative">
            <FileText size={18} className="absolute left-3.5 top-4 text-slate-400" />
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t('common.describeQueryOrFeedback')}
              rows={4}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 resize-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={16} />
              {t('common.sendMessage')}
            </>
          )}
        </button>
      </form>

      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-sm font-medium text-slate-700 mb-2">{t('common.orReachUsDirectly')}</p>
        <a href="mailto:ainpharmacyofficial@gmail.com" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold">
          <Mail size={16} />
          ainpharmacyofficial@gmail.com
        </a>
      </div>
    </div>
  )
}
