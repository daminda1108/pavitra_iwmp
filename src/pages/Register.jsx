import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Leaf, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * Generator registration — invite-gated.
 * URL: /register/generator?token=<invite_id>
 *
 * Collector registration is at /register/collector (separate page, separate flow).
 * This page handles both paths; the route in App.jsx currently maps
 * /register/collector here, so we show a placeholder for collectors.
 */
export default function Register() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  const token = searchParams.get('token')
  const isCollectorPath = window.location.pathname === '/register/collector'

  const [invite,   setInvite]   = useState(null)
  const [checking, setChecking] = useState(!!token)
  const [tokenErr, setTokenErr] = useState(null)

  const [fullName,  setFullName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(false)

  useEffect(() => {
    if (!token) return
    async function validateToken() {
      const { data, error } = await supabase
        .from('generator_invites')
        .select('id, email, institution_id, scoped_to_faculty, scoped_to_department, institutions(name, short_name), used, expires_at')
        .eq('id', token)
        .single()

      if (error || !data) {
        setTokenErr('Invalid invite link. Please ask your admin for a new one.')
        setChecking(false)
        return
      }
      if (data.used) {
        setTokenErr('This invite link has already been used.')
        setChecking(false)
        return
      }
      if (new Date(data.expires_at) < new Date()) {
        setTokenErr('This invite link has expired. Please ask your admin for a new one.')
        setChecking(false)
        return
      }
      setInvite(data)
      setChecking(false)
    }
    validateToken()
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    // 1. Create auth user
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email:    invite.email,
      password,
      options: { data: { full_name: fullName.trim() } }
    })

    if (signUpErr) {
      setError(signUpErr.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('Registration failed. Please try again.')
      setLoading(false)
      return
    }

    // 2. Insert profile
    const { error: profileErr } = await supabase.from('profiles').insert({
      id:        userId,
      role:      'generator',
      full_name: fullName.trim(),
      phone:     phone.trim() || null,
    })

    if (profileErr) {
      setError(profileErr.message)
      setLoading(false)
      return
    }

    // 3. Insert generator record
    const { error: genErr } = await supabase.from('generators').insert({
      id:             userId,
      institution_id: invite.institution_id,
      faculty:        invite.scoped_to_faculty   ?? '',
      department:     invite.scoped_to_department ?? '',
      is_authorized:  true,   // coordinator-sent invites auto-authorize
    })

    if (genErr) {
      setError(genErr.message)
      setLoading(false)
      return
    }

    // 4. Mark invite as used
    await supabase.from('generator_invites')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', token)

    setSuccess(true)
    setLoading(false)

    // Auto-navigate after brief success display
    setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
  }

  // ── Collector path placeholder ──────────────────────────────────────────
  if (isCollectorPath) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col">
        <div className="px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-forest rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-semibold text-xl text-brand-bark">Pavitra</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl p-8 shadow-sm text-center">
            <h1 className="font-display text-3xl text-brand-bark mb-3">Collector Registration</h1>
            <p className="text-text-muted text-sm">
              Collector registration is handled by the platform admin during the pilot phase.
              Please contact{' '}
              <a href="mailto:pavitra@uop.ac.lk" className="text-brand-forest hover:underline">
                pavitra@uop.ac.lk
              </a>{' '}
              to get your account created.
            </p>
            <Link to="/login" className="inline-block mt-6 text-sm text-brand-forest hover:underline">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── No token ────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col">
        <div className="px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-forest rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-semibold text-xl text-brand-bark">Pavitra</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl p-8 shadow-sm text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h1 className="font-display text-2xl text-brand-bark mb-2">Invite link required</h1>
            <p className="text-text-muted text-sm">
              Generator accounts require an invitation from your institution admin or department coordinator.
              Check your email for an invite link.
            </p>
            <Link to="/login" className="inline-block mt-6 text-sm text-brand-forest hover:underline">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Checking token ──────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="space-y-3 w-64">
          {[1,2,3].map(i => (
            <div key={i} className="h-4 bg-surface-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── Invalid token ───────────────────────────────────────────────────────
  if (tokenErr) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col">
        <div className="px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-forest rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-semibold text-xl text-brand-bark">Pavitra</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl p-8 shadow-sm text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="font-display text-2xl text-brand-bark mb-2">Invalid invite</h1>
            <p className="text-text-muted text-sm">{tokenErr}</p>
            <Link to="/login" className="inline-block mt-6 text-sm text-brand-forest hover:underline">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Success ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-brand-forest mx-auto mb-4" />
          <h2 className="font-display text-2xl text-brand-bark">Account created!</h2>
          <p className="text-text-muted text-sm mt-2">Redirecting to your dashboard…</p>
        </div>
      </div>
    )
  }

  // ── Registration form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <div className="px-6 py-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-forest rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-semibold text-xl text-brand-bark">Pavitra</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl p-8 shadow-sm">
          <h1 className="font-display text-3xl text-brand-bark mb-1">Create your account</h1>
          <p className="text-text-muted text-sm mb-6">
            Invited to{' '}
            <span className="font-medium text-text-primary">
              {invite.institutions?.name ?? 'your institution'}
            </span>
            .
          </p>

          {/* Invite context chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {invite.scoped_to_faculty && (
              <span className="text-xs bg-brand-cream border border-surface-border text-text-muted px-2.5 py-1 rounded-full">
                {invite.scoped_to_faculty}
              </span>
            )}
            {invite.scoped_to_department && (
              <span className="text-xs bg-brand-cream border border-surface-border text-text-muted px-2.5 py-1 rounded-full">
                {invite.scoped_to_department}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email — locked to invite */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={invite.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-muted text-text-muted text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Dr. Anura Perera"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest text-sm transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Phone <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+94 71 234 5678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest text-sm transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-surface-border bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Confirm password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-forest text-white font-medium rounded-xl hover:bg-brand-moss disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-forest font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
