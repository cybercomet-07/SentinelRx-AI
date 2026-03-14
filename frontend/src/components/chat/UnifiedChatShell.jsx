import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Mic, Plus, Send, User, Volume2, VolumeX, Square, MessageSquare, ChevronLeft, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react'
import api from '../../services/api'
import { useVoice } from '../../hooks/useVoice'
import { VOICE_LANGUAGES } from '../../utils/voiceLanguages'
import { getVoicePrompt } from '../../utils/voicePrompts'
import DeliveryAddressForm from '../orders/DeliveryAddressForm'
import PaymentMethodStep from '../orders/PaymentMethodStep'
import UPIQrModal from '../orders/UPIQrModal'

const UNIFIED_CHAT_ENDPOINT = 'ai-chat/unified-chat'
const MEDICINES_ENDPOINT = 'ai-chat/medicines'
const PROCESS_ORDER_ENDPOINT = 'ai-chat/process-order'
const ORDER_ACTION_ENDPOINT = (id) => `ai-chat/order/${id}/action`
const SESSIONS_ENDPOINT = 'ai-chat/sessions'

const DEBOUNCE_DELAY = 300
const MAX_SUGGESTIONS = 5

const CONFIRM_PHRASES = /^(confirm\s*(the\s*)?order|yes\s*confirm|confirm|ok\s*confirm|order\s*confirm|confirm\s*order|yes\s*please|confirm\s*please|yes|ok|okay)$/i
const CANCEL_PHRASES = /^(cancel\s*(the\s*)?order|no\s*cancel|cancel|don'?t\s*confirm|cancel\s*order\.?)$/i

function isConfirmOrderIntent(text) {
  const t = (text || '').trim().toLowerCase()
  return CONFIRM_PHRASES.test(t)
}

function isCancelOrderIntent(text) {
  const t = (text || '').trim().toLowerCase()
  return CANCEL_PHRASES.test(t) || t === 'no' || t === 'cancel'
}

function tryTriggerOrderForm(containerEl, action) {
  if (!containerEl) return false
  const forms = containerEl.querySelectorAll('form#orderForm')
  const lastForm = forms[forms.length - 1]
  if (!lastForm) return false
  const btn = lastForm.querySelector(`button[value="${action}"]`)
  if (!btn) return false
  try {
    lastForm.requestSubmit(btn)
    return true
  } catch {
    return false
  }
}

function normalizeSession(s, newChatLabel) {
  return {
    id: s.id,
    title: s.title || newChatLabel,
    messages: Array.isArray(s.messages) ? s.messages : [],
    createdAt: s.createdAt || s.created_at || Date.now(),
    updatedAt: s.updatedAt || s.updated_at || Date.now(),
  }
}

function generateSessionId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getSessionTitle(messages, newChatLabel) {
  const firstUser = messages?.find((m) => m.role === 'user')
  if (firstUser?.content) {
    const text = typeof firstUser.content === 'string' ? firstUser.content : ''
    return text.slice(0, 40) + (text.length > 40 ? '…' : '')
  }
  return newChatLabel
}

export default function UnifiedChatShell() {
  const { t, i18n } = useTranslation()
  const welcomeMessage = useMemo(() => ({
    role: 'assistant',
    content: t('chat.welcome'),
    timestamp: Date.now(),
    isWelcome: true,
  }), [t, i18n.language])
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const menuRef = useRef(null)

  const messages = sessions.find((s) => s.id === currentSessionId)?.messages ?? [welcomeMessage]
  const setMessages = useCallback(
    (updater) => {
      setSessions((prev) => {
        const targetId = currentSessionId || prev[0]?.id
        if (!targetId) return prev
        const next = prev.map((s) => {
          if (s.id !== targetId) return s
          const newMessages = typeof updater === 'function' ? updater(s.messages || []) : updater
          return { ...s, messages: newMessages, title: getSessionTitle(newMessages, t('chat.newChat')) }
        })
        const updated = next.find((s) => s.id === targetId)
        if (updated) {
          api.patch(`${SESSIONS_ENDPOINT}/${updated.id}`, { title: updated.title, messages: updated.messages }).catch(() => {})
        }
        return next
      })
    },
    [currentSessionId]
  )
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')

  // Fetch sessions from DB on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get(SESSIONS_ENDPOINT)
        const list = res.data?.sessions ?? []
        if (list.length > 0) {
          const normalized = list.map((s) => normalizeSession(s, t('chat.newChat')))
          setSessions(normalized)
          setCurrentSessionId((prev) => prev || normalized[0].id)
        } else {
          const id = generateSessionId()
          const newSession = { id, title: t('chat.newChat'), messages: [welcomeMessage], createdAt: Date.now() }
          await api.post(SESSIONS_ENDPOINT, { id, title: newSession.title, messages: newSession.messages })
          setSessions([newSession])
          setCurrentSessionId(id)
        }
      } catch {
        const id = generateSessionId()
        const newSession = { id, title: t('chat.newChat'), messages: [welcomeMessage], createdAt: Date.now() }
        setSessions([newSession])
        setCurrentSessionId(id)
      } finally {
        setSessionsLoading(false)
      }
    }
    fetchSessions()
  }, [])

  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id)
    }
  }, [currentSessionId, sessions])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [medicineList, setMedicineList] = useState([])
  const [pendingOrder, setPendingOrder] = useState(null)
  const [pendingDelivery, setPendingDelivery] = useState(null)
  const [showPaymentStep, setShowPaymentStep] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [showUpiModal, setShowUpiModal] = useState(false)
  const addMessageRef = useRef(null)
  const addMessage = useCallback((role, content, isHtml = false, orderData = null) => {
    setMessages((prev) => {
      const next = [...(prev || [])]
      if (next.length === 1 && next[0].role === 'assistant') {
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
  }, [setMessages])
  addMessageRef.current = addMessage

  const voice = useVoice({
    onTranscript: (text) => {
      const cleaned = (text || '').trim().replace(/\s+/g, ' ')
      if (!cleaned || cleaned.length < 2) return
      setPrompt(cleaned)
      setTimeout(() => sendMessageRef.current?.(cleaned), 50)
    },
    onError: (msg) => addMessageRef.current?.('assistant', msg),
  })
  const { listening, speaking, lang, setLanguage, ttsEnabled, setTtsEnabled, speak, stopSpeaking, toggleVoice: voiceToggle, isSupported: voiceSupported } = voice
  const [orderProcessing, setOrderProcessing] = useState(false)
  const debounceRef = useRef(null)
  const chatContainerRef = useRef(null)
  const suggestionsRef = useRef(null)
  const sendMessageRef = useRef(null)

  const speakResponse = useCallback((text, onEnd) => {
    voice.speak(text, lang, onEnd, true)
  }, [voice, lang])

  const sendMessage = useCallback(
    async (customText = null) => {
      const text = (customText || prompt).trim()
      if (!text || loading) return

      addMessage('user', text)
      setPrompt('')
      setShowSuggestions(false)

      if (isConfirmOrderIntent(text) && tryTriggerOrderForm(chatContainerRef.current, 'confirm')) return
      if (isCancelOrderIntent(text) && tryTriggerOrderForm(chatContainerRef.current, 'cancel')) return

      setLoading(true)
      try {
        const history = messages.slice(-10).map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content.replace(/<[^>]+>/g, ' ').trim().slice(0, 300) : String(m.content || ''),
        }))
        const res = await api.post(UNIFIED_CHAT_ENDPOINT, { message: text, lang, history, session_id: currentSessionId }, { timeout: 45000 })
        const data = res.data
        const response = data?.response ?? ''
        const toSpeak = data?.speak || (typeof response === 'string' && response.startsWith('<')
          ? response.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 450)
          : response)
        speakResponse(toSpeak)
        if (typeof response === 'string' && response.startsWith('<')) {
          addMessage('assistant', response, true)
        } else {
          addMessage('assistant', response)
        }
      } catch (err) {
        let msg = 'Connection error. Please try again.'
        if (err.code === 'ERR_NETWORK' || !err.response) {
          msg = 'Cannot reach server. Start the backend: run run-backend.ps1 (port 8000).'
        } else if (err.response?.data?.response) {
          msg = err.response.data.response
        } else if (err.response?.data?.detail) {
          msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail)
        } else if (err.response?.status === 401) {
          msg = 'Session expired. Please sign in again.'
        }
        speakResponse(msg)
        addMessage('assistant', msg)
      } finally {
        setLoading(false)
      }
    },
    [prompt, loading, addMessage, speakResponse, lang, messages, currentSessionId]
  )

  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(MEDICINES_ENDPOINT)
        if (Array.isArray(res.data?.medicine_list)) {
          setMedicineList(res.data.medicine_list)
        }
      } catch {}
    }
    load()
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

  const processOrderWithPayload = useCallback(
    async (payload, delivery = null, pm = 'cod') => {
      const fullPayload = { ...payload, ...delivery, payment_method: pm }
      try {
        const res = await api.post(PROCESS_ORDER_ENDPOINT, fullPayload)
        const data = res.data
        if (data?.status === 'confirmed' || data?.status === 'cancelled') {
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
          speakResponse(data?.status === 'confirmed' ? 'Order confirmed successfully.' : 'Order cancelled successfully.')
        } else {
          addMessage('assistant', data?.message || 'Order processing failed.')
          speakResponse(data?.message || 'Order processing failed.')
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.detail || 'Order processing failed. Please try again.'
        addMessage('assistant', msg)
        speakResponse('Order processing failed.')
      }
    },
    [addMessage, speakResponse]
  )

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

      if (action === 'confirm') {
        setPendingOrder(payload)
        if (container) {
          container.querySelectorAll('button').forEach((b) => {
            b.disabled = false
            b.style.opacity = '1'
          })
        }
        return
      }

      setOrderProcessing(true)
      processOrderWithPayload(payload).finally(() => setOrderProcessing(false))
    }

    document.addEventListener('submit', handleSubmit, true)
    return () => document.removeEventListener('submit', handleSubmit, true)
  }, [processOrderWithPayload])

  const handleOrderAction = useCallback(
    async (orderId, action) => {
      if (!orderId || !action) return
      try {
        const res = await api.post(ORDER_ACTION_ENDPOINT(orderId), { action })
        const data = res.data
        if (data?.status === 'cancelled') {
          addMessage('assistant', `❌ Order ${orderId} cancelled successfully.`)
          speakResponse('Order cancelled.')
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
    [addMessage, speakResponse]
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
    if (!voiceSupported) {
      addMessage('assistant', 'Voice input is not supported in this browser. Use Chrome or Edge.')
      return
    }
    const wasListening = listening
    if (wasListening) {
      voiceToggle()
      speakResponse(getVoicePrompt(lang, 'unifiedAgentStopped'))
    } else {
      speakResponse(getVoicePrompt(lang, 'unifiedAgentListening'), () => {
        voiceToggle()
      })
    }
  }

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const startNewChat = useCallback(async () => {
    const id = generateSessionId()
    const newSession = { id, title: t('chat.newChat'), messages: [{ ...welcomeMessage, timestamp: Date.now() }], createdAt: Date.now() }
    try {
      await api.post(SESSIONS_ENDPOINT, { id, title: newSession.title, messages: newSession.messages })
    } catch {}
    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(id)
  }, [t, welcomeMessage])

  const selectSession = useCallback((id) => {
    setCurrentSessionId(id)
    setMenuOpenId(null)
  }, [])

  const deleteSession = useCallback(async (id) => {
    setMenuOpenId(null)
    try {
      await api.delete(`${SESSIONS_ENDPOINT}/${id}`)
    } catch {}
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (currentSessionId === id && next.length > 0) {
        setCurrentSessionId(next[0].id)
      } else if (next.length === 0) {
        const newId = generateSessionId()
        const newSession = { id: newId, title: t('chat.newChat'), messages: [welcomeMessage], createdAt: Date.now() }
        setCurrentSessionId(newId)
        api.post(SESSIONS_ENDPOINT, { id: newId, title: newSession.title, messages: newSession.messages }).catch(() => {})
        return [newSession]
      }
      return next
    })
  }, [currentSessionId, t, welcomeMessage])

  return (
    <div className="flex h-full bg-slate-50/80">
      {/* Chat history sidebar - ChatGPT style */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } flex flex-col border-r border-slate-200 bg-white shrink-0 overflow-hidden transition-all duration-200`}
      >
        <div className="shrink-0 p-3 border-b border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={startNewChat}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors w-full justify-center"
          >
            <Plus size={18} strokeWidth={2.5} />
            {t('chat.newChat')}
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            title="Close sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Your chats</p>
          {sessionsLoading ? (
            <div className="px-4 py-3 text-sm text-slate-400">Loading...</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`group relative flex items-start gap-2 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
                  s.id === currentSessionId ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <MessageSquare size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-3 break-words" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.title}
                  </p>
                </div>
                <div className="relative shrink-0" ref={menuOpenId === s.id ? menuRef : null}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId((prev) => (prev === s.id ? null : s.id))
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="More options"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpenId === s.id && (
                    <div
                      className="absolute right-0 top-full mt-1 py-1 min-w-[140px] bg-white border border-slate-200 rounded-lg shadow-lg z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => deleteSession(s.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-r-lg bg-white border border-slate-200 border-l-0 shadow-sm hover:bg-slate-50"
          title="Open chat history"
        >
          <ChevronRight size={18} />
        </button>
      )}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-800 text-white shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/15"
            title={sidebarOpen ? 'Close history' : 'Open history'}
          >
            <MessageSquare size={18} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20">
            <span className="text-lg">🩺</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">SentinelRX-AI</p>
            <p className="text-[10px] text-white/80 mt-0.5 leading-tight">Symptom recommendations & medicine orders. Type or speak.</p>
          </div>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-white"
        aria-live="polite"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} msg-animate`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-slate-50 text-slate-800 rounded-bl-md border border-slate-100'
              }`}
            >
              {msg.isHtml ? (
                <div
                  className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0"
                  dangerouslySetInnerHTML={{
                    __html: msg.orderFormHandled
                      ? (msg.content || '').replace(/<div[^>]*id="buttonContainer"[^>]*>[\s\S]*?<\/div>/gi, '')
                      : (msg.content || ''),
                  }}
                />
              ) : msg.content ? (
                <p className="whitespace-pre-wrap text-sm leading-snug">
                  {(msg.isWelcome || (i === 0 && msg.role === 'assistant' && (msg.content || '').includes('SentinelRX')))
                    ? t('chat.welcome')
                    : msg.content}
                </p>
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
              <p className="text-[10px] opacity-60 mt-0.5">{formatTime(msg.timestamp)}</p>
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
          {speaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-100 text-red-600 text-xs font-medium hover:bg-red-200 transition-colors"
              title="Stop AI voice"
            >
              <Square size={12} fill="currentColor" />
              Stop
            </button>
          )}
        </div>
        <div className="relative">
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10"
            >
              {suggestions.map((m, idx) => (
                <button
                  key={m.id || idx}
                  type="button"
                  onClick={() => pickSuggestion(m.product_name || m.name)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors ${
                    idx === selectedIndex ? 'bg-slate-100 text-slate-900' : ''
                  }`}
                >
                  {m.product_name || m.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
            <User size={16} className="text-slate-400 shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.typeOrSpeak')}
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
              onClick={(e) => { e.preventDefault(); sendMessage(); }}
              disabled={!prompt.trim() || loading}
              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
              aria-label="Send"
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {pendingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            {!showPaymentStep ? (
              <>
                <h3 className="font-semibold text-slate-900 mb-3">{t('common.deliveryAddress')}</h3>
                <p className="text-sm text-slate-600 mb-4">{t('delivery.provideAddress')}</p>
                <DeliveryAddressForm
                  onSubmit={(delivery) => {
                    setPendingDelivery(delivery)
                    setShowPaymentStep(true)
                  }}
                  onCancel={() => { setPendingOrder(null); setPendingDelivery(null) }}
                  loading={false}
                />
              </>
            ) : (
              <div className="space-y-4">
                <PaymentMethodStep value={paymentMethod} onChange={setPaymentMethod} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowPaymentStep(false); setPendingDelivery(null) }}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={async () => {
                      if (paymentMethod === 'upi') {
                        setShowUpiModal(true)
                        return
                      }
                      setOrderProcessing(true)
                      await processOrderWithPayload(pendingOrder, pendingDelivery, 'cod')
                      setPendingOrder(null)
                      setPendingDelivery(null)
                      setShowPaymentStep(false)
                      setOrderProcessing(false)
                    }}
                    disabled={orderProcessing}
                    className="flex-1 py-2.5 bg-mint-500 hover:bg-mint-600 disabled:opacity-60 text-white rounded-xl font-semibold text-sm"
                  >
                    {orderProcessing ? t('common.loading') : t('common.placeOrder')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <UPIQrModal
        open={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        totalAmount={0}
        onPaid={async () => {
          setShowUpiModal(false)
          setOrderProcessing(true)
          await processOrderWithPayload(pendingOrder, pendingDelivery, 'upi')
          setPendingOrder(null)
          setPendingDelivery(null)
          setShowPaymentStep(false)
          setOrderProcessing(false)
        }}
      />
      </div>
    </div>
  )
}
