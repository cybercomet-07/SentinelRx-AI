import { useState, useEffect, useRef } from 'react'
import OrdersTable from '../../components/admin/OrdersTable'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { orderService } from '../../services/orderService'
import { ORDER_STATUS } from '../../utils/constants'

const LIMIT = 10

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const prevFilterRef = useRef(filter)

  const load = (overridePage) => {
    const p = overridePage ?? page
    setError(false)
    setLoading(true)
    orderService.getAll({ page: p, limit: LIMIT, status: filter || undefined })
      .then(r => {
        const data = r.data?.items ?? r.data
        setOrders(Array.isArray(data) ? data.map(o => ({ ...o, total: o.total_amount ?? o.total })) : [])
        setTotal(r.data?.total ?? 0)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const effectivePage = prevFilterRef.current !== filter ? 1 : page
    if (prevFilterRef.current !== filter) {
      prevFilterRef.current = filter
      setPage(1)
    }
    load(effectivePage)
  }, [page, filter])

  if (error) return <ErrorState onRetry={load} />

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!filter ? 'bg-mint-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          All
        </button>
        {Object.entries(ORDER_STATUS).map(([v, { label }]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === v ? 'bg-mint-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <Loader center /> : <OrdersTable orders={orders} onRefresh={load} />}
      <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
    </div>
  )
}
