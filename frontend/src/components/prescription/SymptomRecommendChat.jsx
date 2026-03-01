import { useState, useRef, useEffect, useCallback } from 'react'
import { prescriptionService } from '../../services/prescriptionService'
import { MessageCircle, Send, Loader2, Mic, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'
import { useVoice } from '../../hooks/useVoice'
import { VOICE_LANGUAGES } from '../../utils/voiceLanguages'

const PLACEHOLDER = "e.g. I have fever but I don't have a doctor's prescription"

export default function SymptomRecommendChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const handleSubmitRef = useRef(null)
  const voice = useVoice({
    onTranscript: (text) => {
      setInput(text)
      setTimeout(() => handleSubmitRef.current?.(text), 100)
    },
  })
  const { listening, lang, setLanguage, ttsEnabled, setTtsEnabled, speak, toggleVoice: voiceToggle, isSupported: voiceSupported } = voice

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submitWithText = useCallback(async (textToSend) => {
    const text = (textToSend ?? input).trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await prescriptionService.getSymptomRecommendation(text, lang)
      const recommendation = res.data?.recommendation || 'Unable to get recommendation.'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: recommendation },
      ])
      speak(recommendation, lang)
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to get recommendation'
      toast.error(typeof msg === 'string' ? msg : 'Request failed')
      const errContent = 'Sorry, we could not process your request. Please try again.'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errContent },
      ])
      speak(errContent, lang)
    } finally {
      setLoading(false)
    }
  }, [input, loading, speak, lang])

  useEffect(() => {
    handleSubmitRef.current = submitWithText
  }, [submitWithText])

  const handleSubmit = (e) => {
    e?.preventDefault()
    submitWithText()
  }

  const toggleVoice = () => {
    if (!voiceSupported) {
      toast.error('Voice input is not supported. Use Chrome or Edge.')
      return
    }
    voiceToggle()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <MessageCircle size={32} className="mx-auto mb-3 text-teal-300" />
            <p className="font-medium text-gray-600">No prescription? Get suggestions</p>
            <p className="mt-1 text-xs">
              Describe your symptoms. We'll suggest OTC medicines from our inventory with dosage limits.
            </p>
            <p className="mt-2 text-xs text-amber-600">
              Sleep aids, antibiotics & blood pressure meds require a doctor's prescription.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Searching our medicine index...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <select
            value={lang}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700"
            title="Speech language"
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setTtsEnabled((v) => !v)}
            className={`p-1.5 rounded-lg transition-all ${ttsEnabled ? 'text-teal-600 bg-teal-50' : 'text-gray-400'}`}
            title={ttsEnabled ? 'AI speech on' : 'AI speech off'}
          >
            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
            disabled={loading}
          />
          <button
            type="button"
            onClick={toggleVoice}
            aria-label="Voice input"
            className={`p-2.5 rounded-xl transition-all ${
              listening ? 'bg-teal-100 text-teal-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <Mic size={18} strokeWidth={2} />
          </button>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
