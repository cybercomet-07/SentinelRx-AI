import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import OrderHistoryTable from '../../components/orders/OrderHistoryTable'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { orderService } from '../../services/orderService'

const LIMIT = 10

export default function OrderHistoryPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = (overridePage) => {
    const p = overridePage ?? page
    setError(false)
    setLoading(true)
    orderService.getMyOrders({ page: p, limit: LIMIT })
      .then(r => {
        const data = r.data?.items ?? r.data
        const list = Array.isArray(data) ? data : []
        setOrders(list.map(o => ({ ...o, total: o.total_amount ?? o.total })))
        setTotal(r.data?.total ?? list.length)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  const handlePageChange = (p) => setPage(p)

  if (error) return <ErrorState onRetry={() => { setPage(1); load(1) }} />
  if (loading && orders.length === 0) return <Loader center />

  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-500">{t('common.ordersFound', { count: total })}</p>
      <OrderHistoryTable orders={orders} />
      <Pagination page={page} limit={LIMIT} total={total} onPageChange={handlePageChange} />
    </div>
  )
}
