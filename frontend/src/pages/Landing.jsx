import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  MessageSquare, ShieldCheck, Bell, BarChart3,
  Package, ArrowRight, Zap, Brain, Clock, Mail
} from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Ordering',
    desc: 'Type or speak naturally — "Order 2 Paracetamol" — and the AI handles the rest. Intent detection, stock check, and confirmation in seconds.',
    color: 'from-teal-400 to-cyan-500',
    bg: 'bg-teal-50',
  },
  {
    icon: MessageSquare,
    title: 'Chat & Voice Input',
    desc: 'Multilingual chat interface with Web Speech API integration. Order medicines hands-free using just your voice.',
    color: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Bell,
    title: 'Smart Refill Alerts',
    desc: 'System tracks your purchase history and intelligently reminds you when its time to refill — before you run out.',
    color: 'from-amber-400 to-orange-400',
    bg: 'bg-amber-50',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    desc: 'Separate portals for users and admins. Users order, track and get alerts. Admins manage inventory, orders and analytics.',
    color: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50',
  },
  {
    icon: BarChart3,
    title: 'Admin Analytics',
    desc: 'Live revenue charts, top medicine rankings, low stock warnings, and order management — all in one dashboard.',
    color: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50',
  },
  {
    icon: Package,
    title: 'Real-Time Inventory',
    desc: 'Connected to your medicine database. Stock levels update instantly when orders are confirmed or cancelled.',
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Tell the AI', desc: 'Type or speak your medicine requirement in plain language.' },
  { step: '02', title: 'AI Checks Stock', desc: 'System detects intent, finds the medicine, verifies availability.' },
  { step: '03', title: 'Confirm Order', desc: 'Review the order preview and tap Confirm. Done.' },
]

