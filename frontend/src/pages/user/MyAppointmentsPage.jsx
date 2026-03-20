import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Calendar, Clock, Stethoscope, MapPin, Plus, FileText, X } from 'lucide-react'
import { patientService } from '../../services/patientService'

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
  const [cancelling, setCancelling] = useState(null)
  const [expandedRx, setExpandedRx] = useState(null)

  const load = () => {
    setLoading(true)
    patientService.listAppointments()
      .then(r => setAppointments(r.data.items || []))
      .catch(() => toast.error('Unable to load appointments'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    setCancelling(id)
    try {
      await patientService.cancelAppointment(id)
      toast.success('Appointment cancelled')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to cancel')
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
          ))}
        </div>
      )}
    </div>
  )
}
