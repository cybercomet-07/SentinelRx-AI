import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Send, User } from 'lucide-react'
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

        if (container) container.style.display = 'none'

        if (data?.status === 'confirmed') {
          addMessage('assistant', '✓ Order confirmed! Here are your order details:', false, {
            orderId: data.order_id,
            items: data.items || [],
            total: data.total ?? 0,
          })
          speak('Order confirmed successfully.')
        } else if (data?.status === 'cancelled') {
          addMessage('assistant', `❌ Order Cancelled (ID: ${data.order_id})`)
          speak('Order cancelled successfully.')
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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header - AI Pharmaceutical Assistant style */}
      <div className="flex items-center gap-3 px-4 py-4 bg-[#1e3a5f] text-white">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <span className="text-lg">💊</span>
        </div>
        <div>
          <p className="text-base font-semibold">AI Pharmaceutical Assistant</p>
          <p className="text-xs text-white/80">Personalized medicine recommendations and professional health guidance.</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
        aria-live="polite"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              {msg.isHtml ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              ) : msg.content ? (
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              ) : null}
              {msg.orderData && !msg.orderData.cancelled && (
                <div className="mt-3 p-4 rounded-xl bg-gray-100 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-green-600">✓</span>
                    <span className="font-semibold text-gray-900">Order Confirmed</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Order ID: {msg.orderData.orderId}</p>
                  <div className="space-y-2 text-sm text-gray-700">
                    {msg.orderData.items?.map((it) => (
                      <div key={it.medicine_name} className="py-1">
                        <div><strong>Medicine:</strong> {it.medicine_name}</div>
                        <div><strong>Quantity:</strong> {it.quantity} · <strong>Subtotal:</strong> ₹{it.subtotal}</div>
                      </div>
                    ))}
                  </div>
                  <div className="font-semibold mt-3 pt-2 border-t border-gray-200 text-gray-900">Total billing amount: ₹{msg.orderData.total}</div>
                  <div className="flex gap-2 mt-3">
                    <Link
                      to="/user/orders"
                      className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      Confirm Order
                    </Link>
                    <Link
                      to="/user/orders"
                      className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
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
            <div className="flex gap-1 px-4 py-3 bg-gray-100 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input - Reference style: light grey bar, person icon, purple mic, green send */}
      <div className="border-t border-gray-200 bg-gray-100 p-4">
        <div className="relative">
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-t-xl shadow-lg max-h-48 overflow-y-auto z-10"
            >
              {suggestions.map((m, idx) => (
                <button
                  key={m.id || idx}
                  type="button"
                  onClick={() => pickSuggestion(m.product_name || m.name)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                    idx === selectedIndex ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  {m.product_name || m.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 focus-within:border-blue-300 focus-within:shadow-sm transition-all px-4 py-3">
            <User size={20} className="text-gray-400" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type or speak the medicine name..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              maxLength={500}
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleVoice}
              aria-label="Voice input"
              className={`p-2 rounded-lg transition-colors ${
                listening ? 'bg-purple-100 text-purple-600' : 'text-purple-500 hover:bg-purple-50'
              }`}
            >
              <Mic size={20} />
            </button>
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!prompt.trim() || loading}
              className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
              aria-label="Send"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
