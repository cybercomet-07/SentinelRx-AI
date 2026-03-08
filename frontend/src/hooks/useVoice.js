import { useState, useEffect, useCallback, useRef } from 'react'
import { getDefaultVoiceLang } from '../utils/voiceLanguages'

// Only one SpeechRecognition can be active at a time in the browser
let activeRecognition = null

/**
 * Web Speech API hook: Speech-to-Text (mic) + Text-to-Speech (AI speaks).
 * Supports multi-language - user speaks in any language, AI speaks back in same language.
 */
/** Max chars for TTS — speak full response. ~80 words for proper medical responses. */
const TTS_MAX_CHARS = 450

/** Strip Markdown and symbols so TTS speaks only the actual text, not asterisks etc. */
function stripForTts(text) {
  if (!text || typeof text !== 'string') return ''
  return (
    String(text)
      .replace(/<[^>]+>/g, ' ')           // HTML tags
      .replace(/\*\*([^*]*)\*\*/g, '$1')  // **bold**
      .replace(/\*([^*]*)\*/g, '$1')     // *italic*
      .replace(/__([^_]*)__/g, '$1')     // __bold__
      .replace(/_([^_]*)_/g, '$1')      // _italic_
      .replace(/`([^`]*)`/g, '$1')       // `code`
      .replace(/[*_`]/g, '')              // leftover asterisks, underscores, backticks
      .replace(/\s+/g, ' ')
      .trim()
  )
}

const VOICE_ERROR_MESSAGES = {
  'not-allowed': 'Microphone access denied. Allow mic in browser settings and try again.',
  'no-speech': 'No speech detected. Please speak clearly and try again.',
  'audio-capture': 'No microphone found. Connect a mic and try again.',
  'network': 'Network error. Check your connection and try again.',
  'aborted': 'Voice input was interrupted.',
}

