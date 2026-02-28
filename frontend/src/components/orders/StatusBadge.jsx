import { ORDER_STATUS } from '../../utils/constants'

export default function StatusBadge({ status }) {
  const key = (status || '').toUpperCase()
  const config = ORDER_STATUS[key] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
