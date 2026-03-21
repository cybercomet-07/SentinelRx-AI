import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Calendar, Clock, Stethoscope, MapPin, Plus, FileText, X, Phone, Trash2, RefreshCw } from 'lucide-react'
import { patientService } from '../../services/patientService'
import { callScheduleService } from '../../services/callScheduleService'
import { getErrorMessage } from '../../utils/apiError'

const STATUS_BADGE = {
  PENDING:   'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  NO_SHOW:   'bg-slate-100 text-slate-600',
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState(false)
  const [cancelling, setCancelling] = useState(null)
  const [expandedRx, setExpandedRx] = useState(null)

  // Call reminders (medicine reminder calls)
  const [callSchedules, setCallSchedules] = useState([])
  const [callLoading, setCallLoading] = useState(true)
  const [callError, setCallError] = useState(false)
  const [showCallForm, setShowCallForm] = useState(false)
  const [callCreating, setCallCreating] = useState(false)
  const [callForm, setCallForm] = useState({
    phone: '',
    times: ['09:00'],
    start_date: '',
    end_date: '',
    message: 'Please take your medicine on time',
  })
  const [callDeleting, setCallDeleting] = useState(null)

  const loadCalls = () => {
    setCallError(false)
    setCallLoading(true)
    callScheduleService.list()
      .then(r => setCallSchedules(r.data?.items || []))
      .catch(() => setCallError(true))
      .finally(() => setCallLoading(false))
  }

  const load = () => {
    setAppointmentsError(false)
    setLoading(true)
    patientService.listAppointments()
      .then(r => setAppointments(r.data.items || []))
      .catch(() => setAppointmentsError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])
  useEffect(loadCalls, [])

  const handleCreateCall = async (e) => {
    e.preventDefault()
    if (!callForm.phone || !callForm.start_date || !callForm.end_date) {
      toast.error('Phone, start date and end date are required')
      return
    }
    const times = callForm.times.filter(t => t && /^\d{2}:\d{2}$/.test(t))
    if (times.length === 0) {
      toast.error('Add at least one time (HH:MM format)')
      return
    }
    setCallCreating(true)
    try {
      await callScheduleService.create({
        phone: callForm.phone.replace(/\D/g, '').slice(-10),
        times,
        start_date: callForm.start_date,
        end_date: callForm.end_date,
        message: callForm.message || 'Please take your medicine on time',
      })
      toast.success('Call reminder saved! You will receive calls at the scheduled times.')
      setCallForm({ phone: '', times: ['09:00'], start_date: '', end_date: '', message: 'Please take your medicine on time' })
      setShowCallForm(false)
      loadCalls()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save'))
    } finally {
      setCallCreating(false)
    }
  }

  const handleDeleteCall = async (id) => {
    if (!confirm('Remove this call reminder?')) return
    setCallDeleting(id)
    try {
      await callScheduleService.delete(id)
      toast.success('Reminder removed')
      loadCalls()
    } catch {
      toast.error('Failed to remove')
    } finally {
      setCallDeleting(null)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    setCancelling(id)
    try {
      await patientService.cancelAppointment(id)
      toast.success('Appointment cancelled')
      load()
    } catch (e) {
      toast.error(getErrorMessage(e, 'Failed to cancel'))
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track all your booked appointments</p>
        </div>
        <Link
          to="/user/find-doctor"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          <Plus size={15} /> Book New
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointmentsError ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Unable to load appointments</p>
          <button onClick={load} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No appointments yet</p>
          <p className="text-slate-400 text-sm mb-5">Book your first appointment with a doctor</p>
          <Link to="/user/find-doctor" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            Find a Doctor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-bold text-slate-900">Dr. {a.doctor_name}</p>
                  <p className="text-blue-600 text-sm">{a.specialization || 'General Physician'}</p>
                  {a.hospital_name && (
                    <p className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                      <MapPin size={10} /> {a.hospital_name}
                    </p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[a.status] || 'bg-slate-100 text-slate-600'}`}>
                  {a.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
                <span className="flex items-center gap-1"><Calendar size={13} className="text-slate-400" />{a.appointment_date}</span>
                <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" />{a.time_slot}</span>
                <span className="flex items-center gap-1"><Stethoscope size={13} className="text-slate-400" />{a.appointment_type}</span>
              </div>

              {a.symptoms && (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mb-3">
                  <span className="font-medium text-slate-600">Symptoms:</span> {a.symptoms}
                </p>
              )}

              {a.prescription_issued && (
                <div className="mb-3">
                  <button
                    onClick={() => setExpandedRx(expandedRx === a.id ? null : a.id)}
                    className="flex items-center gap-1.5 text-sm text-teal-700 font-medium hover:text-teal-800"
                  >
                    <FileText size={13} />
                    {expandedRx === a.id ? 'Hide Prescription' : 'View Prescription'}
                  </button>
                  {expandedRx === a.id && (
                    <pre className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-sans">
                      {a.prescription_issued}
                    </pre>
                  )}
                </div>
              )}

              {a.notes && (
                <p className="text-xs text-slate-500 bg-blue-50 rounded-xl px-3 py-2 mb-3">
                  <span className="font-medium text-blue-700">Doctor note:</span> {a.notes}
                </p>
              )}

              {['PENDING', 'CONFIRMED'].includes(a.status) && (
                <button
                  onClick={() => handleCancel(a.id)}
                  disabled={cancelling === a.id}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium mt-1"
                >
                  <X size={12} /> {cancelling === a.id ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              )}
            </div>
          )          )}
        </div>
      )}

      {/* Medicine Call Reminders */}
      <section className="mt-10 pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Phone size={18} className="text-teal-600" /> Medicine Call Reminders
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">Get phone calls at set times to remind you to take medicine</p>
          </div>
          <button
            onClick={() => setShowCallForm(!showCallForm)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700"
          >
            <Plus size={15} /> {showCallForm ? 'Cancel' : 'Add Reminder'}
          </button>
        </div>

        {showCallForm && (
          <form onSubmit={handleCreateCall} className="bg-teal-50 border border-teal-100 rounded-2xl p-5 mb-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone (10 digits)</label>
              <input
                type="tel"
                value={callForm.phone}
                onChange={e => setCallForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="9876543210"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Call times (max 3, HH:MM)</label>
              <div className="flex gap-2 flex-wrap items-center">
                {callForm.times.map((t, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      type="time"
                      value={t}
                      onChange={e => {
                        const next = [...callForm.times]
                        next[i] = e.target.value
                        setCallForm(f => ({ ...f, times: next }))
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                    {callForm.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCallForm(f => ({ ...f, times: f.times.filter((_, j) => j !== i) }))}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {callForm.times.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setCallForm(f => ({ ...f, times: [...f.times, '12:00'] }))}
                    className="px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-teal-400"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start date</label>
                <input
                  type="date"
                  value={callForm.start_date}
                  onChange={e => setCallForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End date</label>
                <input
                  type="date"
                  value={callForm.end_date}
                  onChange={e => setCallForm(f => ({ ...f, end_date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Message (optional)</label>
              <input
                type="text"
                value={callForm.message}
                onChange={e => setCallForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Please take your medicine on time"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={callCreating}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-60"
            >
              {callCreating ? 'Saving…' : 'Save Reminder'}
            </button>
          </form>
        )}

        {callLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : callError ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
            <Phone size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Unable to load call reminders</p>
            <button onClick={loadCalls} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700">
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : callSchedules.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
            <Phone size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No call reminders yet</p>
            <p className="text-slate-400 text-xs">Add one to get phone calls at your chosen times</p>
          </div>
        ) : (
          <div className="space-y-3">
            {callSchedules.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{s.phone}</p>
                  <p className="text-xs text-slate-500">
                    {s.times?.join(', ')} • {s.start_date} to {s.end_date}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCall(s.id)}
                  disabled={callDeleting === s.id}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
