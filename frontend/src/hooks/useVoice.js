import { useState, useEffect, useCallback, useRef } from 'react'
import { getDefaultVoiceLang } from '../utils/voiceLanguages'

// Only one SpeechRecognition can be active at a time in the browser
let activeRecognition = null

/**
 * Web Speech API hook: Speech-to-Text (mic) + Text-to-Speech (AI speaks).
 * Supports multi-language - user speaks in any language, AI speaks back in same language.
 */
export function useVoice(options = {}) {
  const {
    lang: initialLang = getDefaultVoiceLang(),
    onTranscript,
  } = options

  const [listening, setListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [lang, setLang] = useState(initialLang)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const onTranscriptRef = useRef(onTranscript)
  const listeningRef = useRef(false)
  const isTogglingRef = useRef(false)

  onTranscriptRef.current = onTranscript
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
    rec.continuous = false
    rec.interimResults = false
    rec.lang = lang

    rec.onresult = (e) => {
      try {
        const text = e.results[e.results.length - 1][0]?.transcript?.trim()
        if (text) onTranscriptRef.current?.(text)
      } catch (_) {}
    }
    rec.onend = () => {
      if (activeRecognition === rec) activeRecognition = null
      listeningRef.current = false
      setListening(false)
    }
    rec.onerror = () => {
      listeningRef.current = false
      setListening(false)
    }

    setRecognition(rec)
    return () => {
      try { rec?.abort() } catch (_) {}
      if (activeRecognition === rec) activeRecognition = null
    }
  }, [lang])

  // Text-to-Speech: speak AI response in user's language
  const speak = useCallback((text, overrideLang = null) => {
    try {
      if (!window.speechSynthesis || !ttsEnabled || !text) return
      const toSpeak = typeof text === 'string' ? text : String(text)
      const plain = toSpeak.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (!plain) return

      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(plain)
      u.lang = overrideLang || lang
      u.rate = 0.95
      u.pitch = 1
      window.speechSynthesis.speak(u)
    } catch (_) {}
  }, [lang, ttsEnabled])

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  }, [])

  const toggleVoice = useCallback(() => {
    if (!recognition || isTogglingRef.current) return false
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
