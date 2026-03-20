import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, UserPlus, LogIn, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import { SUPPORTED } from '../i18n'
import i18n from '../i18n'

// my.spline.design scenes embed via iframe (prod.spline.design/scene.splinecode is for Code export only)
const SPLINE_EMBED_URL = 'https://my.spline.design/genkubgreetingrobot-ZifrhwRHpj4D389o6wERaW9o/'

const ROLES = [
  {
    value: 'user',
    label: 'Patient',
    subtitle: 'Order medicines & track health',
    emoji: '🏥',
    dot: 'bg-teal-500',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    btn: 'bg-teal-500 hover:bg-teal-600',
  },
  {
    value: 'doctor',
    label: 'Doctor',
    subtitle: 'Manage patients & consultations',
    emoji: '👨‍⚕️',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    btn: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    value: 'hospital_admin',
    label: 'Hospital Admin',
    subtitle: 'Manage hospital operations',
    emoji: '🏨',
    dot: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    btn: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    value: 'ngo',
    label: 'NGO',
    subtitle: 'Manage drives & beneficiaries',
    emoji: '🤝',
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    btn: 'bg-green-500 hover:bg-green-600',
  },
  {
    value: 'admin',
    label: 'Super Admin',
    subtitle: 'Platform management & analytics',
    emoji: '🛡️',
    dot: 'bg-violet-500',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    btn: 'bg-violet-600 hover:bg-violet-700',
  },
]

const ROLE_REDIRECTS = {
  user:           '/user/quick-start',
  doctor:         '/doctor/dashboard',
  hospital_admin: '/hospital/dashboard',
  ngo:            '/ngo/dashboard',
  admin:          '/admin/dashboard',
}

