import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Building2, ClipboardList, LogOut, Package, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Solicitar', icon: Building2, end: true },
  { to: '/minhas-solicitacoes', label: 'Minhas Solicitacoes', icon: ClipboardList },
]

export default function StaffLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => { await signOut(); navigate('/') }
  const currentLabel = navItems.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))?.label ?? 'Solicitar'

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-ebd flex items-center justify-center shadow-ebd">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-neutral-900">EBD Distribuidora</h1>
            <p className="text-xs text-neutral-400">{currentLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-ebd-100 flex items-center justify-center text-sm font-semibold text-ebd-700">{profile?.name?.charAt(0).toUpperCase() ?? '?'}</div>
            <span className="text-sm font-medium hidden sm:block text-neutral-700">{profile?.name}</span>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors" title="Sair">
            <LogOut className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-neutral-200 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-ebd-50 text-ebd-700' : 'text-neutral-600 hover:bg-neutral-100'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex z-30 shadow-elevated">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${isActive ? 'text-ebd-700' : 'text-neutral-400'}`}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
