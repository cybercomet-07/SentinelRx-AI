import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import {
  ShoppingBag, Users, Stethoscope, Building2, Heart, TrendingUp,
  Pill, BedDouble, CalendarDays, Droplets, BadgeIndianRupee,
  AlertTriangle, Activity, ArrowRight, ClipboardList, ShieldCheck,
  UserCheck, Receipt,
} from 'lucide-react'

/* ── tiny stat card ─────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color = 'blue', accent }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   ring: 'ring-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  ring: 'ring-green-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', ring: 'ring-orange-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    ring: 'ring-red-100' },
    teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600',   ring: 'ring-teal-100' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={c.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
        <p className="text-xl font-bold text-slate-800 leading-tight">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {accent && (
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 shrink-0">
          {accent}
        </span>
      )}
    </div>
  )
}

/* ── section header ─────────────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, color, linkTo, linkLabel }) {
  const cls = {
    blue:   'text-blue-600 bg-blue-50 border-blue-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    green:  'text-green-600 bg-green-50 border-green-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
  }
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-xl border flex items-center justify-center ${cls[color] || cls.blue}`}>
          <Icon size={15} />
        </span>
        <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
      </div>
      {linkTo && (
        <Link to={linkTo} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors">
          {linkLabel} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}

/* ── main component ─────────────────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    setError(false); setLoading(true)
    adminService.getSuperStats()
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <Loader center />
  if (error) return <ErrorState onRetry={load} message="Unable to load system overview." />

  const { pharmacy, doctors, hospital, ngo, recent_orders, recent_admissions } = data

  return (
    <div className="p-4 sm:p-6 space-y-7">

      {/* ── Top KPIs ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-indigo-500" />
          <h1 className="font-bold text-slate-900 text-base">System Overview</h1>
          <span className="ml-auto text-xs text-slate-400">Live · auto-refreshes every 60s</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users}           label="Total Patients"      value={pharmacy.total_users}        color="blue" />
          <StatCard icon={Stethoscope}     label="Doctors"             value={doctors.total_doctors}       color="teal" />
          <StatCard icon={Building2}       label="Hospitals"           value={hospital.total_hospitals}    color="orange" />
          <StatCard icon={Heart}           label="NGO Organisations"   value={ngo.total_ngos}              color="purple" />
        </div>
      </div>

      {/* ── Pharmacy / E-commerce ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionHeader icon={ShoppingBag} title="Pharmacy & E-Commerce" color="blue" linkTo="/admin/orders" linkLabel="View Orders" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={ShoppingBag}       label="Total Orders"        value={pharmacy.total_orders}       color="blue" />
          <StatCard icon={AlertTriangle}     label="Pending Orders"      value={pharmacy.pending_orders}     color="red"
            accent={pharmacy.pending_orders > 0 ? `${pharmacy.pending_orders} pending` : null} />
          <StatCard icon={BadgeIndianRupee}  label="Pharmacy Revenue"    value={`₹${(pharmacy.total_revenue).toLocaleString()}`} color="green" />
          <StatCard icon={Pill}              label="Total Medicines"     value={pharmacy.total_medicines}    color="teal" />
          <StatCard icon={AlertTriangle}     label="Low Stock"           value={pharmacy.low_stock_count}    color="red"
            accent={pharmacy.low_stock_count > 0 ? 'Low!' : null} />
          <StatCard icon={ClipboardList}     label="Prescriptions"       value={pharmacy.total_prescriptions} color="purple" />
        </div>

        {/* Recent orders */}
        {recent_orders?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Recent Orders</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-gray-50">
                    <th className="text-left pb-1.5 font-medium">ID</th>
                    <th className="text-left pb-1.5 font-medium">Patient</th>
                    <th className="text-left pb-1.5 font-medium">Amount</th>
                    <th className="text-left pb-1.5 font-medium">Status</th>
                    <th className="text-left pb-1.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_orders.map((o, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-1.5 font-mono text-slate-500">#{o.id}</td>
                      <td className="py-1.5 text-slate-700">{o.user}</td>
                      <td className="py-1.5 text-slate-700">₹{o.amount}</td>
                      <td className="py-1.5">
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${
                          o.status === 'DELIVERED' ? 'bg-green-50 text-green-700' :
                          o.status === 'PENDING'   ? 'bg-yellow-50 text-yellow-700' :
                          o.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                          'bg-blue-50 text-blue-700'}`}>{o.status}</span>
                      </td>
                      <td className="py-1.5 text-slate-400">{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Doctors & Appointments ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionHeader icon={Stethoscope} title="Doctors & Appointments" color="blue" linkTo="/admin/users" linkLabel="Manage Users" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Stethoscope}   label="Total Doctors"        value={doctors.total_doctors}          color="teal" />
          <StatCard icon={CalendarDays}  label="Total Appointments"   value={doctors.total_appointments}     color="blue" />
          <StatCard icon={AlertTriangle} label="Pending Appointments" value={doctors.pending_appointments}   color="red"
            accent={doctors.pending_appointments > 0 ? 'Unconfirmed' : null} />
          <StatCard icon={UserCheck}     label="Confirmed"            value={doctors.confirmed_appointments} color="green" />
        </div>
      </div>

      {/* ── Hospital ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionHeader icon={Building2} title="Hospital Management" color="orange" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={BedDouble}         label="Total Beds"        value={hospital.total_beds}        color="orange" />
          <StatCard icon={BedDouble}         label="Available Beds"    value={hospital.available_beds}    color="green" />
          <StatCard icon={BedDouble}         label="Occupied Beds"     value={hospital.occupied_beds}     color="red" />
          <StatCard icon={Users}             label="Active Admissions" value={hospital.active_admissions} color="orange" />
          <StatCard icon={CalendarDays}      label="OPD Visits"        value={hospital.total_visits}      color="teal" />
          <StatCard icon={Receipt}           label="Total Bills"       value={hospital.total_bills}       color="purple" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <StatCard icon={BadgeIndianRupee}  label="Hospital Revenue (Collected)" value={`₹${(hospital.billing_revenue).toLocaleString()}`} color="green" />
          <StatCard icon={AlertTriangle}     label="Pending Bills"    value={hospital.pending_bills}     color="red"
            accent={hospital.pending_bills > 0 ? `${hospital.pending_bills} due` : null} />
          <StatCard icon={Pill}              label="Hospital Medicines" value={hospital.hospital_medicines} color="teal" />
        </div>

        {/* Recent admissions */}
        {recent_admissions?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Recent Admissions</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-gray-50">
                    <th className="text-left pb-1.5 font-medium">Patient</th>
                    <th className="text-left pb-1.5 font-medium">Ward</th>
                    <th className="text-left pb-1.5 font-medium">Status</th>
                    <th className="text-left pb-1.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_admissions.map((a, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-1.5 text-slate-700 font-medium">{a.patient}</td>
                      <td className="py-1.5 text-slate-500">{a.ward}</td>
                      <td className="py-1.5">
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${
                          a.status === 'ADMITTED'   ? 'bg-blue-50 text-blue-700' :
                          a.status === 'DISCHARGED' ? 'bg-green-50 text-green-700' :
                          'bg-slate-50 text-slate-600'}`}>{a.status}</span>
                      </td>
                      <td className="py-1.5 text-slate-400">{a.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── NGO ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionHeader icon={Heart} title="NGO & Social Welfare" color="purple" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard icon={Users}             label="Beneficiaries"     value={ngo.total_beneficiaries}      color="purple" />
          <StatCard icon={ShieldCheck}       label="Scheme Eligible"   value={ngo.scheme_eligible}          color="green" />
          <StatCard icon={Droplets}          label="Blood Camps"       value={ngo.total_blood_camps}        color="red" />
          <StatCard icon={Droplets}          label="Units Collected"   value={ngo.units_collected}          color="teal"
            sub="Total blood units donated" />
          <StatCard icon={TrendingUp}        label="Donation Drives"   value={ngo.total_donation_drives}    color="blue" />
          <StatCard icon={BadgeIndianRupee}  label="Donations Raised"  value={`₹${(ngo.ngo_donations_raised).toLocaleString()}`} color="green" />
        </div>
      </div>

      {/* ── Quick Navigation ── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Navigation</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Medicines',     icon: Pill,          to: '/admin/medicines',     color: 'bg-teal-50 text-teal-700 border-teal-100' },
            { label: 'All Orders',    icon: ShoppingBag,   to: '/admin/orders',        color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { label: 'All Users',     icon: Users,         to: '/admin/users',         color: 'bg-purple-50 text-purple-700 border-purple-100' },
            { label: 'Prescriptions', icon: ClipboardList, to: '/admin/prescriptions', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
          ].map(({ label, icon: Icon, to, color }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold ${color} hover:opacity-80 transition-opacity`}>
              <Icon size={16} />{label}<ArrowRight size={13} className="ml-auto opacity-60" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