export default function Login() {
  const { t } = useTranslation()
  const [mode, setMode] = useState('signin')
  const [role, setRole] = useState('user')
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [backendOk, setBackendOk] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const modeFromState = location.state?.mode
    if (modeFromState === 'signup' || modeFromState === 'signin') {
      setMode(modeFromState)
    }
  }, [location.state])

  useEffect(() => {
    const stored = localStorage.getItem('sentinelrx_lang')
    if (stored && SUPPORTED.includes(stored)) {
      setPreferredLanguage(stored)
      i18n.changeLanguage(stored)
    }
  }, [])

  useEffect(() => {
    // Use relative URL so Vite proxy forwards to backend (avoids CORS)
    const healthUrl = '/api/v1/health'
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    fetch(healthUrl, { method: 'GET', signal: ctrl.signal })
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
      .finally(() => clearTimeout(t))
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedRole = ROLES.find(r => r.value === role)

  const switchMode = (m) => {
    setMode(m)
    setName(''); setEmail(''); setPassword(''); setConfirm('')
    setPhone(''); setAddress(''); setLandmark(''); setPinCode(''); setDateOfBirth(''); setGender('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill all fields'); return }

    if (mode === 'signup') {
      if (!name.trim()) { toast.error('Please enter your full legal name'); return }
      if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
      if (password !== confirm) { toast.error('Passwords do not match'); return }
      if (!phone.trim()) { toast.error('Please enter your phone number'); return }
      if (phone.replace(/\D/g, '').length < 10) { toast.error('Please enter a valid phone number'); return }
      if (!address.trim()) { toast.error('Please enter your full address'); return }
      if (!landmark.trim()) { toast.error('Please enter landmark'); return }
      if (!pinCode.trim()) { toast.error('Please enter PIN code'); return }
      if (pinCode.replace(/\D/g, '').length < 5) { toast.error('Please enter a valid PIN code'); return }
      if (!dateOfBirth) { toast.error('Please enter your date of birth'); return }
      setLoading(true)
      try {
        const res = await authService.register({
          name: name.trim(),
          email,
          password,
          phone: phone.trim(),
          address: address.trim(),
          landmark: landmark.trim(),
          pin_code: pinCode.trim(),
          date_of_birth: dateOfBirth,
          gender: gender || undefined,
          preferred_language: preferredLanguage || 'en',
        })
        const token = res.data.access_token
        localStorage.setItem('sentinelrx_token', token)
        const meRes = await authService.me()
        const userData = { ...meRes.data, role: meRes.data.role?.toLowerCase() || 'user' }
        login(userData, token)
        toast.success('Account created! Welcome.')
        navigate(userData.role === 'admin' ? '/admin/dashboard' : '/user/quick-start')
      } catch (err) {
        const msg = err.response?.data?.error?.message || err.message || 'Registration failed'
        toast.error(msg)
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      const res = await authService.login(email, password, role)
      const token = res.data.access_token
      localStorage.setItem('sentinelrx_token', token)
      const meRes = await authService.me()
      const userData = { ...meRes.data, role }
      login(userData, token)
      toast.success(`Welcome back, ${userData.name}!`)
      navigate(ROLE_REDIRECTS[role] || '/user/quick-start')
    } catch (err) {
      let msg = err.response?.data?.error?.message || (typeof err.response?.data?.detail === 'string' ? err.response.data.detail : null) || err.message || 'Invalid credentials'
      if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        msg = 'Backend not running. Start it: cd backend && uvicorn app.main:app --reload'
      }
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-gray-50">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:h-screen lg:min-h-0 lg:shrink-0 w-[42%] bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 flex-col p-12 relative overflow-hidden">
        {/* Spline 3D robot background - my.spline.design embeds via iframe */}
        <div className="absolute inset-0 z-0">
          <iframe
            src={SPLINE_EMBED_URL}
            title="GENKUB Greeting Robot"
            className="w-full h-full border-0"
            style={{ pointerEvents: 'none' }}
          />
        </div>
        {/* Gradient overlay - 25% opacity so robot is 75% visible */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-teal-600/25 via-teal-500/25 to-cyan-500/25" />

        {/* Gradient bar at bottom with info - covers Spline watermark */}
        <div className="absolute bottom-0 left-0 right-0 h-24 z-[2] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-white/90 text-sm font-medium">AI-Powered Pharmacy Platform</p>
            <a href="mailto:ainpharmacyofficial@gmail.com" className="text-teal-400 hover:text-teal-300 text-xs transition-colors">
              ainpharmacyofficial@gmail.com
            </a>
          </div>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/25 p-1.5">
                <img src="/sentinelrx-logo.png" alt="SentinelRx" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-display font-bold text-white text-xl leading-none">SentinelRx AI</p>
                <p className="text-white/60 text-xs mt-0.5">Healthcare Platform</p>
              </div>
            </div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
              <ArrowLeft size={14} /> {t('common.backToHome')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden bg-white">
        <div className="flex min-h-full items-center justify-center p-8 lg:px-12 lg:py-12">
          <div className="w-full max-w-md lg:max-w-lg pb-8">

          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center justify-between mb-6">
              <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-teal-600 text-sm transition-colors">
                <ArrowLeft size={14} /> {t('common.backToHome')}
              </Link>
            </div>
            <div className="flex items-center gap-2.5">
              <img src="/sentinelrx-logo.png" alt="SentinelRx" className="h-9 w-9 object-contain drop-shadow-sm" />
              <span className="font-display text-gray-900 text-lg font-bold">SentinelRx AI</span>
            </div>
          </div>

          {/* Backend status */}
          {backendOk === false && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <p className="font-semibold">Backend not running</p>
              <p className="mt-1 text-xs">Start it in a terminal:</p>
              <code className="block mt-1 p-2 bg-red-100 rounded text-xs overflow-x-auto">
                cd backend && .\.venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload
              </code>
            </div>
          )}

          {/* Title + mode switch */}
          <div className="mb-7">
            <h1 className="font-display text-gray-900 text-3xl font-bold mb-1.5">
              {mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
            </h1>
            {mode === 'signin' ? (
              <p className="text-gray-400 text-sm">
                {t('auth.newHere')}{' '}
                <button onClick={() => switchMode('signup')} className="text-teal-600 font-semibold hover:text-teal-700 underline underline-offset-2">
                  {t('auth.createNewAccount')}
                </button>
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                {t('auth.alreadyHaveAccount')}{' '}
                <button onClick={() => switchMode('signin')} className="text-teal-600 font-semibold hover:text-teal-700 underline underline-offset-2">
                  {t('auth.signInLink')}
                </button>
              </p>
            )}
          </div>

          {/* Role selector — custom dropdown */}
          <div className="mb-6" ref={dropdownRef}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('auth.selectRole')}</p>
            <div className="relative">
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-white text-left transition-all ${
                  dropdownOpen ? 'border-teal-400 ring-2 ring-teal-100' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedRole?.dot}`} />
                <span className="text-xl leading-none">{selectedRole?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-800">{selectedRole?.label}</span>
                  <span className="block text-xs text-gray-400 truncate">{selectedRole?.subtitle}</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => { setRole(r.value); setDropdownOpen(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        role === r.value ? 'bg-gray-50' : ''
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.dot}`} />
                      <span className="text-xl leading-none">{r.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-gray-800">{r.label}</span>
                        <span className="block text-xs text-gray-400">{r.subtitle}</span>
                      </div>
                      {role === r.value && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${r.badge} shrink-0`}>
                          Selected
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preferred Language - show for both signin and signup so login page uses user's choice */}
          <div className="mb-6">
            <label htmlFor="login-lang" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('auth.preferredLanguage')}</label>
            <select
              id="login-lang"
              value={preferredLanguage}
              onChange={(e) => {
                const v = e.target.value
                setPreferredLanguage(v)
                i18n.changeLanguage(v)
                localStorage.setItem('sentinelrx_lang', v)
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white"
            >
              {SUPPORTED.map((code) => (
                <option key={code} value={code}>{t(`languages.${code}`)}</option>
              ))}
            </select>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">

            {mode === 'signup' && (
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.fullLegalName')} *</label>
                <input id="signup-name" name="name" type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" required />
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <input id="login-email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="off"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" required />
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="signup-phone" className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number *</label>
                  <input id="signup-phone" name="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" required />
                </div>
                <div>
                  <label htmlFor="signup-address" className="block text-xs font-semibold text-gray-600 mb-1.5">Full Address *</label>
                  <input id="signup-address" name="address" type="text" value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="Street, area, city"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" required />
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="signup-landmark" className="block text-xs font-semibold text-gray-600 mb-1.5">Landmark *</label>
                    <input id="signup-landmark" name="landmark" type="text" value={landmark} onChange={e => setLandmark(e.target.value)}
                      placeholder="e.g. Near temple"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" required />
                  </div>
                  <div>
                    <label htmlFor="signup-pincode" className="block text-xs font-semibold text-gray-600 mb-1.5">PIN Code *</label>
                    <input id="signup-pincode" name="pin_code" type="text" value={pinCode} onChange={e => setPinCode(e.target.value)}
                      placeholder="e.g. 400001"
                      maxLength={10}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-dob" className="block text-xs font-semibold text-gray-600 mb-1.5">Date of Birth *</label>
                  <input id="signup-dob" name="date_of_birth" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all" required />
                </div>
                <div>
                  <label htmlFor="signup-gender" className="block text-xs font-semibold text-gray-600 mb-1.5">Gender</label>
                  <select id="signup-gender" name="gender" value={gender || 'prefer_not_to_say'} onChange={e => setGender(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input id="login-password" name="password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signup' && <p className="text-xs text-gray-400 mt-1.5">Minimum 8 characters</p>}
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="signup-confirm" className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input id="signup-confirm" name="confirm" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full border rounded-xl px-4 py-3 text-sm pr-11 focus:outline-none focus:ring-2 bg-white transition-all placeholder-gray-300 ${
                      confirm && password !== confirm ? 'border-red-300 focus:ring-red-200 focus:border-red-300'
                      : confirm && password === confirm ? 'border-green-300 focus:ring-green-200 focus:border-green-300'
                      : 'border-gray-200 focus:ring-teal-300 focus:border-teal-300'}`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && password !== confirm && <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>}
                {confirm && password === confirm && <p className="text-xs text-green-600 mt-1.5">✓ Passwords match</p>}
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all shadow-sm mt-1 disabled:opacity-60 ${selectedRole?.btn}`}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('auth.pleaseWait')}</>
                : mode === 'signup'
                  ? <><UserPlus size={16} /> Create {selectedRole?.emoji} {selectedRole?.label} Account</>
                  : <><LogIn size={16} /> Sign in as {selectedRole?.emoji} {selectedRole?.label}</>
              }
            </button>
          </form>

          <p className="text-xs text-gray-300 text-center mt-5">
            {t('auth.termsNotice')}
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
