import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Package, Building2, Boxes, FileText, ArrowLeftRight, Users, LogOut, Menu, X, ChevronLeft } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Package, end: true },
  { to: '/products', label: 'Produtos', icon: Boxes },
  { to: '/industries', label: 'Industrias', icon: Building2 },
  { to: '/requests', label: 'Solicitacoes', icon: FileText },
  { to: '/movements', label: 'Movimentacoes', icon: ArrowLeftRight },
  { to: '/users', label: 'Usuarios', icon: Users },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const currentLabel = navItems.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))?.label ?? 'Dashboard'

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 flex items-center gap-3 border-b border-neutral-200">
          <div className="w-10 h-10 rounded-xl gradient-ebd flex items-center justify-center shadow-ebd">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-neutral-900">EBD Distribuidora</h1>
            <p className="text-xs text-neutral-400">Administracao</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-400" /></button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'gradient-ebd text-white shadow-ebd' : 'text-neutral-600 hover:bg-neutral-100'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-ebd-100 flex items-center justify-center text-sm font-semibold text-ebd-700">{profile?.name?.charAt(0).toUpperCase() ?? '?'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-neutral-900">{profile?.name}</p>
              <p className="text-xs text-neutral-400 capitalize">{profile?.role}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:bg-error-50 hover:text-error-700 transition-all">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-neutral-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"><Menu className="w-5 h-5" /></button>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">{currentLabel}</h2>
              <p className="text-xs text-neutral-400 hidden sm:block">Painel de Administracao EBD</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-ebd-100 flex items-center justify-center text-sm font-semibold text-ebd-700">{profile?.name?.charAt(0).toUpperCase() ?? '?'}</div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
