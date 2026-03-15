import { Link, useNavigate } from 'react-router-dom'
import { Leaf, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-forest rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-semibold text-xl text-brand-bark">Pavitra</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/board" className="text-sm text-text-muted hover:text-brand-forest transition-colors">
              Browse Listings
            </Link>
            <Link to="/wanted" className="text-sm text-text-muted hover:text-brand-forest transition-colors">
              Buyers Seeking
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="flex items-center gap-1.5 text-sm text-brand-forest hover:text-brand-moss transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/dashboard/new"
                  className="text-sm bg-brand-forest text-white px-4 py-2 rounded-lg hover:bg-brand-moss transition-colors"
                >
                  Post Waste
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
