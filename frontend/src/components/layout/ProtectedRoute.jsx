import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../ui/Loader'

const ROLE_HOME = {
  user:           '/user/quick-start',
  admin:          '/admin/dashboard',
  doctor:         '/doctor/dashboard',
  hospital_admin: '/hospital/dashboard',
  ngo:            '/ngo/dashboard',
}

export default function ProtectedRoute({ children, allowedRoles }) {
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

  if (allowedRoles && !allowedRoles.includes(user.role?.toLowerCase())) {
    const home = ROLE_HOME[user.role?.toLowerCase()] || '/user/quick-start'
    return <Navigate to={home} replace />
  }

  return children
}
