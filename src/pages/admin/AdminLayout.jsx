import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, List, BarChart3 } from 'lucide-react'

const navItems = [
  { to: '/admin',           label: 'Overview',   icon: LayoutDashboard, end: true },
  { to: '/admin/collectors', label: 'Collectors', icon: Users },
  { to: '/admin/generators', label: 'Generators', icon: Building2 },
  { to: '/admin/listings',   label: 'Listings',   icon: List },
  { to: '/admin/reports',    label: 'Reports',    icon: BarChart3 },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-brand-cream flex">
      <aside className="w-56 bg-brand-moss text-white flex-shrink-0 p-4">
        <div className="font-display font-semibold text-lg mb-6 px-2">Pavitra Admin</div>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-brand-forest text-white' : 'text-white/70 hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto"><Outlet /></main>
    </div>
  )
}
