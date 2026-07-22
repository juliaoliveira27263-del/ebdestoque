import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import StaffLayout from './layouts/StaffLayout'
import Dashboard from './pages/admin/Dashboard'
import Industries from './pages/admin/Industries'
import Products from './pages/admin/Products'
import Requests from './pages/admin/Requests'
import Movements from './pages/admin/Movements'
import Users from './pages/admin/Users'
import StaffIndustries from './pages/staff/StaffIndustries'
import StaffIndustryProducts from './pages/staff/StaffIndustryProducts'
import StaffMyRequests from './pages/staff/StaffMyRequests'

export default function App() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-3 border-ebd-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session || !profile) {
    return <Login />
  }

  const isAdmin = profile.role === 'admin'

  return (
    <Routes>
      {isAdmin ? (
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="industries" element={<Industries />} />
          <Route path="requests" element={<Requests />} />
          <Route path="movements" element={<Movements />} />
          <Route path="users" element={<Users />} />
        </Route>
      ) : (
        <Route path="/" element={<StaffLayout />}>
          <Route index element={<StaffIndustries />} />
          <Route path="industria/:industryId" element={<StaffIndustryProducts />} />
          <Route path="minhas-solicitacoes" element={<StaffMyRequests />} />
        </Route>
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
