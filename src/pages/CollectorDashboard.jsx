import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, ClipboardList, CheckCheck, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import StatusBadge from '../components/shared/StatusBadge'
import HazardBadge from '../components/shared/HazardBadge'
import EmptyState from '../components/shared/EmptyState'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatDate, formatCurrency } from '../lib/utils'
import { WASTE_STREAMS } from '../lib/constants'

const CLAIM_TABS = [
  { key: 'active',    label: 'Active',    statuses: ['pending', 'confirmed'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
  { key: 'declined',  label: 'Declined',  statuses: ['declined'] },
]

export default function CollectorDashboard() {
  const { user, profile } = useAuth()

  const [collector, setCollector] = useState(null)
  const [claims,    setClaims]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('active')

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [colRes, claimRes] = await Promise.all([
      supabase.from('collectors').select('*').eq('id', user.id).single(),
      supabase
        .from('claims')
        .select('*, listings(id, waste_stream, subcategory, material_name, quantity, unit, campus_location, hazard_level, status, pickup_date, generator_id)')
        .eq('collector_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    setCollector(colRes.data)
    setClaims(claimRes.data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const group   = CLAIM_TABS.find(t => t.key === tab)
  const visible = claims.filter(c => group?.statuses.includes(c.status))

  const active    = claims.filter(c => ['pending', 'confirmed'].includes(c.status)).length
  const completed = claims.filter(c => c.status === 'completed').length

  if (loading) return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-forest" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-bark">
              {collector?.company_name ?? profile?.full_name ?? 'Collector Dashboard'}
            </h1>
            {collector && (
              <p className="text-text-muted text-sm mt-0.5">
                CEA #{collector.cea_license}
                {collector.cea_verified && ' · Verified'}
              </p>
            )}
          </div>
          <Link to="/board"
            className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-moss transition-colors">
            <Search className="w-4 h-4" />
            Browse listings
          </Link>
        </div>

        {/* Pending approval banner */}
        {collector && collector.status !== 'approved' && (
          <div className="mb-6 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            Your account is <strong className="mx-1">{collector.status}</strong>.
            {collector.status === 'pending' && ' An admin will review your application shortly.'}
            {collector.status === 'rejected' && collector.rejection_reason && (
              <span className="ml-1">Reason: {collector.rejection_reason}</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total claims/bids', value: claims.length,  icon: ClipboardList },
            { label: 'Active',            value: active,         icon: ClipboardList },
            { label: 'Completed pickups', value: completed,      icon: CheckCheck    },
          ].map(s => (
            <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-5">
              <p className="text-2xl font-semibold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-muted p-1 rounded-xl w-fit mb-6">
          {CLAIM_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}>
              {t.label}
              {t.key === 'active' && active > 0 && (
                <span className="ml-1.5 bg-brand-forest text-white text-xs px-1.5 py-0.5 rounded-full">{active}</span>
              )}
            </button>
          ))}
        </div>

        {/* Claims list */}
        {visible.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={tab === 'active' ? 'No active claims' : `No ${tab} claims`}
            description={tab === 'active' ? 'Browse the board to find and claim waste listings.' : undefined}
            action={tab === 'active' ? (
              <Link to="/board" className="inline-flex items-center gap-2 bg-brand-forest text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-moss transition-colors">
                <Search className="w-4 h-4" /> Browse listings
              </Link>
            ) : undefined}
          />
        ) : (
          <div className="space-y-3">
            {visible.map(claim => (
              <ClaimRow key={claim.id} claim={claim} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ClaimRow({ claim }) {
  const listing     = claim.listings
  const stream      = WASTE_STREAMS[listing?.waste_stream]
  const displayName = listing?.material_name || listing?.subcategory || listing?.waste_stream

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-text-muted">{stream?.label ?? listing?.waste_stream}</span>
          {listing && <StatusBadge status={listing.status} />}
          <StatusBadge status={claim.status} />
        </div>
        <p className="font-medium text-text-primary text-sm truncate">{displayName}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {listing?.quantity} {listing?.unit}
          {listing?.campus_location && ` · ${listing.campus_location}`}
        </p>
        {listing && <HazardBadge level={listing.hazard_level} className="mt-2" />}
      </div>

      {/* Claim meta */}
      <div className="text-right shrink-0 text-sm space-y-1">
        {claim.financial_direction && (
          <p className="text-xs text-text-muted capitalize">
            {{ collector_pays_generator: 'You pay generator', generator_pays_collector: 'Generator pays you', free_collection: 'Free collection' }[claim.financial_direction] ?? claim.financial_direction}
          </p>
        )}
        {claim.offered_price && (
          <p className="font-medium text-text-primary">{formatCurrency(claim.offered_price)}</p>
        )}
        {claim.proposed_pickup_date && (
          <p className="text-xs text-text-muted">Proposed: {formatDate(claim.proposed_pickup_date)}</p>
        )}
        {listing && (
          <Link to={`/board/${listing.id}`}
            className="inline-flex items-center gap-1 text-xs text-brand-forest hover:underline mt-1">
            View listing <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}
