import { X, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCart } from '../../hooks/useCart'
import { useAuthContext } from '../../context/AuthContext'
import CartItem from './CartItem'
import OrderSummary from './OrderSummary'
import DeliveryAddressForm from '../orders/DeliveryAddressForm'
import PaymentMethodStep from '../orders/PaymentMethodStep'
import UPIQrModal from '../orders/UPIQrModal'
import { orderService } from '../../services/orderService'
import toast from 'react-hot-toast'
import { useState } from 'react'

const DELIVERY_FEE = 30

export default function CartDrawer() {
  const { t } = useTranslation()
  const { user } = useAuthContext()
  const { open, setOpen, items, clearCart, total } = useCart()
  const [placing, setPlacing] = useState(false)
  const [showAddress, setShowAddress] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [pendingDelivery, setPendingDelivery] = useState(null)

  const grandTotal = (total || 0) + DELIVERY_FEE

  const handlePlaceOrder = () => {
    if (!items.length) return
    if (!user) {
      toast.error(t('common.pleaseLoginToPlaceOrder'))
      return
    }
    setShowAddress(true)
  }

  const handleAddressSubmit = (delivery) => {
    setPendingDelivery(delivery)
    setShowAddress(false)
    setShowPayment(true)
  }

  const handlePaymentSubmit = async () => {
    if (paymentMethod === 'upi') {
      setShowUpiModal(true)
      return
    }
    await doCreateOrder(pendingDelivery, 'cod')
  }

  const handleUpiPaid = async (receiptUrl) => {
    setShowUpiModal(false)
    await doCreateOrder(pendingDelivery, 'upi', receiptUrl)
  }

  const doCreateOrder = async (delivery, pm, receiptUrl = null) => {
    setPlacing(true)
    try {
      await orderService.createFromCart(delivery, pm, receiptUrl)
      toast.success(t('common.orderPlacedSuccess'))
      clearCart()
      setShowPayment(false)
      setPendingDelivery(null)
      setPaymentMethod('cod')
      setOpen(false)
    } catch {
      toast.error(t('common.failedToPlaceOrder'))
    } finally {
      setPlacing(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />}

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-float z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-mint-600" />
            <h2 className="font-display font-semibold">{t('common.yourCart')}</h2>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart size={40} className="mb-3 opacity-30" />
              <p>{t('common.yourCartEmpty')}</p>
            </div>
          ) : (
            items.map((item) => <CartItem key={item.id} item={item} />)
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 space-y-4">
            {showAddress ? (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('common.deliveryAddress')}</h3>
                <DeliveryAddressForm
                  onSubmit={handleAddressSubmit}
                  onCancel={() => setShowAddress(false)}
                  loading={placing}
                />
              </div>
            ) : showPayment ? (
              <div className="space-y-4">
                <PaymentMethodStep value={paymentMethod} onChange={setPaymentMethod} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowPayment(false); setPendingDelivery(null) }}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={placing}
                    className="flex-1 py-2.5 bg-mint-500 hover:bg-mint-600 disabled:opacity-60 text-white rounded-xl font-semibold text-sm"
                  >
                    {placing ? t('common.loading') : t('common.placeOrder')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <OrderSummary />
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full bg-mint-500 hover:bg-mint-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  {t('common.placeOrder')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <UPIQrModal
        open={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        totalAmount={grandTotal}
        onPaid={handleUpiPaid}
      />
    </>
  )
}
