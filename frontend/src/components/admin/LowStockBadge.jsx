export default function LowStockBadge({ qty }) {
  if (qty > 10) return null
  const color = qty === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
  const label = qty === 0 ? 'Out of Stock' : `Low: ${qty} left`
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}
