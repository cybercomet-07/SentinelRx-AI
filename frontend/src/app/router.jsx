import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/layout/ProtectedRoute'

import Landing from '../pages/Landing'
import Login from '../pages/Login'

import UserLayout from '../pages/user/UserLayout'
import Dashboard from '../pages/user/Dashboard'
import QuickStartPage from '../pages/user/QuickStartPage'
import ChatPage from '../pages/user/ChatPage'
import ManualOrderPage from '../pages/user/ManualOrderPage'
import OrderHistoryPage from '../pages/user/OrderHistoryPage'
import NotificationsPage from '../pages/user/NotificationsPage'
import PrescriptionsPage from '../pages/user/PrescriptionsPage'
import ProfilePage from '../pages/user/ProfilePage'
import ContactUsPage from '../pages/user/ContactUsPage'

import AdminLayout from '../pages/admin/AdminLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminMedicines from '../pages/admin/AdminMedicines'
import AdminOrders from '../pages/admin/AdminOrders'
import AdminMapPage from '../pages/admin/AdminMapPage'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminContactPage from '../pages/admin/AdminContactPage'
import AdminPrescriptionsPage from '../pages/admin/AdminPrescriptionsPage'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route path="/user" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/user/quick-start" replace />} />
        <Route path="quick-start" element={<QuickStartPage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="medicines" element={<ManualOrderPage />} />
        <Route path="orders" element={<OrderHistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="contact" element={<ContactUsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="medicines" element={<AdminMedicines />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="map" element={<AdminMapPage />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="prescriptions" element={<AdminPrescriptionsPage />} />
        <Route path="contact" element={<AdminContactPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