export function useVoice(options = {}) {
  const {
    lang: initialLang = getDefaultVoiceLang(),
    onTranscript,
    onError,
  } = options

  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [lang, setLang] = useState(initialLang)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)
  const listeningRef = useRef(false)
  const isTogglingRef = useRef(false)
  const transcriptBufferRef = useRef([])

  onTranscriptRef.current = onTranscript
  onErrorRef.current = onError
  listeningRef.current = listening

  // Speech-to-Text: SpeechRecognition - converts user speech to text in selected language
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    let rec
    try {
      rec = new SpeechRecognition()
    } catch (_) {
      return
    }
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang
    rec.maxAlternatives = 1

    const SILENCE_AUTO_STOP_MS = 1800
    let silenceTimer = null

    rec.onresult = (e) => {
      try {
        const results = e.results
        for (let i = 0; i < results.length; i++) {
          const r = results[i]
          if (r?.isFinal && r[0]?.transcript) {
            const t = r[0].transcript.trim()
            if (!t) continue
            const buf = transcriptBufferRef.current
            if (buf.length === 0 || buf[buf.length - 1] !== t) {
              buf.push(t)
            }
            if (silenceTimer) clearTimeout(silenceTimer)
            silenceTimer = setTimeout(() => {
              silenceTimer = null
              try { rec.stop() } catch (_) {}
            }, SILENCE_AUTO_STOP_MS)
          }
        }
      } catch (_) {}
    }
    rec.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      silenceTimer = null
      if (activeRecognition === rec) activeRecognition = null
      listeningRef.current = false
      setListening(false)
      let parts = transcriptBufferRef.current
      transcriptBufferRef.current = []
      while (parts.length > 1) {
        const last = parts[parts.length - 1] || ''
        if (last.length < 3 || /\b(PNG|JPG|JPEG|cloud|GIF)\b/i.test(last) || /^[A-Z0-9\s]+$/.test(last)) {
          parts = parts.slice(0, -1)
        } else break
      }
      const full = parts.join(' ').replace(/\s+/g, ' ').trim()
      if (full.length > 2 && /[a-zA-Z]/.test(full)) {
        onTranscriptRef.current?.(full)
      }
    }
    rec.onerror = (e) => {
      transcriptBufferRef.current = []
      listeningRef.current = false
      setListening(false)
      const msg = VOICE_ERROR_MESSAGES[e?.error] || 'Voice input failed. Try again or type your message.'
      onErrorRef.current?.(msg)
    }

    setRecognition(rec)
    return () => {
      try { rec?.abort() } catch (_) {}
      if (activeRecognition === rec) activeRecognition = null
    }
  }, [lang])

  // Text-to-Speech: speak AI response in user's language.
  // Optional onEnd callback runs when TTS finishes (used to start mic only after AI stops speaking).
  // Pass force=true as 4th arg to always speak (e.g. AI responses) even when ttsEnabled is off.
  const speak = useCallback((text, overrideLang = null, onEnd = null, force = false) => {
    try {
      if (!window.speechSynthesis || !text) {
        setSpeaking(false)
        if (onEnd) onEnd()
        return
      }
      if (!ttsEnabled && !force) {
        setSpeaking(false)
        if (onEnd) onEnd()
        return
      }
      const toSpeak = typeof text === 'string' ? text : String(text)
      let plain = stripForTts(toSpeak)
      if (plain.length > TTS_MAX_CHARS) {
        const cut = plain.slice(0, TTS_MAX_CHARS)
        const lastSpace = cut.lastIndexOf(' ')
        plain = lastSpace > TTS_MAX_CHARS * 0.6 ? cut.slice(0, lastSpace) : cut
      }
      if (!plain) {
        setSpeaking(false)
        if (onEnd) onEnd()
        return
      }

      window.speechSynthesis.cancel()
      setSpeaking(true)
      const u = new SpeechSynthesisUtterance(plain)
      u.lang = overrideLang || lang
      u.rate = 0.95
      u.pitch = 1
      if (onEnd && typeof onEnd === 'function') {
        u.onend = () => {
          setSpeaking(false)
          onEnd()
        }
      } else {
        u.onend = () => setSpeaking(false)
      }
      window.speechSynthesis.speak(u)
    } catch (_) {
      setSpeaking(false)
      if (onEnd) onEnd()
    }
  }, [lang, ttsEnabled])

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [])

  const toggleVoice = useCallback(() => {
    if (isTogglingRef.current) return false
    if (!recognition) {
      onErrorRef.current?.('Voice is starting up. Please try again in a moment.')
      return false
    }
    isTogglingRef.current = true
    try {
      if (listeningRef.current) {
        try { recognition.stop() } catch (_) {}
        if (activeRecognition === recognition) activeRecognition = null
        listeningRef.current = false
        setListening(false)
      } else {
        if (activeRecognition && activeRecognition !== recognition) {
          try { activeRecognition.abort() } catch (_) {}
          activeRecognition = null
        }
        recognition.start()
        activeRecognition = recognition
        listeningRef.current = true
        setListening(true)
      }
    } catch (err) {
      if (err.name === 'InvalidStateError' && String(err.message || '').includes('already started')) {
        listeningRef.current = true
        setListening(true)
      } else {
        try { recognition.abort() } catch (_) {}
        if (activeRecognition === recognition) activeRecognition = null
        listeningRef.current = false
        setListening(false)
        onErrorRef.current?.('Could not start microphone. Check permissions and try again.')
      }
    } finally {
      setTimeout(() => { isTogglingRef.current = false }, 300)
    }
    return true
  }, [recognition])

  const setLanguage = useCallback((newLang) => {
    setLang(newLang)
    if (listening && recognition) {
      recognition.stop()
      setListening(false)
    }
  }, [listening, recognition])

  return {
    listening,
    speaking,
    recognition,
    lang,
    setLanguage,
    ttsEnabled,
    setTtsEnabled,
    speak,
    stopSpeaking,
    toggleVoice,
    isSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    isTtsSupported: !!window.speechSynthesis,
  }
}
