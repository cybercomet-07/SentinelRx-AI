import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { adminService } from '../../services/adminService'
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

export default function OrdersMap() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService
      .getOrdersForMap()
      .then((r) => setOrders(r.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const defaultCenter = [19.0760, 72.8777]
  const hasOrders = orders.length > 0

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft h-[400px] flex items-center justify-center text-gray-400">
        Loading map…
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-display font-semibold text-gray-900">Delivery Map</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {hasOrders ? `${orders.length} order(s) with delivery location` : 'No orders with delivery location yet'}
        </p>
      </div>
      <div className="h-[400px]">
        <MapContainer
          center={hasOrders ? [orders[0].delivery_latitude, orders[0].delivery_longitude] : defaultCenter}
          zoom={hasOrders ? 12 : 4}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasOrders && <FitBounds orders={orders} />}
          {orders.map((o) => (
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
