// Simple heuristic – expand as needed
const HINDI_PATTERN = /[\u0900-\u097F]/
const MEDICINE_KEYWORDS = ['order', 'buy', 'need', 'want', 'give me', 'send', 'paracetamol', 'tablet', 'medicine', 'dawa']

export const detectLanguage = (text) => {
  if (HINDI_PATTERN.test(text)) return 'hi'
  return 'en'
}

export const isOrderIntent = (text) => {
  const lower = text.toLowerCase()
  return MEDICINE_KEYWORDS.some(k => lower.includes(k))
}
