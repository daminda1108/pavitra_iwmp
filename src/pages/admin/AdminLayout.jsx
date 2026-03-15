import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, List, BarChart3, FlaskConical, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/admin',             label: 'Overview',   icon: LayoutDashboard, end: true },
  { to: '/admin/collectors',  label: 'Collectors', icon: Users },
  { to: '/admin/generators',  label: 'Generators', icon: Building2 },
  { to: '/admin/listings',    label: 'Listings',   icon: List },
  { to: '/admin/materials',   label: 'Materials',  icon: FlaskConical },
  { to: '/admin/reports',     label: 'Reports',    icon: BarChart3 },
]

function NavItems({ onClose }) {
  return (
    <nav className="space-y-1">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to} to={to} end={end}
          onClick={onClose}
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
  )
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brand-cream">

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-brand-moss text-white px-4 py-3 sticky top-0 z-40">
        <span className="font-display font-semibold text-base tracking-wide">Pavitra Admin</span>
        <button onClick={() => setOpen(o => !o)} className="p-1">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <div className="md:hidden bg-brand-moss text-white px-4 pb-4 sticky top-12 z-30 shadow-lg">
          <NavItems onClose={() => setOpen(false)} />
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col w-56 bg-brand-moss text-white flex-shrink-0 p-4 min-h-screen sticky top-0">
          <div className="font-display font-semibold text-lg mb-6 px-2 tracking-wide">Pavitra Admin</div>
          <NavItems onClose={null} />
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
