import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Plus, Send, User } from 'lucide-react'
import api from '../../services/api'
import { API_BASE } from '../../utils/constants'

const WELCOME = {
  role: 'assistant',
  content: "Hi! How can I help you today? I'm here to take your medicine order. Just tell me the name of the medicine you need — type it or click the mic button to speak. I'll check our stock and confirm your order.",
  timestamp: Date.now(),
}

const MEDICINES_ENDPOINT = 'ai-chat/medicines'
const CHAT_ENDPOINT = 'ai-chat/chat'
const PROCESS_ORDER_ENDPOINT = 'ai-chat/process-order'
const ORDER_ACTION_ENDPOINT = (id) => `ai-chat/order/${id}/action`

const DEBOUNCE_DELAY = 300
const MAX_SUGGESTIONS = 5
const CHAT_STORAGE_KEY = 'sentinelrx_chat'

function getChatStorageKey() {
  try {
    const u = JSON.parse(localStorage.getItem('sentinelrx_user') || '{}')
    return `${CHAT_STORAGE_KEY}_${u?.id || 'default'}`
  } catch {
    return `${CHAT_STORAGE_KEY}_default`
  }
}

function loadStoredMessages() {
  try {
    const raw = localStorage.getItem(getChatStorageKey())
    if (!raw) return null
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr) || arr.length === 0) return null
    return arr
  } catch {
    return null
  }
}

