import { Mic, MicOff } from 'lucide-react'
import clsx from 'clsx'

export default function VoiceButton({ listening, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
        listening
          ? 'bg-red-100 text-red-500 animate-pulse-soft'
          : 'hover:bg-gray-100 text-gray-500'
      )}
      title={listening ? 'Stop listening' : 'Voice input'}
    >
      {listening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  )
}
