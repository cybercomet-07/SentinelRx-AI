import { useState, useMemo } from 'react'
import { Search, ExternalLink, Shield, Building2, Globe } from 'lucide-react'

const SCHEMES = [
  {
    id: 1,
    name: 'Ayushman Bharat Yojana (ABY)',
    shortName: 'ABY',
    type: 'Central',
    state: 'All India',
    description: 'Health protection scheme for poor and vulnerable families. Provides coverage up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
    url: 'https://pmjay.gov.in',
    color: 'blue',
  },
  {
    id: 2,
    name: 'Pradhan Mantri Jan Arogya Yojana (PMJAY)',
    shortName: 'PMJAY',
    type: 'Central',
    state: 'All India',
    description: 'World\'s largest health assurance scheme providing ₹5 lakh per family per year for hospitalization. Covers over 10 crore poor and vulnerable families.',
    url: 'https://pmjay.gov.in/about/pmjay',
    color: 'blue',
  },
  {
    id: 3,
    name: 'Central Government Health Scheme (CGHS)',
    shortName: 'CGHS',
    type: 'Central',
    state: 'All India',
    description: 'Comprehensive healthcare facilities for Central Government employees, pensioners, and their dependents through wellness centres and empanelled hospitals.',
    url: 'https://cghs.gov.in',
    color: 'blue',
  },
  {
    id: 4,
    name: 'Employees State Insurance Scheme (ESIS)',
    shortName: 'ESIS',
    type: 'Central',
    state: 'All India',
    description: 'Self-financing social security and health insurance scheme for Indian workers. Provides complete medical care and cash benefits during sickness, maternity, etc.',
    url: 'https://www.esic.nic.in',
    color: 'blue',
  },
  {
    id: 5,
    name: 'Rashtiya Swasthya Bima Yojana (RSBY)',
    shortName: 'RSBY',
    type: 'Central',
    state: 'All India',
    description: 'Health insurance scheme for BPL families providing cashless hospitalization up to ₹30,000 per family per year at empanelled government and private hospitals.',
    url: 'https://www.healthindiatpa.com/rsby/HospitalList.aspx',
    color: 'blue',
  },
  {
    id: 6,
    name: 'Aam Aadmi Bima Yojana (AABY)',
    shortName: 'AABY',
    type: 'Central',
    state: 'All India',
    description: 'Social security scheme for rural landless households providing life and disability cover and scholarship benefit for children of insured members.',
    url: 'https://www.licindia.in/',
    color: 'blue',
  },
  {
    id: 7,
    name: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    shortName: 'PMSBY',
    type: 'Central',
    state: 'All India',
    description: 'Accident insurance scheme offering ₹2 lakh cover for accidental death and full disability, ₹1 lakh for partial disability at just ₹20/year premium.',
    url: 'https://jansuraksha.gov.in/',
    color: 'blue',
  },
  {
    id: 8,
    name: 'Janashree Bima Yojana (JBY)',
    shortName: 'JBY',
    type: 'Central',
    state: 'All India',
    description: 'Life insurance cover for rural and urban below poverty line persons and marginally above poverty line. Provides natural death and accident death benefits.',
    url: 'https://www.licindia.in/',
    color: 'blue',
  },
  {
    id: 9,
    name: 'Universal Health Insurance Scheme (UHIS)',
    shortName: 'UHIS',
    type: 'Central',
    state: 'All India',
    description: 'Health insurance scheme for families below poverty line offering hospitalization coverage up to ₹30,000, personal accident cover and daily hospitalization allowance.',
    url: 'https://www.india.gov.in/spotlight/universal-health-coverage',
    color: 'blue',
  },
  {
    id: 10,
    name: 'Mahatma Jyotiba Phule Jan Arogya Yojana',
    shortName: 'MJPJAY',
    type: 'State',
    state: 'Maharashtra',
    description: 'Maharashtra state government scheme providing cashless medical and surgical treatment to Below Poverty Line families. Covers 996 medical procedures across hospitals.',
    url: 'https://www.jeevandayee.gov.in',
    color: 'orange',
  },
  {
    id: 11,
    name: 'Dr. YSR Aarogyashri Health Care Trust',
    shortName: 'YSR Aarogyashri',
    type: 'State',
    state: 'Andhra Pradesh',
    description: 'Andhra Pradesh\'s flagship health scheme providing free healthcare to poor families for major diseases requiring hospitalization and surgeries. Covers 2,487 treatments.',
    url: 'https://www.ysraarogyasri.ap.gov.in',
    color: 'green',
  },
  {
    id: 12,
    name: 'Karunya Arogya Suraksha Padhathi',
    shortName: 'KASP',
    type: 'State',
    state: 'Kerala',
    description: 'Kerala\'s health protection scheme for families with annual income below ₹5 lakh. Provides cashless treatment up to ₹5 lakh for critical illnesses at empanelled hospitals.',
    url: 'https://sha.kerala.gov.in/karunya-arogya-suraksha-padhathi/',
    color: 'green',
  },
  {
    id: 13,
    name: 'West Bengal Swasthya Sathi Yojana',
    shortName: 'Swasthya Sathi',
    type: 'State',
    state: 'West Bengal',
    description: 'West Bengal\'s universal health coverage scheme providing cashless treatment up to ₹5 lakh per family per year. Smart card-based scheme covering all districts.',
    url: 'https://swasthyasathi.gov.in',
    color: 'purple',
  },
  {
    id: 14,
    name: 'West Bengal Health Scheme',
    shortName: 'WBHS',
    type: 'State',
    state: 'West Bengal',
    description: 'Health scheme for State Government employees and pensioners of West Bengal, providing medical reimbursements and cashless treatment at empanelled hospitals.',
    url: 'https://wbhealthscheme.gov.in',
    color: 'purple',
  },
  {
    id: 15,
    name: 'Mukhyamantri Amrutum Yojana',
    shortName: 'MA Yojana',
    type: 'State',
    state: 'Gujarat',
    description: 'Gujarat\'s health scheme providing cashless treatment for critical illnesses up to ₹3 lakh per family per year at empanelled government and private hospitals.',
    url: 'https://www.magujarat.com/',
    color: 'teal',
  },
  {
    id: 16,
    name: 'Mukhya Mantri Chiranjeevi Swasthya Bima Yojana',
    shortName: 'Chiranjeevi Yojana',
    type: 'State',
    state: 'Rajasthan',
    description: 'Rajasthan\'s health scheme offering cashless treatment up to ₹25 lakh per family per year. Covers government employees, contractual workers, and BPL families.',
    url: 'https://health.rajasthan.gov.in/content/raj/medical/bhamashah-swasthya-bima-yojana/MMCSBY.html',
    color: 'red',
  },
  {
    id: 17,
    name: 'Rajasthan Government Health Scheme (RGHS)',
    shortName: 'RGHS',
    type: 'State',
    state: 'Rajasthan',
    description: 'Health insurance for Rajasthan government employees and pensioners providing cashless treatment. Covers OPD, IPD, surgeries, and diagnostics at empanelled hospitals.',
    url: 'https://rghs.rajasthan.gov.in/RGHS/home/',
    color: 'red',
  },
  {
    id: 18,
    name: 'Yeshasvini Health Insurance Scheme',
    shortName: 'Yeshasvini',
    type: 'State',
    state: 'Karnataka',
    description: 'Karnataka\'s cooperative-based health scheme providing affordable surgical procedures to rural cooperative members across 820+ hospitals in the state.',
    url: 'https://www.yeshasvini.kar.nic.in/',
    color: 'indigo',
  },
  {
    id: 19,
    name: 'Telangana State Employees Health Scheme',
    shortName: 'TSHS',
    type: 'State',
    state: 'Telangana',
    description: 'Health scheme for Telangana state government employees and journalists providing cashless medical treatment at empanelled hospitals across the state.',
    url: 'https://ts.ehf.gov.in/',
    color: 'cyan',
  },
  {
    id: 20,
    name: "Chief Minister's Comprehensive Health Insurance Scheme",
    shortName: 'CMCHIS',
    type: 'State',
    state: 'Tamil Nadu',
    description: 'Tamil Nadu\'s comprehensive scheme covering all families with annual income below ₹72,000. Provides cashless treatment for 1,027 procedures up to ₹5 lakh.',
    url: 'https://www.cmchistn.com/',
    color: 'pink',
  },
  {
    id: 21,
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    shortName: 'PMMVY',
    type: 'Central',
    state: 'All India',
    description: 'Maternity benefit programme providing ₹5,000 in three installments to pregnant women and lactating mothers for the first live birth to compensate for wage loss.',
    url: 'https://pmmvy.wcd.gov.in/',
    color: 'blue',
  },
]

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   badge: 'bg-blue-100 text-blue-700',   icon: 'text-blue-500',   btn: 'bg-blue-600 hover:bg-blue-700' },
  green:  { bg: 'bg-green-50',  border: 'border-green-100',  badge: 'bg-green-100 text-green-700', icon: 'text-green-500',  btn: 'bg-green-600 hover:bg-green-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700', icon: 'text-orange-500', btn: 'bg-orange-600 hover:bg-orange-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', badge: 'bg-purple-100 text-purple-700', icon: 'text-purple-500', btn: 'bg-purple-600 hover:bg-purple-700' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-100',   badge: 'bg-teal-100 text-teal-700',   icon: 'text-teal-500',   btn: 'bg-teal-600 hover:bg-teal-700' },
  red:    { bg: 'bg-red-50',    border: 'border-red-100',    badge: 'bg-red-100 text-red-700',     icon: 'text-red-500',    btn: 'bg-red-600 hover:bg-red-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', badge: 'bg-indigo-100 text-indigo-700', icon: 'text-indigo-500', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  cyan:   { bg: 'bg-cyan-50',   border: 'border-cyan-100',   badge: 'bg-cyan-100 text-cyan-700',   icon: 'text-cyan-500',   btn: 'bg-cyan-600 hover:bg-cyan-700' },
  pink:   { bg: 'bg-pink-50',   border: 'border-pink-100',   badge: 'bg-pink-100 text-pink-700',   icon: 'text-pink-500',   btn: 'bg-pink-600 hover:bg-pink-700' },
}

const ALL_STATES = ['All India', ...Array.from(new Set(SCHEMES.filter(s => s.state !== 'All India').map(s => s.state))).sort()]

export default function GovtSchemesPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [stateFilter, setStateFilter] = useState('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return SCHEMES.filter(s => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.shortName.toLowerCase().includes(q) || s.state.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      const matchType = typeFilter === 'All' || s.type === typeFilter
      const matchState = stateFilter === 'All' || s.state === stateFilter
      return matchSearch && matchType && matchState
    })
  }, [search, typeFilter, stateFilter])

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Header banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center gap-4 shadow-md">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Shield size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Government Health Schemes</h2>
          <p className="text-blue-100 text-sm mt-0.5">
            {SCHEMES.length} schemes · Central &amp; State government health initiatives across India
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-52 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schemes by name, state..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="All">All Types</option>
          <option value="Central">Central Government</option>
          <option value="State">State Government</option>
        </select>

        {/* State filter */}
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="All">All States</option>
          {ALL_STATES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p className="text-sm text-slate-500">
        {filtered.length === SCHEMES.length
          ? `Showing all ${SCHEMES.length} schemes`
          : `${filtered.length} scheme${filtered.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Shield size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No schemes match your search</p>
          <p className="text-sm mt-1">Try a different keyword or clear the filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(scheme => {
            const c = COLOR_MAP[scheme.color] || COLOR_MAP.blue
            return (
              <div
                key={scheme.id}
                className={`rounded-2xl border ${c.border} ${c.bg} p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-10 h-10 rounded-xl bg-white border ${c.border} flex items-center justify-center shrink-0 shadow-sm`}>
                    {scheme.type === 'Central'
                      ? <Globe size={18} className={c.icon} />
                      : <Building2 size={18} className={c.icon} />}
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>
                      {scheme.type}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 text-slate-600 border border-slate-200">
                      {scheme.state}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <p className="font-semibold text-slate-900 text-sm leading-snug">{scheme.name}</p>
                  <p className={`text-xs font-bold mt-0.5 ${c.icon}`}>{scheme.shortName}</p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed flex-1">{scheme.description}</p>

                {/* Visit button */}
                <a
                  href={scheme.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold ${c.btn} transition-colors mt-auto`}
                >
                  <ExternalLink size={13} />
                  Visit Official Website
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
