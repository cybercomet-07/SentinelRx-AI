import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search, Star, MapPin, Clock, IndianRupee, Stethoscope, ChevronRight, User } from 'lucide-react'
import { patientService } from '../../services/patientService'

const SPECIALIZATIONS = [
  'All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician',
  'Orthopedic', 'Neurologist', 'Gynecologist', 'Ophthalmologist', 'ENT', 'Psychiatrist',
]

export default function FindDoctorPage() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSpec, setSelectedSpec] = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    patientService.listDoctors()
      .then(r => setDoctors(r.data.items || []))
      .catch(() => toast.error('Unable to load doctors'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = doctors.filter(d => {
    const matchSpec = selectedSpec === 'All' || d.specialization === selectedSpec
    const s = search.toLowerCase()
    const matchSearch = !s || d.name.toLowerCase().includes(s) ||
      (d.specialization || '').toLowerCase().includes(s) ||
      (d.hospital_name || '').toLowerCase().includes(s)
    return matchSpec && matchSearch
  })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Find a Doctor</h1>
        <p className="text-slate-500 text-sm">Browse verified doctors and book your appointment</p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, specialization, or hospital..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {SPECIALIZATIONS.map(spec => (
            <button
              key={spec}
              onClick={() => setSelectedSpec(spec)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedSpec === spec
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading doctors...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Stethoscope size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No doctors found</p>
          <p className="text-slate-400 text-sm mt-1">Try a different search or specialization</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(doc => (
            <DoctorCard key={doc.doctor_id} doc={doc} onBook={() => navigate(`/user/book-appointment/${doc.doctor_id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function DoctorCard({ doc, onBook }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm">
          {doc.name?.[0]?.toUpperCase() || <User size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 truncate">{doc.name}</h3>
          <p className="text-blue-600 text-sm font-medium">{doc.specialization || 'General Physician'}</p>
          {doc.experience_years && (
            <p className="text-slate-500 text-xs mt-0.5">{doc.experience_years} yrs experience</p>
          )}
        </div>
        {doc.rating > 0 && (
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-full px-2 py-1 shrink-0">
            <Star size={11} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold text-amber-700">{doc.rating}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {doc.hospital_name && (
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{doc.hospital_name}{doc.hospital_address ? `, ${doc.hospital_address}` : ''}</span>
          </div>
        )}
        {doc.available_days && (
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span>{doc.available_days}</span>
          </div>
        )}
        {doc.languages && (
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <span className="text-slate-400 text-xs font-medium">🌐</span>
            <span>{doc.languages}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <IndianRupee size={14} className="text-teal-600" />
          <span className="font-bold text-teal-700 text-lg">{doc.consultation_fee || '—'}</span>
          {doc.consultation_fee && <span className="text-slate-400 text-xs">/ visit</span>}
        </div>
        <button
          onClick={onBook}
          disabled={!doc.is_available}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            doc.is_available
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {doc.is_available ? 'Book' : 'Unavailable'}
          {doc.is_available && <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  )
}
