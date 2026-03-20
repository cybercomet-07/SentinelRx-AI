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
import FindDoctorPage from '../pages/user/FindDoctorPage'
import BookAppointmentPage from '../pages/user/BookAppointmentPage'
import MyAppointmentsPage from '../pages/user/MyAppointmentsPage'
import GovtSchemesPage from '../pages/shared/GovtSchemesPage'

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
import AppointmentsPage from '../pages/doctor/AppointmentsPage'
import DoctorPatientsPage from '../pages/doctor/PatientsPage'
import DoctorProfilePage from '../pages/doctor/DoctorProfilePage'
import DoctorPrescriptionsPage from '../pages/doctor/DoctorPrescriptionsPage'
import DoctorNotificationsPage from '../pages/doctor/DoctorNotificationsPage'

// Hospital Admin
import HospitalLayout from '../pages/hospital/HospitalLayout'
import HospitalDashboard from '../pages/hospital/HospitalDashboard'
import BedsPage from '../pages/hospital/BedsPage'
import AdmissionsPage from '../pages/hospital/AdmissionsPage'
import HospitalInventoryPage from '../pages/hospital/HospitalInventoryPage'

// NGO
import NGOLayout from '../pages/ngo/NGOLayout'
import NGODashboard from '../pages/ngo/NGODashboard'
import BeneficiariesPage from '../pages/ngo/BeneficiariesPage'
import BloodCampsPage from '../pages/ngo/BloodCampsPage'
import DonationsPage from '../pages/ngo/DonationsPage'

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
        <Route path="find-doctor" element={<FindDoctorPage />} />
        <Route path="book-appointment/:doctorId" element={<BookAppointmentPage />} />
        <Route path="appointments" element={<MyAppointmentsPage />} />
        <Route path="govt-schemes" element={<GovtSchemesPage />} />
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
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
        <Route path="govt-schemes" element={<GovtSchemesPage />} />
        <Route path="notifications" element={<DoctorNotificationsPage />} />
        <Route path="profile" element={<DoctorProfilePage />} />
      </Route>

      {/* Hospital Admin Dashboard */}
      <Route path="/hospital" element={<ProtectedRoute allowedRoles={['hospital_admin']}><HospitalLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/hospital/dashboard" replace />} />
        <Route path="dashboard" element={<HospitalDashboard />} />
        <Route path="patients" element={<AdmissionsPage />} />
        <Route path="beds" element={<BedsPage />} />
        <Route path="inventory" element={<HospitalInventoryPage />} />
        <Route path="billing" element={<ComingSoon title="Billing" phase="Phase 4" />} />
        <Route path="notifications" element={<DoctorNotificationsPage />} />
        <Route path="profile" element={<ComingSoon title="Hospital Settings" phase="Phase 4" />} />
      </Route>

      {/* NGO Dashboard */}
      <Route path="/ngo" element={<ProtectedRoute allowedRoles={['ngo']}><NGOLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/ngo/dashboard" replace />} />
        <Route path="dashboard" element={<NGODashboard />} />
        <Route path="beneficiaries" element={<BeneficiariesPage />} />
        <Route path="blood-camps" element={<BloodCampsPage />} />
        <Route path="donations" element={<DonationsPage />} />
        <Route path="notifications" element={<DoctorNotificationsPage />} />
        <Route path="profile" element={<ComingSoon title="NGO Profile" phase="Phase 5" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
