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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-ebd flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div className="w-6 h-6 border-2 border-ebd-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!session || !profile) return <Login />

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
