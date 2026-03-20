import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/layout/ProtectedRoute'

import Landing from '../pages/Landing'
import Login from '../pages/Login'
import ComingSoon from '../pages/ComingSoon'

// Patient (User)
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

// Super Admin
import AdminLayout from '../pages/admin/AdminLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminMedicines from '../pages/admin/AdminMedicines'
import AdminOrders from '../pages/admin/AdminOrders'
import AdminMapPage from '../pages/admin/AdminMapPage'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminContactPage from '../pages/admin/AdminContactPage'
import AdminPrescriptionsPage from '../pages/admin/AdminPrescriptionsPage'

// Doctor
import DoctorLayout from '../pages/doctor/DoctorLayout'
import DoctorDashboard from '../pages/doctor/DoctorDashboard'

// Hospital Admin
import HospitalLayout from '../pages/hospital/HospitalLayout'
import HospitalDashboard from '../pages/hospital/HospitalDashboard'

// NGO
import NGOLayout from '../pages/ngo/NGOLayout'
import NGODashboard from '../pages/ngo/NGODashboard'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Patient Dashboard */}
      <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><UserLayout /></ProtectedRoute>}>
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

      {/* Super Admin Dashboard */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
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

      {/* Doctor Dashboard */}
      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="appointments" element={<ComingSoon title="Appointments" phase="Phase 1" />} />
        <Route path="patients" element={<ComingSoon title="My Patients" phase="Phase 1" />} />
        <Route path="prescriptions" element={<ComingSoon title="Prescriptions" phase="Phase 1" />} />
        <Route path="notifications" element={<ComingSoon title="Notifications" phase="Phase 1" />} />
        <Route path="profile" element={<ComingSoon title="Doctor Profile" phase="Phase 1" />} />
      </Route>

      {/* Hospital Admin Dashboard */}
      <Route path="/hospital" element={<ProtectedRoute allowedRoles={['hospital_admin']}><HospitalLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/hospital/dashboard" replace />} />
        <Route path="dashboard" element={<HospitalDashboard />} />
        <Route path="patients" element={<ComingSoon title="Patient Management" phase="Phase 4" />} />
        <Route path="beds" element={<ComingSoon title="Bed Management" phase="Phase 4" />} />
        <Route path="inventory" element={<ComingSoon title="Medicine Inventory" phase="Phase 4" />} />
        <Route path="billing" element={<ComingSoon title="Billing" phase="Phase 4" />} />
        <Route path="notifications" element={<ComingSoon title="Notifications" phase="Phase 4" />} />
        <Route path="profile" element={<ComingSoon title="Hospital Settings" phase="Phase 4" />} />
      </Route>

      {/* NGO Dashboard */}
      <Route path="/ngo" element={<ProtectedRoute allowedRoles={['ngo']}><NGOLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/ngo/dashboard" replace />} />
        <Route path="dashboard" element={<NGODashboard />} />
        <Route path="beneficiaries" element={<ComingSoon title="Beneficiaries" phase="Phase 5" />} />
        <Route path="blood-camps" element={<ComingSoon title="Blood Camps" phase="Phase 5" />} />
        <Route path="donations" element={<ComingSoon title="Donation Drives" phase="Phase 5" />} />
        <Route path="notifications" element={<ComingSoon title="Notifications" phase="Phase 5" />} />
        <Route path="profile" element={<ComingSoon title="NGO Profile" phase="Phase 5" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
