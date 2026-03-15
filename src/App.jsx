import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Landing             from './pages/Landing'
import Board               from './pages/Board'
import WantedBoard         from './pages/WantedBoard'
import ListingDetailPage   from './pages/ListingDetailPage'
import Login               from './pages/Login'
import Register            from './pages/Register'
import GeneratorDashboard  from './pages/GeneratorDashboard'
import NewListing          from './pages/NewListing'
import EditListing         from './pages/EditListing'
import CollectorDashboard  from './pages/CollectorDashboard'
import CollectorProfilePage from './pages/CollectorProfilePage'
import NotFound            from './pages/NotFound'

import AdminLayout    from './pages/admin/AdminLayout'
import AdminOverview  from './pages/admin/AdminOverview'
import AdminCollectors from './pages/admin/AdminCollectors'
import AdminGenerators from './pages/admin/AdminGenerators'
import AdminListings  from './pages/admin/AdminListings'
import AdminReports   from './pages/admin/AdminReports'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"           element={<Landing />} />
          <Route path="/board"      element={<Board />} />
          <Route path="/board/:id"  element={<ListingDetailPage />} />
          <Route path="/wanted"     element={<WantedBoard />} />
          <Route path="/login"                element={<Login />} />
          <Route path="/register/collector"   element={<Register />} />
          <Route path="/register/generator"   element={<Register />} />
          <Route path="/collector/:id"        element={<CollectorProfilePage />} />

          {/* Generator */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['generator']}>
              <GeneratorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/new" element={
            <ProtectedRoute allowedRoles={['generator']}>
              <NewListing />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/listing/:id/edit" element={
            <ProtectedRoute allowedRoles={['generator']}>
              <EditListing />
            </ProtectedRoute>
          } />

          {/* Collector */}
          <Route path="/collector" element={
            <ProtectedRoute allowedRoles={['collector']}>
              <CollectorDashboard />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'platform_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index          element={<AdminOverview />} />
            <Route path="collectors" element={<AdminCollectors />} />
            <Route path="generators" element={<AdminGenerators />} />
            <Route path="listings"   element={<AdminListings />} />
            <Route path="reports"    element={<AdminReports />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
