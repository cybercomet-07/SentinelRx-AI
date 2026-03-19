import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
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
  const { t } = useTranslation()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
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

  const fetchNotifications = async (page = 1, markUnreadAsRead = false) => {
    try {
      setNotificationsError(false)
      const res = await notificationService.getAll({ page, limit: NOTIF_LIMIT })
      const nData = res.data?.items ?? res.data ?? []
      const list = Array.isArray(nData) ? nData.map(n => ({ ...n, read: n.is_read ?? n.read })) : []
      setNotifications(list)
      setNotifTotal(res.data?.total ?? 0)
      // Mark all unread notifications as read when user opens the page
      if (markUnreadAsRead) {
        const unread = list.filter((n) => !(n.read ?? n.is_read))
        await Promise.all(unread.map((n) => notificationService.markRead(n.id).catch(() => {})))
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        window.dispatchEvent(new CustomEvent('notifications-updated'))
      }
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
    const promises = [fetchNotifications(notifPage, true)]
    if (!isAdmin) {
      promises.push(fetchAlerts(), fetchMedicines())
    }
    Promise.all(promises).finally(() => setLoading(false))
  }

  const notifPageInitialized = useRef(false)
  useEffect(() => { loadAll() }, [isAdmin])

  useEffect(() => {
    if (!notifPageInitialized.current) {
      notifPageInitialized.current = true
      return
    }
    fetchNotifications(notifPage, true)
  }, [notifPage])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.medicine_id || !form.last_purchase_date || !form.suggested_refill_date) {
      toast.error(t('common.pleaseFillAllFields'))
      return
    }
    if (new Date(form.suggested_refill_date) < new Date(form.last_purchase_date)) {
      toast.error(t('common.suggestedRefillAfterPurchase'))
      return
    }
    setCreating(true)
    try {
      await refillAlertService.create(form)
      toast.success(t('common.refillAlertCreated'))
      setForm({ medicine_id: '', last_purchase_date: '', suggested_refill_date: '' })
      setShowCreateForm(false)
      await fetchAlerts()
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? err.response?.data?.detail ?? t('common.failedToCreateAlert'))
    } finally {
      setCreating(false)
    }
  }

  const handleComplete = async (id) => {
    try {
      await refillAlertService.complete(id)
      toast.success(t('common.markedAsComplete'))
      await fetchAlerts()
    } catch {
      toast.error(t('common.failedToMarkComplete'))
    }
  }

  const handleDelete = async (id) => {
    try {
      await refillAlertService.delete(id)
      toast.success(t('common.alertRemoved'))
      await fetchAlerts()
    } catch {
      toast.error(t('common.failedToDelete'))
    }
  }

  const handleReorder = (alert) => {
    toast.success(t('common.reorderPlaced', { name: alert.medicine_name }))
  }

  if (loading) return <Loader center />

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-2xl mx-auto">
      {!isAdmin && (
        <section className="card-lift bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-orange-500" />
              <h2 className="font-display font-semibold text-gray-900">{t('quickStart.refillAlerts')}</h2>
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
              {showCreateForm ? t('common.cancel') : t('common.create')}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreate} className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('common.medicine')}</label>
                <select
                  value={form.medicine_id}
                  onChange={(e) => setForm((f) => ({ ...f, medicine_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                >
                  <option value="">{t('common.selectMedicine')}</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('common.lastPurchaseDate')}</label>
                <input
                  type="date"
                  value={form.last_purchase_date}
                  onChange={(e) => setForm((f) => ({ ...f, last_purchase_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('common.suggestedRefillDate')}</label>
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
                  {creating ? t('common.creating') : t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          )}

          {alertsError ? (
            <ErrorState message={t('common.unableToLoadRefillAlerts')} onRetry={loadAll} />
          ) : (
            <AlertPanel
              alerts={alerts}
              onReorder={handleReorder}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />
          )}
        </section>
      )}

      <section className="card-lift bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-mint-600" />
          <h2 className="font-display font-semibold text-gray-900">{t('sidebar.notifications')}</h2>
          {notifications.filter((n) => !(n.read ?? n.is_read)).length > 0 && (
            <span className="ml-1 bg-mint-100 text-mint-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {t('common.newCount', { count: notifications.filter((n) => !(n.read ?? n.is_read)).length })}
            </span>
          )}
        </div>
        {notificationsError ? (
          <ErrorState message={t('common.unableToLoadNotifications')} onRetry={loadAll} />
        ) : (() => {
          // In user mode, hide admin-only notification types (SYSTEM=new order received, LOW_STOCK, EXPIRING_MEDICINE)
          const adminOnlyTypes = ['SYSTEM', 'LOW_STOCK', 'EXPIRING_MEDICINE']
          const visibleNotifs = isAdmin ? notifications : notifications.filter(n => !adminOnlyTypes.includes(n.typ))
          return visibleNotifs.length === 0 ? (
          <p className="text-sm text-gray-400">{t('common.noNewNotifications')}</p>
        ) : (
          <>
            <div className="space-y-3">
              {visibleNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border card-lift ${
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
        )})()}
      </section>
    </div>
  )
}
