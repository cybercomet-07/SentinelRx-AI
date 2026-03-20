import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'mr', label: 'म' },
]

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation()
  const current = i18n.language?.slice(0, 2)

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Globe size={14} className="text-slate-400 shrink-0" />
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`w-7 h-7 text-xs font-semibold rounded-lg transition-colors ${
            current === code
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
          title={code === 'en' ? 'English' : code === 'hi' ? 'Hindi' : 'Marathi'}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
