import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { adminService } from '../../services/adminService'
import { orderService } from '../../services/orderService'
import Loader from '../../components/ui/Loader'
import StatusBadge from '../../components/orders/StatusBadge'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function FitBounds({ orders }) {
  const map = useMap()
  useEffect(() => {
    if (!orders?.length) return
    const bounds = L.latLngBounds(orders.map((o) => [o.delivery_latitude, o.delivery_longitude]))
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
  }, [map, orders])
  return null
}

function MapSection({ ordersWithLocation }) {
  const defaultCenter = [19.0760, 72.8777]
  const hasOrders = ordersWithLocation.length > 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-display font-semibold text-gray-900">Delivery Map</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {hasOrders
            ? `${ordersWithLocation.length} order(s) with live location`
            : 'No orders with live location yet. Pins appear when users share their location.'}
        </p>
      </div>
      <div className="h-[450px]">
        <MapContainer
          center={hasOrders ? [ordersWithLocation[0].delivery_latitude, ordersWithLocation[0].delivery_longitude] : defaultCenter}
          zoom={hasOrders ? 12 : 4}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasOrders && <FitBounds orders={ordersWithLocation} />}
          {ordersWithLocation.map((o) => (
            <Marker key={o.id} position={[o.delivery_latitude, o.delivery_longitude]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Order #{String(o.id).slice(0, 8)}</p>
                  <p>{o.user_name || 'Customer'}</p>
                  <p>₹{o.total_amount} · {o.status}</p>
                  {o.delivery_address && <p className="text-gray-600 mt-1">{o.delivery_address}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default function AdminMapPage() {
  const [ordersWithLocation, setOrdersWithLocation] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminService.getOrdersForMap(),
      orderService.getAll({ limit: 100 }),
    ])
      .then(([mapRes, ordersRes]) => {
        setOrdersWithLocation(mapRes.data ?? [])
        const items = ordersRes.data?.items ?? ordersRes.data ?? []
        setAllOrders(Array.isArray(items) ? items : [])
      })
      .catch(() => {
        setOrdersWithLocation([])
        setAllOrders([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader center />

  return (
    <div className="p-6 space-y-6">
      <MapSection ordersWithLocation={ordersWithLocation} />

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-display font-semibold text-gray-900">Orders & Delivery Addresses</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Delivery address selected by user (live location or manual). Scroll down to see the list.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order ID', 'User', 'Delivery Address', 'Source', 'Total', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                allOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{String(o.id).slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-gray-800">
                      <span className="font-medium">
                        {(o.user_name || o.userName || o.user?.name || '').trim() || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[280px]" title={o.delivery_address || o.deliveryAddress || ''}>
                      <span className="line-clamp-2">
                        {((o.delivery_address || o.deliveryAddress) || '—').slice(0, 80)}
                        {((o.delivery_address || o.deliveryAddress || '').length > 80 ? '…' : '')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        (o.address_source || o.addressSource) === 'live_location'
                          ? 'bg-mint-100 text-mint-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {(o.address_source || o.addressSource) === 'live_location' ? 'Live location' : (o.delivery_address || o.deliveryAddress) ? 'Manual' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-mint-700">
                      ₹{o.total_amount ?? o.total ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
