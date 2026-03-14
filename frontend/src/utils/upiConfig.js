/**
 * UPI payment config. Used to generate dynamic QR codes with amount.
 * Phase 1: amount=0 (no deduction). Phase 2: use order total.
 */
export const UPI_CONFIG = {
  payeeName: 'Parth Rahul Kulkarni',
  upiId: 'parthkulkarni0007-3@oksbi',
}

/**
 * Build UPI payment URL. When scanned, the amount auto-fills in PhonePe/GPay.
 * @param {number} amount - Amount in rupees (0 for Phase 1)
 * @returns {string} UPI deep link
 */
export function buildUpiUrl(amount = 0) {
  const am = typeof amount === 'number' ? amount.toFixed(2) : '0.00'
  const pn = encodeURIComponent(UPI_CONFIG.payeeName)
  const pa = UPI_CONFIG.upiId
  return `upi://pay?pn=${pn}&pa=${pa}&am=${am}`
}
