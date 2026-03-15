import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ClipboardList, CheckCheck, Loader2, AlertCircle } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import ListingCard from '../components/listings/ListingCard'
import EmptyState from '../components/shared/EmptyState'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const STATUS_GROUPS = [
  { key: 'active',    label: 'Active',    statuses: ['open', 'bidding', 'claimed', 'confirmed'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
  { key: 'closed',    label: 'Closed',    statuses: ['cancelled', 'expired'] },
]

export default function GeneratorDashboard() {
  const { user, profile } = useAuth()

  const [listings,  setListings]  = useState([])
  const [generator, setGenerator] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [tab,       setTab]       = useState('active')
  const [cancelling, setCancelling] = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const [genRes, listRes] = await Promise.all([
      supabase
        .from('generators')
        .select('*, institutions(name, short_name)')
        .eq('id', user.id)
        .single(),
      supabase
        .from('listings')
        .select('*')
        .eq('generator_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    if (genRes.error)  setError(genRes.error.message)
    if (listRes.error) setError(listRes.error.message)

    setGenerator(genRes.data)
    setListings(listRes.data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCancel(id) {
    if (!confirm('Cancel this listing? This cannot be undone.')) return
    setCancelling(id)
    const { error } = await supabase
      .from('listings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('generator_id', user.id)
    if (error) alert(error.message)
    else setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'cancelled' } : l))
    setCancelling(null)
  }

  // Stats
  const open      = listings.filter(l => l.status === 'open').length
  const active    = listings.filter(l => ['open','bidding','claimed','confirmed'].includes(l.status)).length
  const completed = listings.filter(l => l.status === 'completed').length

  // Filtered for current tab
  const group   = STATUS_GROUPS.find(g => g.key === tab)
  const visible = listings.filter(l => group?.statuses.includes(l.status))

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-brand-forest" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-bark">
              {profile?.full_name ? `Hello, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
            </h1>
            {generator?.institutions && (
              <p className="text-text-muted text-sm mt-0.5">
                {generator.institutions.name}
                {generator.department ? ` · ${generator.department}` : ''}
                {generator.lab_name   ? ` · ${generator.lab_name}`   : ''}
              </p>
            )}
            {generator && !generator.is_authorized && (
              <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2.5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Your account is pending authorization. You can draft listings but cannot publish until authorized.
              </div>
            )}
          </div>

          <Link
            to="/dashboard/new"
            className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-moss transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post Waste
          </Link>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total listings', value: listings.length, icon: ClipboardList },
            { label: 'Currently active', value: active, icon: ClipboardList },
            { label: 'Completed pickups', value: completed, icon: CheckCheck },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-card border border-surface-border rounded-xl p-5">
              <p className="text-2xl font-semibold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-muted p-1 rounded-xl w-fit mb-6">
          {STATUS_GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setTab(g.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === g.key
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {g.label}
              {g.key === 'active' && active > 0 && (
                <span className="ml-1.5 bg-brand-forest text-white text-xs px-1.5 py-0.5 rounded-full">
                  {active}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Listings grid */}
        {visible.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={tab === 'active' ? 'No active listings' : `No ${tab} listings`}
            description={tab === 'active' ? 'Post your first waste listing to get started.' : undefined}
            action={
              tab === 'active' ? (
                <Link
                  to="/dashboard/new"
                  className="inline-flex items-center gap-2 bg-brand-forest text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-moss transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Post Waste
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(listing => (
              <div key={listing.id} className={cancelling === listing.id ? 'opacity-50 pointer-events-none' : ''}>
                <ListingCard
                  listing={listing}
                  onCancel={handleCancel}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
