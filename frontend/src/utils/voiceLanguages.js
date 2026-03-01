/**
 * Web Speech API supported languages for Speech-to-Text and Text-to-Speech.
 * BCP-47 codes for Indian and common regional languages.
 */
export const VOICE_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'हिंदी (Hindi)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml-IN', label: 'മലയാളം (Malayalam)' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
  { code: 'ur-IN', label: 'اردو (Urdu)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
]

const INDIAN_LANGS = ['hi', 'mr', 'ta', 'te', 'bn', 'kn', 'ml', 'pa', 'gu', 'ur']

export function getDefaultVoiceLang() {
  if (typeof navigator === 'undefined') return 'en-IN'
  const nav = navigator.language || 'en-IN'
  const base = nav.split('-')[0]?.toLowerCase()
  if (INDIAN_LANGS.includes(base)) return `${base}-IN`
  if (base === 'en') return 'en-IN'
  return 'en-IN'
}