export default function ChatShell() {
  const [messages, setMessages] = useState(() => loadStoredMessages() || [WELCOME])
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [medicineList, setMedicineList] = useState([])
  const [listening, setListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const debounceRef = useRef(null)
  const chatContainerRef = useRef(null)
  const suggestionsRef = useRef(null)
  const sendMessageRef = useRef(null)

  const addMessage = useCallback((role, content, isHtml = false, orderData = null) => {
    setMessages((prev) => {
      const next = [...prev]
      if (next.length === 1 && next[0].role === 'assistant' && next[0].content === WELCOME.content) {
        next.shift()
      }
      next.push({
        role,
        content,
        isHtml,
        orderData,
        timestamp: Date.now(),
      })
      return next
    })
  }, [])

  const sendMessage = useCallback(
    async (customText = null) => {
      const text = (customText || prompt).trim()
      if (!text || loading) return

      addMessage('user', text)
      setPrompt('')
      setShowSuggestions(false)

      setLoading(true)
      try {
        const res = await api.post(CHAT_ENDPOINT, { message: text })
        const data = res.data
        const response = data?.response ?? ''
        if (typeof response === 'string' && response.startsWith('<')) {
          addMessage('assistant', response, true)
        } else {
          addMessage('assistant', response)
        }
      } catch (err) {
        const msg = err.code === 'ERR_NETWORK' || !err.response
          ? 'Connection error. Make sure the backend is running on port 8000 (run run-backend.bat).'
          : 'Connection error. Please try again.'
        addMessage('assistant', msg)
      } finally {
        setLoading(false)
      }
    },
    [prompt, loading, addMessage]
  )

  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  // Persist chat to localStorage so it survives navigation
  useEffect(() => {
    if (messages.length === 0) return
    try {
      localStorage.setItem(getChatStorageKey(), JSON.stringify(messages))
    } catch {
      // ignore quota or parse errors
    }
  }, [messages])

  // Load medicines for autocomplete
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(MEDICINES_ENDPOINT)
        if (Array.isArray(res.data?.medicine_list)) {
          setMedicineList(res.data.medicine_list)
        }
      } catch {
        // ignore
      }
    }
    load()
  }, [])

  // Voice recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-IN'
    rec.onresult = (e) => {
      const text = e.results[e.results.length - 1][0].transcript?.trim()
      if (text) {
        setPrompt(text)
        // Auto-send voice command (like agentic)
        setTimeout(() => sendMessageRef.current?.(text), 100)
      }
    }
    setRecognition(rec)
    return () => rec?.abort()
  }, [])

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'
    window.speechSynthesis.speak(u)
  }, [])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Autocomplete
  useEffect(() => {
    if (!prompt.trim()) {
      setShowSuggestions(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const term = prompt.split(/[,\s]/).pop()?.trim()?.toLowerCase()
      if (!term || term.length < 2) {
        setShowSuggestions(false)
        return
      }
      const matches = medicineList
        .filter((m) => (m.product_name || m.name || '').toLowerCase().includes(term))
        .slice(0, MAX_SUGGESTIONS)
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0)
      setSelectedIndex(-1)
    }, DEBOUNCE_DELAY)
    return () => clearTimeout(debounceRef.current)
  }, [prompt, medicineList])

  // Order form submit handler (delegated)
  useEffect(() => {
    const handleSubmit = async (e) => {
      const form = e.target
      if (!form || form.id !== 'orderForm') return
      e.preventDefault()

      const container = form.querySelector('#buttonContainer')
      if (container) {
        container.querySelectorAll('button').forEach((b) => {
          b.disabled = true
          b.style.opacity = '0.6'
        })
      }

      const submitter = e.submitter
      const action = submitter?.value === 'cancel' ? 'cancel' : 'confirm'
      let orderId = ''
      let items = []
      try {
        const dataOrder = form.getAttribute('data-order')
        if (dataOrder) {
          const parsed = JSON.parse(dataOrder)
          orderId = parsed.order_id || ''
          const baseItems = parsed.items || []
          baseItems.forEach((it) => {
            const medicineName = String(it.medicine_name || '').trim()
            if (!medicineName) return
            const safeId = medicineName.replace(/[^a-zA-Z0-9_]/g, '_')
            const qtyInput = form.querySelector(`input[name="quantity_${safeId}"]`)
            const quantity = Math.max(1, Math.min(parseInt(qtyInput?.value, 10) || it.quantity || 1, 10))
            items.push({ medicine_name: medicineName, quantity })
          })
        }
      } catch (_) {}
      if (!items.length) {
        orderId = form.querySelector('input[name="order_id"]')?.value?.trim() || ''
        form.querySelectorAll('input[name^="quantity_"]').forEach((input) => {
          const safeId = input.name.replace('quantity_', '')
          const medicineInput = form.querySelector(`input[name="medicine_${safeId}"]`)
          const medicineName = medicineInput?.value?.trim()
          const quantity = parseInt(input.value, 10) || 1
          if (medicineName) items.push({ medicine_name: medicineName, quantity })
        })
      }

      const payload = { order_id: orderId, action, items }

      try {
        const res = await api.post(PROCESS_ORDER_ENDPOINT, payload)
        const data = res.data

        if (data?.status === 'confirmed' || data?.status === 'cancelled') {
          // Mark the previous message (order form) as handled so Confirm/Cancel buttons are hidden
          setMessages((prev) => {
            const next = [...prev]
            const lastIdx = next.length - 1
            if (lastIdx >= 0 && next[lastIdx].isHtml) {
              next[lastIdx] = { ...next[lastIdx], orderFormHandled: true }
            }
            const newMsg = data?.status === 'confirmed'
              ? { role: 'assistant', content: '✓ Order confirmed! Here are your order details:', isHtml: false, orderData: { orderId: data.order_id, items: data.items || [], total: data.total ?? 0 }, timestamp: Date.now() }
              : { role: 'assistant', content: `❌ Order Cancelled (ID: ${data.order_id})`, isHtml: false, orderData: null, timestamp: Date.now() }
            next.push(newMsg)
            return next
          })
          speak(data?.status === 'confirmed' ? 'Order confirmed successfully.' : 'Order cancelled successfully.')
        } else {
          addMessage('assistant', data?.message || 'Order processing failed.')
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.detail || 'Order processing failed. Please try again.'
        addMessage('assistant', msg)
        speak('Order processing failed.')
      }
    }

    document.addEventListener('submit', handleSubmit, true)
    return () => document.removeEventListener('submit', handleSubmit, true)
  }, [addMessage, speak])

  // Order action (cancel/edit) - delegated click handler
  const handleOrderAction = useCallback(
    async (orderId, action) => {
      if (!orderId || !action) return
      try {
        const res = await api.post(ORDER_ACTION_ENDPOINT(orderId), { action })
        const data = res.data
        if (data?.status === 'cancelled') {
          addMessage('assistant', `❌ Order ${orderId} cancelled successfully.`)
          speak('Order cancelled.')
          setMessages((prev) =>
            prev.map((m) =>
              m.orderData?.orderId === orderId ? { ...m, orderData: { ...m.orderData, cancelled: true } } : m
            )
          )
        }
      } catch (err) {
        addMessage('assistant', err.response?.data?.detail || 'Failed to cancel order.')
      }
    },
    [addMessage, speak]
  )

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i < suggestions.length - 1 ? i + 1 : i))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i > 0 ? i - 1 : -1))
        return
      }
      if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        const name = suggestions[selectedIndex]?.product_name || suggestions[selectedIndex]?.name
        if (name) {
          const parts = prompt.split(/[,\s]/).slice(0, -1).join(' ')
          setPrompt(parts ? `${parts} ${name}` : name)
          setShowSuggestions(false)
        }
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const pickSuggestion = (name) => {
    const parts = prompt.split(/[,\s]/).slice(0, -1).join(' ')
    setPrompt(parts ? `${parts} ${name}` : name)
    setShowSuggestions(false)
  }

  const toggleVoice = () => {
    if (!recognition) {
      addMessage('assistant', 'Voice input is not supported in this browser. Use Chrome or Edge.')
      return
    }
    if (listening) {
      recognition.stop()
      setListening(false)
      speak('Voice stopped.')
    } else {
      recognition.start()
      setListening(true)
      speak('Listening... Tell me the medicine name you need.')
    }
  }

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const startNewChat = useCallback(() => {
    setMessages([{ ...WELCOME, timestamp: Date.now() }])
    try {
      localStorage.removeItem(getChatStorageKey())
    } catch {}
  }, [])

  return (
    <div className="flex flex-col h-full bg-slate-50/80">
      {/* Header - Professional pharmaceutical style */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <span className="text-2xl">💊</span>
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">AI Pharmaceutical Assistant</p>
            <p className="text-xs text-blue-100 mt-0.5">Personalized medicine recommendations and professional health guidance.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={startNewChat}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-all duration-200 text-sm font-medium border border-white/20"
          title="New chat"
        >
          <Plus size={18} strokeWidth={2.5} />
          New chat
        </button>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-5 bg-white"
        aria-live="polite"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} msg-animate`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-slate-50 text-slate-800 rounded-bl-md border border-slate-100'
              }`}
            >
              {msg.isHtml ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: msg.orderFormHandled
                      ? (msg.content || '').replace(/<div[^>]*id="buttonContainer"[^>]*>[\s\S]*?<\/div>/gi, '')
                      : (msg.content || ''),
                  }}
                />
              ) : msg.content ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              ) : null}
              {msg.orderData && !msg.orderData.cancelled && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-emerald-600 font-semibold">✓</span>
                    <span className="font-semibold text-slate-900">Order Confirmed</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 font-mono">Order ID: {msg.orderData.orderId}</p>
                  <div className="space-y-2 text-sm text-slate-700">
                    {msg.orderData.items?.map((it) => (
                      <div key={it.medicine_name} className="py-1.5 border-b border-slate-100 last:border-0">
                        <div><strong className="text-slate-800">Medicine:</strong> {it.medicine_name}</div>
                        <div><strong className="text-slate-800">Quantity:</strong> {it.quantity} · <strong>Subtotal:</strong> ₹{it.subtotal}</div>
                      </div>
                    ))}
                  </div>
                  <div className="font-semibold mt-3 pt-3 border-t border-slate-200 text-slate-900">Total billing amount: ₹{msg.orderData.total}</div>
                  <div className="flex gap-2 mt-4">
                    <Link
                      to="/user/orders"
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      View in Order History
                    </Link>
                  </div>
                </div>
              )}
              <p className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-1.5 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input - Professional pharmaceutical style */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-5">
        <div className="relative">
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10"
            >
              {suggestions.map((m, idx) => (
                <button
                  key={m.id || idx}
                  type="button"
                  onClick={() => pickSuggestion(m.product_name || m.name)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors ${
                    idx === selectedIndex ? 'bg-slate-100 text-slate-900' : ''
                  }`}
                >
                  {m.product_name || m.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-sm">
            <User size={20} className="text-slate-400" strokeWidth={2} />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type or speak the medicine name..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none border-none focus:ring-0"
              maxLength={500}
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleVoice}
              aria-label="Voice input"
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                listening ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Mic size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!prompt.trim() || loading}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
              aria-label="Send"
            >
              <Send size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
