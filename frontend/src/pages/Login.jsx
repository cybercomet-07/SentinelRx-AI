import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Activity, Shield, User, Info, ArrowLeft, UserPlus, LogIn } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'

const ROLES = [
  {
    value: 'user',
    label: 'User',
    subtitle: 'Order medicines & track',
    icon: User,
    active: 'border-teal-400 bg-teal-50 text-teal-700',
    inactive: 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50',
    dot: 'bg-teal-400',
    btn: 'bg-teal-500 hover:bg-teal-600',
  },
  {
    value: 'admin',
    label: 'Admin',
    subtitle: 'Manage inventory & orders',
    icon: Shield,
    active: 'border-violet-400 bg-violet-50 text-violet-700',
    inactive: 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50',
    dot: 'bg-violet-400',
    btn: 'bg-violet-600 hover:bg-violet-700',
  },
]

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [role, setRole] = useState('user')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [backendOk, setBackendOk] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

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

  const selectedRole = ROLES.find(r => r.value === role)

  const fillDemo = (r) => {
    setRole(r)
    setMode('signin')
    setEmail(r === 'admin' ? 'admin@example.com' : 'user@sentinelrx.ai')
    setPassword(r === 'admin' ? 'AdminPass123!' : 'User1234')
  }

  const switchMode = (m) => {
    setMode(m)
    setName(''); setEmail(''); setPassword(''); setConfirm('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill all fields'); return }

    if (mode === 'signup') {
      if (!name.trim()) { toast.error('Please enter your full name'); return }
      if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
      if (password !== confirm) { toast.error('Passwords do not match'); return }
      setLoading(true)
      try {
        const res = await authService.register(name, email, password)
        const token = res.data.access_token
        localStorage.setItem('sentinelrx_token', token)
        const meRes = await authService.me()
        const userData = { ...meRes.data, role: meRes.data.role?.toLowerCase() || 'user' }
        login(userData, token)
        toast.success('Account created! Welcome.')
        navigate(role === 'admin' ? '/admin/dashboard' : '/user/chat')
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
      const res = await authService.login(email, password)
      const token = res.data.access_token
      localStorage.setItem('sentinelrx_token', token)
      const meRes = await authService.me()
      const userData = { ...meRes.data, role: meRes.data.role?.toLowerCase() || 'user' }
      if (role === 'admin' && userData.role !== 'admin') {
        toast.error('This is not an admin account. Switch to User role.')
        setLoading(false)
        return
      }
      if (role === 'user' && userData.role === 'admin') {
        toast.success('Logged in as Admin.')
      }
      login(userData, token)
      toast.success(`Welcome back, ${userData.name}!`)
      navigate(userData.role === 'admin' ? '/admin/dashboard' : '/user/chat')
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
    <div className="min-h-screen flex bg-gray-50">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex w-[42%] bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 flex-col p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute top-1/2 -left-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-40 -right-10 w-40 h-40 rounded-full bg-cyan-400/20" />

        <div className="relative flex flex-col h-full">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors w-fit mb-12">
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-xl leading-none">SentinelRx AI</p>
              <p className="text-white/60 text-xs mt-0.5">Pharmacy Platform</p>
            </div>
          </div>

          <div className="flex-1">
            <h2 className="font-display text-white text-4xl font-bold leading-tight mb-4">
              {mode === 'signup' ? 'Join the platform' : 'Welcome back'}
            </h2>
            <p className="text-white/75 text-base leading-relaxed max-w-xs">
              {mode === 'signup'
                ? 'Create your account and start ordering medicines powered by AI.'
                : 'Order medicines with AI-powered chat, track orders, and get smart refill reminders.'}
            </p>
          </div>

          <div className="space-y-3">
            {['AI-powered ordering via chat & voice', 'Smart refill alerts from order history', 'Real-time inventory tracking'].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-white/85 text-sm">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-xs">✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-teal-600 text-sm mb-6 transition-colors">
              <ArrowLeft size={14} /> Back to home
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center">
                <Activity size={17} className="text-white" />
              </div>
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
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h1>
            {mode === 'signin' ? (
              <p className="text-gray-400 text-sm">
                New here?{' '}
                <button onClick={() => switchMode('signup')} className="text-teal-600 font-semibold hover:text-teal-700 underline underline-offset-2">
                  Create a new account
                </button>
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button onClick={() => switchMode('signin')} className="text-teal-600 font-semibold hover:text-teal-700 underline underline-offset-2">
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Role selector cards */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select your role</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(({ value, label, subtitle, icon: Icon, active, inactive, dot }) => {
                const isActive = role === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`relative flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${isActive ? active : inactive}`}
                  >
                    {isActive && <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${dot}`} />}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 ${isActive ? 'bg-current/10' : 'bg-gray-100'}`}>
                      <Icon size={16} className={isActive ? 'opacity-80' : 'text-gray-400'} />
                    </div>
                    <span className="font-semibold text-sm leading-none">{label}</span>
                    <span className={`text-xs leading-tight ${isActive ? 'opacity-60' : 'text-gray-400'}`}>{subtitle}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Demo credentials */}
          {mode === 'signin' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Info size={13} className="text-amber-600 shrink-0" />
                <p className="text-xs font-semibold text-amber-700">Demo credentials — click to auto-fill</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => fillDemo('user')}
                  className="flex-1 bg-white border border-amber-200 text-left px-2.5 py-2 rounded-lg hover:bg-amber-50 transition-colors">
                  <p className="text-xs font-semibold text-gray-700">👤 User</p>
                  <p className="text-xs text-gray-400 mt-0.5">user@sentinelrx.ai / User1234</p>
                </button>
                <button type="button" onClick={() => fillDemo('admin')}
                  className="flex-1 bg-white border border-amber-200 text-left px-2.5 py-2 rounded-lg hover:bg-amber-50 transition-colors">
                  <p className="text-xs font-semibold text-gray-700">🛡️ Admin</p>
                  <p className="text-xs text-gray-400 mt-0.5">admin@example.com / AdminPass123!</p>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {mode === 'signup' && (
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                <input id="signup-name" name="name" type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" />
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <input id="login-email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input id="login-password" name="password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white transition-all placeholder-gray-300" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signup' && <p className="text-xs text-gray-400 mt-1.5">Minimum 6 characters</p>}
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
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Please wait…</>
                : mode === 'signup'
                  ? <><UserPlus size={16} /> Create {selectedRole?.label} Account</>
                  : <><LogIn size={16} /> Sign in as {selectedRole?.label}</>
              }
            </button>
          </form>

          <p className="text-xs text-gray-300 text-center mt-5">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
