import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import AppRouter from './app/router'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
