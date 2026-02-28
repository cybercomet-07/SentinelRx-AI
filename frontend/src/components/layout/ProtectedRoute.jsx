import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../ui/Loader'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-warm-50">
        <Loader center size="lg" />
        <p className="mt-4 text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/user/chat" replace />

  return children
}
