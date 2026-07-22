import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Package, Building2, Boxes, FileText, ArrowLeftRight, Users, LogOut, Menu, X, ClipboardList } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Package, end: true },
  { to: '/products', label: 'Produtos', icon: Boxes },
  { to: '/industries', label: 'Indústrias', icon: Building2 },
  { to: '/requests', label: 'Solicitações', icon: FileText },
  { to: '/movements', label: 'Movimentações', icon: ArrowLeftRight },
  { to: '/users', label: 'Usuários', icon: Users },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 flex items-center gap-3 border-b border-neutral-200">
          <div className="w-10 h-10 rounded-xl bg-ebd-700 flex items-center justify-center shadow-lg shadow-ebd-700/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-neutral-900">EBD Distribuidora</h1>
            <p className="text-xs text-neutral-400">Administração</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-ebd-700 text-white shadow-lg shadow-ebd-700/20' : 'text-neutral-600 hover:bg-neutral-100'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-ebd-100 flex items-center justify-center text-sm font-semibold text-ebd-700">
              {profile?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-neutral-900">{profile?.name}</p>
              <p className="text-xs text-neutral-400 capitalize">{profile?.role}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:bg-error-50 hover:text-error-700 transition-all">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-neutral-100"><Menu className="w-5 h-5" /></button>
          <span className="font-semibold text-neutral-800">EBD Admin</span>
          <div className="w-9" />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
