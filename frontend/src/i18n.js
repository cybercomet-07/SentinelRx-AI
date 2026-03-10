import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import hi from './locales/hi.json'
import mr from './locales/mr.json'

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
}

const SUPPORTED = ['en', 'hi', 'mr']

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'sentinelrx_lang',
      caches: ['localStorage'],
    },
  })

export { SUPPORTED }
export default i18n
