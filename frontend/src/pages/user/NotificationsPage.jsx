import { useState, useEffect, useRef } from 'react'
import AlertPanel from '../../components/notifications/AlertPanel'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { notificationService } from '../../services/notificationService'
import { refillAlertService } from '../../services/refillAlertService'
import { medicineService } from '../../services/medicineService'
import { Bell, RefreshCw, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const NOTIF_LIMIT = 10

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [notifPage, setNotifPage] = useState(1)
  const [notifTotal, setNotifTotal] = useState(0)
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    medicine_id: '',
    last_purchase_date: '',
    suggested_refill_date: '',
  })

  const [alertsError, setAlertsError] = useState(false)
  const [notificationsError, setNotificationsError] = useState(false)
  const [medicinesError, setMedicinesError] = useState(false)

  const fetchAlerts = async () => {
    try {
      setAlertsError(false)
      const res = await refillAlertService.getAll()
      const data = res.data?.items ?? res.data ?? []
      setAlerts(Array.isArray(data) ? data : [])
    } catch {
      setAlerts([])
      setAlertsError(true)
    }
  }

  const fetchNotifications = async (page = 1) => {
    try {
      setNotificationsError(false)
      const res = await notificationService.getAll({ page, limit: NOTIF_LIMIT })
      const nData = res.data?.items ?? res.data ?? []
      setNotifications(Array.isArray(nData) ? nData.map(n => ({ ...n, read: n.is_read ?? n.read })) : [])
      setNotifTotal(res.data?.total ?? 0)
    } catch {
      setNotifications([])
      setNotificationsError(true)
    }
  }

  const fetchMedicines = async () => {
    try {
      setMedicinesError(false)
      const res = await medicineService.getAll({ limit: 100 })
      const list = res.data?.items ?? res.data ?? []
      setMedicines(Array.isArray(list) ? list : [])
    } catch {
      setMedicines([])
      setMedicinesError(true)
    }
  }

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      fetchAlerts(),
      fetchNotifications(notifPage),
      fetchMedicines(),
    ]).finally(() => setLoading(false))
  }

  const notifPageInitialized = useRef(false)
  useEffect(loadAll, [])

  useEffect(() => {
    if (!notifPageInitialized.current) {
      notifPageInitialized.current = true
      return
    }
    fetchNotifications(notifPage)
  }, [notifPage])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.medicine_id || !form.last_purchase_date || !form.suggested_refill_date) {
      toast.error('Please fill all fields')
      return
    }
    if (new Date(form.suggested_refill_date) < new Date(form.last_purchase_date)) {
      toast.error('Suggested refill date must be after last purchase')
      return
    }
    setCreating(true)
    try {
      await refillAlertService.create(form)
      toast.success('Refill alert created')
      setForm({ medicine_id: '', last_purchase_date: '', suggested_refill_date: '' })
      setShowCreateForm(false)
      await fetchAlerts()
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? err.response?.data?.detail ?? 'Failed to create alert')
    } finally {
      setCreating(false)
    }
  }

  const handleComplete = async (id) => {
    try {
      await refillAlertService.complete(id)
      toast.success('Marked as complete')
      await fetchAlerts()
    } catch {
      toast.error('Failed to mark complete')
    }
  }

  const handleDelete = async (id) => {
    try {
      await refillAlertService.delete(id)
      toast.success('Alert removed')
      await fetchAlerts()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleReorder = (alert) => {
    toast.success(`Reorder for ${alert.medicine_name} placed!`)
  }

  if (loading) return <Loader center />

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-orange-500" />
            <h2 className="font-display font-semibold text-gray-900">Refill Alerts</h2>
            {alerts.length > 0 && (
              <span className="ml-1 bg-orange-100 text-orange-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <Plus size={14} />
            {showCreateForm ? 'Cancel' : 'Create'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Medicine</label>
              <select
                value={form.medicine_id}
                onChange={(e) => setForm((f) => ({ ...f, medicine_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                required
              >
                <option value="">Select medicine</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last purchase date</label>
              <input
                type="date"
                value={form.last_purchase_date}
                onChange={(e) => setForm((f) => ({ ...f, last_purchase_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Suggested refill date</label>
              <input
                type="date"
                value={form.suggested_refill_date}
                onChange={(e) => setForm((f) => ({ ...f, suggested_refill_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {alertsError ? (
          <ErrorState message="Unable to load refill alerts." onRetry={loadAll} />
        ) : (
          <AlertPanel
            alerts={alerts}
            onReorder={handleReorder}
            onComplete={handleComplete}
            onDelete={handleDelete}
          />
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-mint-600" />
          <h2 className="font-display font-semibold text-gray-900">Notifications</h2>
          {notifications.filter((n) => !(n.read ?? n.is_read)).length > 0 && (
            <span className="ml-1 bg-mint-100 text-mint-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {notifications.filter((n) => !(n.read ?? n.is_read)).length} new
            </span>
          )}
        </div>
        {notificationsError ? (
          <ErrorState message="Unable to load notifications." onRetry={loadAll} />
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-400">No new notifications.</p>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${
                    n.read ?? n.is_read ? 'border-gray-100 bg-white' : 'border-mint-200 bg-mint-50'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      n.read ?? n.is_read ? 'bg-gray-300' : 'bg-mint-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm text-gray-800">
                      {n.title ? `${n.title}: ${n.message}` : n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={notifPage} limit={NOTIF_LIMIT} total={notifTotal} onPageChange={setNotifPage} />
          </>
        )}
      </section>
    </div>
  )
}
