import { RefreshCw, Clock, Check, Trash2 } from 'lucide-react'

export function RefillAlertCard({ alert, onReorder, onComplete, onDelete }) {
  const isCompleted = alert.is_completed

  return (
    <div
      className={`bg-white border rounded-xl p-4 shadow-soft ${
        isCompleted ? 'border-gray-100 opacity-75' : 'border-orange-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isCompleted ? 'bg-gray-100' : 'bg-orange-50'
          }`}
        >
          <Clock size={16} className={isCompleted ? 'text-gray-400' : 'text-orange-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium text-sm ${
              isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
          >
            {alert.medicine_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Last ordered: {new Date(alert.last_purchase_date ?? alert.last_order_date).toLocaleDateString()}
          </p>
          <p className="text-xs text-orange-600 mt-0.5">
            Suggested refill: {new Date(alert.suggested_refill_date).toLocaleDateString()}
            {alert.reminder_time && (
              <span className="ml-1 text-blue-600">· Call at {alert.reminder_time}</span>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {!isCompleted && (
            <button
              onClick={() => onReorder(alert)}
              className="flex items-center gap-1.5 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={12} />
              Reorder
            </button>
          )}
          {!isCompleted && (
            <button
              onClick={() => onComplete(alert.id)}
              className="flex items-center gap-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Check size={12} />
              Complete
            </button>
          )}
          <button
            onClick={() => onDelete(alert.id)}
            className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AlertPanel({ alerts, onReorder, onComplete, onDelete }) {
  if (!alerts?.length)
    return (
      <div className="text-center py-8 text-gray-400 text-sm">No refill alerts at the moment.</div>
    )
  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <RefillAlertCard
          key={a.id}
          alert={a}
          onReorder={onReorder}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