// ── Navbar ────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-soft border-b border-gray-100' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/sentinelrx-logo.png" alt="SentinelRx" className="h-9 w-9 object-contain drop-shadow-sm" />
          <span className="font-display font-bold text-gray-900 text-lg tracking-tight">
            Sentinel<span className="text-teal-600">Rx</span> AI
          </span>
        </div>
        <a href="#contact" className="flex items-center gap-2 text-gray-600 hover:text-teal-600 font-medium text-sm transition-colors">
          <Mail size={16} />
          Contact Us
        </a>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 -mt-8">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50/40 to-cyan-50/60" />
      <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.015]"
        style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <div
          className="inline-flex items-center gap-4 mb-8 opacity-0 animate-hero-title"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <img src="/sentinelrx-logo.png" alt="SentinelRx" className="h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-xl" />
          <h1 className="font-display text-5xl md:text-7xl font-bold text-gray-900 leading-[1.08] tracking-tight">
            Sentinel<span className="text-teal-600">Rx</span> AI
          </h1>
        </div>

        <div className="flex justify-center mb-8 animate-slide-up"
          style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center gap-2 bg-white border border-teal-100 text-teal-700 text-xs font-semibold px-4 py-2 rounded-full shadow-soft">
            <Zap size={12} className="fill-teal-500 text-teal-500" />
            AI-Powered Pharmacy Platform
          </div>
        </div>

        <h2 className="font-display text-5xl md:text-7xl font-bold text-gray-900 leading-[1.08] mb-6 animate-slide-up"
          style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
          Your Pharmacy,<br />
          Intelligently Managed
        </h2>

        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up"
          style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
          Order medicines with voice or chat, get smart refill reminders, and let AI handle the entire pharmacy workflow — from intent to delivery.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap animate-slide-up"
          style={{ animationDelay: '0.7s', opacity: 0, animationFillMode: 'forwards' }}>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base"
          >
            Get Started Free <ArrowRight size={18} />
          </button>
          <a href="#how"
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 font-medium text-base transition-colors border border-gray-200 hover:border-teal-200 px-8 py-4 rounded-2xl bg-white/80 hover:bg-teal-50">
            See how it works
          </a>
        </div>

      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-3">Platform Features</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything your pharmacy needs
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            One intelligent system that handles ordering, inventory, alerts, and analytics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <div key={i} className="group p-6 rounded-2xl border border-gray-100 hover:border-teal-100 bg-white hover:shadow-card transition-all duration-300 hover:-translate-y-1">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon size={13} className="text-white" />
                </div>
              </div>
              <h3 className="font-display font-semibold text-gray-900 text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How it Works ──────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Order in 3 simple steps
          </h2>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            The AI handles complexity. You just tell it what you need.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200" />
          {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
            <div key={i} className="relative text-center">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-teal-100 shadow-soft flex flex-col items-center justify-center mx-auto mb-5 relative z-10">
                <span className="text-xs font-mono text-teal-400 font-bold">{step}</span>
                <span className="font-display font-bold text-gray-900 text-sm">{title.split(' ')[0]}</span>
              </div>
              <h3 className="font-display font-semibold text-gray-900 text-xl mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>

        {/* Chat preview */}
        <div className="mt-16 bg-white rounded-3xl border border-gray-100 shadow-card p-6 max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <img src="/sentinelrx-logo.png" alt="SentinelRx" className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-gray-700">SentinelRx AI Chat</span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-teal-500 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-xs">Order 2 Paracetamol</div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-xs">Found Paracetamol 500mg in stock ✓</div>
            </div>
            <div className="flex justify-start">
              <div className="border border-gray-200 rounded-xl p-3 text-sm max-w-xs shadow-soft">
                <p className="font-semibold text-gray-800 mb-1">Order Preview</p>
                <p className="text-gray-600">Paracetamol 500mg × 2</p>
                <p className="text-teal-700 font-bold mt-1">₹24 total</p>
                <div className="flex gap-2 mt-2">
                  <span className="flex-1 bg-teal-500 text-white text-xs text-center py-1.5 rounded-lg font-medium">✓ Confirm</span>
                  <span className="flex-1 border border-gray-200 text-gray-500 text-xs text-center py-1.5 rounded-lg font-medium">✕ Cancel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Contact Us ─────────────────────────────────────────────────────────────
function ContactSection() {
  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-3">Contact Us</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get in touch
          </h2>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            AI-Powered Pharmacy Platform. We&apos;re here to help.
          </p>
        </div>
        <div className="bg-slate-50 rounded-3xl border border-teal-100 p-10 max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/sentinelrx-logo.png" alt="SentinelRx" className="w-12 h-12 object-contain drop-shadow-sm" />
            <h3 className="font-display font-bold text-gray-900 text-xl">SentinelRx AI</h3>
          </div>
          <a href="mailto:ainpharmacyofficial@gmail.com" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold text-lg transition-colors">
            <Mail size={20} />
            ainpharmacyofficial@gmail.com
          </a>
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────
function CTA() {
  const navigate = useNavigate()
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl p-12 relative overflow-hidden shadow-float">
          <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute bottom-[-60px] left-10 w-64 h-64 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-teal-100 text-sm font-semibold tracking-widest uppercase mb-4">Ready to start?</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Get your pharmacy<br />running on AI today
            </h2>
            <p className="text-teal-100 text-lg mb-10 max-w-lg mx-auto">Join the platform. Order smarter. Manage better.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                className="flex items-center gap-2.5 bg-white text-teal-700 font-bold px-8 py-4 rounded-2xl hover:bg-teal-50 transition-all shadow-lg hover:-translate-y-0.5 text-base"
              >
                Create Account <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/login', { state: { mode: 'signin' } })}
                className="text-white/90 hover:text-white font-medium text-base border border-white/30 hover:border-white/60 px-8 py-4 rounded-2xl transition-all"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/sentinelrx-logo.png" alt="SentinelRx" className="h-8 w-8 object-contain brightness-0 invert opacity-90" />
          <span className="font-display font-bold text-white text-base">
            Sentinel<span className="text-teal-400">Rx</span> AI
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-300">AI-Powered Pharmacy Platform</p>
          <a href="mailto:ainpharmacyofficial@gmail.com" className="text-sm text-teal-400 hover:text-teal-300 transition-colors mt-1">
            ainpharmacyofficial@gmail.com
          </a>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Clock size={13} className="text-teal-400" />
          <span>Available 24/7</span>
        </div>
      </div>
    </footer>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen font-body">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <ContactSection />
      <CTA />
      <Footer />
    </div>
  )
}
