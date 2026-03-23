import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const from = location.state?.from?.pathname ?? null

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: err } = await signIn(email.trim(), password)

    if (err) {
      setError(err.message ?? 'Invalid email or password.')
      setLoading(false)
      return
    }

    // fetch profile to get role for redirect
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const dest = {
      generator:     '/dashboard',
      collector:     '/collector',
      admin:         '/admin',
      platform_admin:'/admin',
    }[prof?.role] ?? '/'

    navigate(from ?? dest, { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-forest rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-semibold text-base text-brand-bark tracking-wide">UoP IWMP</span>
            <span className="text-[10px] text-text-muted tracking-wider">Integrated Waste Management</span>
          </div>
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl p-8 shadow-sm">
          <h1 className="font-display text-3xl text-brand-bark mb-1">Welcome back</h1>
          <p className="text-text-muted text-sm mb-8">Sign in to the UoP Integrated Waste Management Platform.</p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@university.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest text-sm transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-text-primary">Password</label>
              </div>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-surface-border bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-forest text-white font-medium rounded-xl hover:bg-brand-moss disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Are you a waste collector?{' '}
            <Link to="/register/collector" className="text-brand-forest font-medium hover:underline">
              Register your company
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-text-muted">
            Generator?{' '}
            <span className="text-text-muted">You need an invite link from your institution admin.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
