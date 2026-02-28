import { useState } from 'react'
import { Send } from 'lucide-react'
import VoiceButton from './VoiceButton'
import { useVoice } from '../../hooks/useVoice'

export default function ChatInputBar({ onSend, disabled }) {
  const [text, setText] = useState('')

  const handleTranscript = (t) => {
    setText(t)
  }

  const { listening, startListening, stopListening } = useVoice(handleTranscript)

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="border-t border-gray-100 bg-white/80 backdrop-blur-md p-4">
      <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-mint-300 focus-within:shadow-sm transition-all px-4 py-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Type your message or ask about medicines…"
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
          style={{ maxHeight: 120 }}
          disabled={disabled}
        />
        <div className="flex items-center gap-1 shrink-0">
          <VoiceButton
            listening={listening}
            onClick={listening ? stopListening : startListening}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className="w-10 h-10 bg-mint-500 hover:bg-mint-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        AI responses are informational. Always consult a pharmacist for medical advice.
      </p>
    </div>
  )
}
