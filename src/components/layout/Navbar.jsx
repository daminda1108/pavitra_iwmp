import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, LayoutDashboard, Menu, X, BookOpen, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const dashboardPath = {
    generator: '/dashboard',
    collector: '/collector',
    admin: '/admin',
    platform_admin: '/admin',
  }[profile?.role] ?? '/'

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 bg-brand-forest rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-semibold text-base text-brand-bark tracking-wide">UoP IWMP</span>
              <span className="text-[10px] text-text-muted tracking-wider hidden sm:block">Integrated Waste Management</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/board" className="text-sm text-text-muted hover:text-brand-forest transition-colors">Browse Listings</Link>
            <Link to="/wanted" className="text-sm text-text-muted hover:text-brand-forest transition-colors">Buyers Seeking</Link>
            <Link to="/guidelines" className="flex items-center gap-1 text-sm text-text-muted hover:text-brand-forest transition-colors">
              <BookOpen className="w-3.5 h-3.5" /> Guidelines
            </Link>
            <Link to="/compliance" className="flex items-center gap-1 text-sm text-text-muted hover:text-brand-forest transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" /> Compliance
            </Link>
          </div>

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to={dashboardPath}
                  className="flex items-center gap-1.5 text-sm text-brand-forest hover:text-brand-moss transition-colors">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <button onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-red-600 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-text-muted hover:text-text-primary transition-colors">Sign In</Link>
                <Link to="/dashboard/new"
                  className="text-sm bg-brand-forest text-white px-4 py-2 rounded-lg hover:bg-brand-moss transition-colors">
                  Post Waste
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-border bg-white px-4 py-4 space-y-1">
          <Link to="/board" onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm text-text-muted hover:text-brand-forest">Browse Listings</Link>
          <Link to="/wanted" onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm text-text-muted hover:text-brand-forest">Buyers Seeking</Link>
          <Link to="/guidelines" onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm text-text-muted hover:text-brand-forest">Guidelines</Link>
          <Link to="/compliance" onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm text-text-muted hover:text-brand-forest">Compliance</Link>
          <div className="pt-2 border-t border-surface-border mt-2">
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm text-brand-forest font-medium">Dashboard</Link>
                <button onClick={() => { handleSignOut(); setMobileOpen(false) }}
                  className="block py-2 text-sm text-red-600 w-full text-left">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm text-text-muted">Sign In</Link>
                <Link to="/dashboard/new" onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm text-brand-forest font-medium">Post Waste</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
