import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Plus, Send, User, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useVoice } from '../../hooks/useVoice'
import { VOICE_LANGUAGES } from '../../utils/voiceLanguages'
import { getVoicePrompt } from '../../utils/voicePrompts'

const WELCOME = {
  role: 'assistant',
  content: "Hi! I'm SentinelRX-AI. Type or speak your symptoms and I'll recommend medicines from our inventory. If we don't have a suitable medicine, I'll advise you to consult a doctor.",
  timestamp: Date.now(),
}

const SYMPTOM_CHAT_ENDPOINT = 'ai-chat/symptom-chat'
const SYMPTOM_CHAT_STORAGE_KEY = 'sentinelrx_symptom_chat'

function getSymptomStorageKey() {
  try {
    const u = JSON.parse(localStorage.getItem('sentinelrx_user') || '{}')
    return `${SYMPTOM_CHAT_STORAGE_KEY}_${u?.id || 'default'}`
  } catch {
    return `${SYMPTOM_CHAT_STORAGE_KEY}_default`
  }
}

function loadStoredMessages() {
  try {
    const raw = localStorage.getItem(getSymptomStorageKey())
    if (!raw) return null
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr) || arr.length === 0) return null
    return arr
  } catch {
    return null
  }
}

export default function SymptomChatShell() {
  const [messages, setMessages] = useState(() => loadStoredMessages() || [WELCOME])
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const chatContainerRef = useRef(null)
  const voice = useVoice({
    onTranscript: (text) => {
      setPrompt(text)
      setTimeout(() => sendMessageRef.current?.(text), 100)
    },
    onError: (msg) => toast.error(msg),
  })
  const { listening, recognition, lang, setLanguage, ttsEnabled, setTtsEnabled, speak, toggleVoice: voiceToggle, isSupported: voiceSupported } = voice
  const sendMessageRef = useRef(null)

  const addMessage = useCallback((role, content) => {
    setMessages((prev) => {
      const next = [...prev]
      if (next.length === 1 && next[0].role === 'assistant' && next[0].content === WELCOME.content) {
        next.shift()
      }
      next.push({ role, content, timestamp: Date.now() })
      return next
    })
  }, [])

  const sendMessage = useCallback(
    async (customText = null) => {
      const text = (customText || prompt).trim()
      if (!text || loading) return

      addMessage('user', text)
      setPrompt('')

      setLoading(true)
      try {
        const res = await api.post(SYMPTOM_CHAT_ENDPOINT, { message: text, lang }, { timeout: 45000 })
        const response = res.data?.response ?? 'No response.'
        addMessage('assistant', response)
        speak(response, lang)
      } catch (err) {
        let msg = 'Something went wrong. Please try again.'
        if (err.code === 'ECONNABORTED') {
          msg = 'Request timed out. The AI is taking longer than usual. Please try again.'
        } else if (err.code === 'ERR_NETWORK' || !err.response) {
          msg = 'Connection error. Make sure the backend is running on port 8000.'
        } else if (err.response?.data?.response) {
          msg = err.response.data.response
        } else if (err.response?.data?.detail) {
          msg = typeof err.response.data.detail === 'string'
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail)
        } else if (err.response?.data?.message) {
          msg = err.response.data.message
        }
        addMessage('assistant', msg)
        speak(msg, lang)
      } finally {
        setLoading(false)
      }
    },
    [prompt, loading, addMessage, speak, lang]
  )

  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  useEffect(() => {
    if (messages.length === 0) return
    try {
      localStorage.setItem(getSymptomStorageKey(), JSON.stringify(messages))
    } catch {}
  }, [messages])

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const startNewChat = useCallback(() => {
    setMessages([{ ...WELCOME, timestamp: Date.now() }])
    try {
      localStorage.removeItem(getSymptomStorageKey())
    } catch {}
  }, [])

  const toggleVoice = () => {
    if (!voiceSupported) {
      addMessage('assistant', 'Voice input is not supported. Use Chrome or Edge.')
      return
    }
    const wasListening = listening
    if (wasListening) {
      voiceToggle()
      speak(getVoicePrompt(lang, 'symptomAgentStopped'), lang)
    } else {
      // Start mic only AFTER AI finishes speaking, so mic does not pick up AI's own voice
      speak(getVoicePrompt(lang, 'symptomAgentListening'), lang, () => {
        voiceToggle()
      })
    }
  }

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-full bg-slate-50/80">
      {/* Compact header bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20">
            <span className="text-lg">🩺</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">SentinelRX-AI</p>
            <p className="text-[10px] text-emerald-100 mt-0.5 leading-tight">Symptom-based medicine recommendations from our inventory.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={startNewChat}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-all text-xs font-medium border border-white/20"
          title="New chat"
        >
          <Plus size={14} strokeWidth={2.5} />
          New chat
        </button>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-5 bg-white"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} msg-animate`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-slate-50 text-slate-800 rounded-bl-md border border-slate-100'
              }`}
            >
              {msg.content && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              )}
              <p className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-1.5 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Compact input */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-3 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <select
            value={lang}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
            title="Speech language"
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setTtsEnabled((v) => !v)}
            className={`p-1.5 rounded-lg transition-all ${ttsEnabled ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}
            title={ttsEnabled ? 'AI speech on' : 'AI speech off'}
          >
            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
          <User size={16} className="text-slate-400 shrink-0" strokeWidth={2} />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Type or speak symptoms"
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none border-none focus:ring-0 min-w-0"
            maxLength={500}
            disabled={loading}
          />
          <button
            type="button"
            onClick={toggleVoice}
            aria-label="Voice input"
            className={`p-2 rounded-lg transition-all ${
              listening ? 'bg-emerald-100 text-emerald-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Mic size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!prompt.trim() || loading}
            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
            aria-label="Send"
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
