import { useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'

export default function DeliveryAddressForm({ onSubmit, onCancel, loading }) {
  const [mode, setMode] = useState(null) // 'live' | 'manual'
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [error, setError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)

  const handleUseLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setMode('live')
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setAddress(`Location: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`)
        setGettingLocation(false)
      },
      (err) => {
        setError(err.message || 'Could not get your location. Please try manual address.')
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!address.trim()) {
      setError('Please provide your delivery address.')
      return
    }
    onSubmit({
      delivery_address: address.trim(),
      delivery_latitude: lat ?? undefined,
      delivery_longitude: lng ?? undefined,
      address_source: mode === 'live' ? 'live_location' : 'manual',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">Where should we deliver your order?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={gettingLocation}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-mint-200 bg-mint-50 text-mint-700 hover:bg-mint-100 font-medium text-sm transition-colors disabled:opacity-60"
        >
          <Navigation size={18} />
          {gettingLocation ? 'Getting location…' : 'Use my location'}
        </button>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Or enter address manually</label>
        <textarea
          value={address}
          onChange={(e) => { setAddress(e.target.value); setMode('manual'); setLat(null); setLng(null) }}
          placeholder="Street, city, pincode..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-300 resize-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-mint-500 hover:bg-mint-600 disabled:opacity-60 text-white font-medium text-sm transition-colors"
        >
          <MapPin size={16} />
          {loading ? 'Placing…' : 'Place Order'}
        </button>
      </div>
    </form>
  )
}
