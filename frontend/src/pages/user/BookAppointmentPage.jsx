import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Calendar, Clock, Stethoscope, MapPin,
  Star, IndianRupee, CheckCircle,
} from 'lucide-react'
import { patientService } from '../../services/patientService'
import { getErrorMessage } from '../../utils/apiError'

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
]

const APPT_TYPES = ['In Person', 'Video', 'Phone']

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function BookAppointmentPage() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    appointment_date: todayStr(),
    time_slot: '',
    appointment_type: 'In Person',
    symptoms: '',
  })

  useEffect(() => {
    patientService.getDoctorDetail(doctorId)
      .then(r => setDoctor(r.data))
      .catch(() => { toast.error('Doctor not found'); navigate('/user/find-doctor') })
      .finally(() => setLoading(false))
  }, [doctorId])

  const handleBook = async () => {
    if (!form.time_slot) { toast.error('Please select a time slot'); return }
    setSubmitting(true)
    try {
      await patientService.bookAppointment({
        doctor_id: doctorId,
        ...form,
      })
      setDone(true)
    } catch (e) {
      toast.error(getErrorMessage(e, 'Failed to book appointment'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (done) return (
    <div className="p-6 max-w-lg mx-auto flex flex-col items-center text-center py-20">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Booked!</h2>
      <p className="text-slate-500 mb-1">Your appointment with <strong>{doctor?.name}</strong> has been submitted.</p>
      <p className="text-slate-400 text-sm mb-6">You will be notified once the doctor confirms it.</p>
      <div className="flex gap-3">
        <Link to="/user/appointments" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          My Appointments
        </Link>
        <Link to="/user/find-doctor" className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">
          Find Another Doctor
        </Link>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Link to="/user/find-doctor" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-5">
        <ArrowLeft size={16} /> Back to Find a Doctor
      </Link>

      {/* Doctor card */}
      {doctor && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {doctor.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-900 text-lg">{doctor.name}</h2>
            <p className="text-blue-600 text-sm font-medium">{doctor.specialization || 'General Physician'}</p>
            {doctor.hospital_name && (
              <p className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                <MapPin size={11} /> {doctor.hospital_name}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            {doctor.consultation_fee && (
              <div className="flex items-center gap-0.5 text-teal-700 font-bold">
                <IndianRupee size={13} />{doctor.consultation_fee}
              </div>
            )}
            {doctor.rating > 0 && (
              <div className="flex items-center gap-1 mt-1 justify-end">
                <Star size={10} className="text-amber-500 fill-amber-500" />
                <span className="text-xs text-amber-700 font-semibold">{doctor.rating}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        <h3 className="font-bold text-slate-800 text-base">Book Your Appointment</h3>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <Calendar size={13} className="inline mr-1" /> Appointment Date
          </label>
          <input
            type="date"
            min={todayStr()}
            value={form.appointment_date}
            onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Time slot */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <Clock size={13} className="inline mr-1" /> Time Slot
          </label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot}
                onClick={() => setForm(f => ({ ...f, time_slot: slot }))}
                className={`py-2 px-1 rounded-xl text-xs font-medium border transition-colors ${
                  form.time_slot === slot
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Appointment Type</label>
          <div className="flex gap-2">
            {APPT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setForm(f => ({ ...f, appointment_type: type }))}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  form.appointment_type === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <Stethoscope size={13} className="inline mr-1" /> Symptoms / Reason (optional)
          </label>
          <textarea
            value={form.symptoms}
            onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
            rows={3}
            placeholder="Describe your symptoms or reason for visit..."
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          onClick={handleBook}
          disabled={submitting || !form.time_slot}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Booking...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  )
}
