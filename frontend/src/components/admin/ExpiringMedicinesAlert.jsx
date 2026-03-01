import { useState, useEffect } from 'react'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { adminService } from '../../services/adminService'

export default function ExpiringMedicinesAlert({ count }) {
  const [items, setItems] = useState([])
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getExpiringMedicines()
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [count])

  if (count === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-soft">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-red-900">
              {count} medicine{count !== 1 ? 's' : ''} expiring in next 7 days
            </h3>
            <p className="text-sm text-red-600 mt-0.5">Click to view details</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} className="text-red-600" /> : <ChevronDown size={20} className="text-red-600" />}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-red-100">
          {loading ? (
            <div className="flex justify-center py-4">
              <span className="w-6 h-6 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-red-600">No expiring medicines found.</p>
          ) : (
            <div className="space-y-3">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2.5 px-4 bg-white rounded-xl border border-red-100"
                >
                  <span className="font-medium text-gray-900">{m.name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">Stock: {m.quantity}</span>
                    <span className="font-semibold text-red-600">
                      Expires: {m.expiry_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
