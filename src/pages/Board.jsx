import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, X, Loader2, Package } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import StatusBadge from '../components/shared/StatusBadge'
import HazardBadge from '../components/shared/HazardBadge'
import EmptyState from '../components/shared/EmptyState'
import { supabase } from '../lib/supabase'
import { cn, formatDate } from '../lib/utils'
import { WASTE_STREAMS, HAZARD_LEVELS } from '../lib/constants'

const STREAM_COLORS = {
  organic:  'bg-green-100  text-green-800  border-green-200',
  plastic:  'bg-blue-100   text-blue-800   border-blue-200',
  paper:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  ewaste:   'bg-purple-100 text-purple-800 border-purple-200',
  chemical: 'bg-red-100    text-red-800    border-red-200',
  general:  'bg-gray-100   text-gray-700   border-gray-200',
}

export default function Board() {
  const [listings,    setListings]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [stream,      setStream]      = useState('')
  const [hazard,      setHazard]      = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('listings')
      .select('id, waste_stream, subcategory, material_name, hazard_level, quantity, unit, campus_location, status, claim_mode, created_at, pickup_date')
      .in('status', ['open', 'bidding'])
      .order('created_at', { ascending: false })

    if (stream) q = q.eq('waste_stream', stream)
    if (hazard) q = q.eq('hazard_level', hazard)

    const { data } = await q
    setListings(data ?? [])
    setLoading(false)
  }, [stream, hazard])

  useEffect(() => { fetchListings() }, [fetchListings])

  const visible = search.trim()
    ? listings.filter(l => {
        const hay = [l.material_name, l.subcategory, l.waste_stream, l.campus_location]
          .filter(Boolean).join(' ').toLowerCase()
        return search.toLowerCase().split(' ').every(w => hay.includes(w))
      })
    : listings

  const activeFilters = [stream, hazard].filter(Boolean).length

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-brand-bark">Waste Board</h1>
          <p className="text-text-muted text-sm mt-1">
            Open listings from University of Peradeniya. Certified collectors can claim or bid.
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search material, location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(s => !s)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              showFilters || activeFilters > 0
                ? 'border-brand-forest bg-brand-forest/5 text-brand-forest'
                : 'border-surface-border bg-white text-text-muted hover:border-brand-forest/40'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <span className="w-5 h-5 bg-brand-forest text-white text-xs rounded-full flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-surface-border rounded-xl p-5 mb-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Waste stream</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setStream('')}
                  className={cn('px-3 py-1.5 rounded-full text-xs border transition-colors',
                    !stream ? 'bg-brand-forest text-white border-brand-forest' : 'bg-white text-text-muted border-surface-border hover:border-brand-forest/40'
                  )}>All streams</button>
                {Object.entries(WASTE_STREAMS).map(([key, s]) => (
                  <button key={key} onClick={() => setStream(stream === key ? '' : key)}
                    className={cn('px-3 py-1.5 rounded-full text-xs border transition-colors',
                      stream === key ? `${STREAM_COLORS[key]} font-medium` : 'bg-white text-text-muted border-surface-border hover:border-brand-forest/40'
                    )}>{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Hazard level</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setHazard('')}
                  className={cn('px-3 py-1.5 rounded-full text-xs border transition-colors',
                    !hazard ? 'bg-brand-forest text-white border-brand-forest' : 'bg-white text-text-muted border-surface-border hover:border-brand-forest/40'
                  )}>All levels</button>
                {Object.keys(HAZARD_LEVELS).map(key => (
                  <button key={key} onClick={() => setHazard(hazard === key ? '' : key)}
                    className={cn('px-2 py-1 rounded-full border transition-colors',
                      hazard === key ? 'border-brand-forest' : 'border-transparent'
                    )}>
                    <HazardBadge level={key} />
                  </button>
                ))}
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setStream(''); setHazard('') }}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {!loading && (
          <p className="text-xs text-text-muted mb-4">
            {visible.length} listing{visible.length !== 1 ? 's' : ''} found
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-brand-forest" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No listings found"
            description={activeFilters > 0 || search ? 'Try adjusting your filters.' : 'No open listings at this time.'}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(l => <BoardCard key={l.id} listing={l} />)}
          </div>
        )}
      </main>
    </div>
  )
}

function BoardCard({ listing }) {
  const streamColor = STREAM_COLORS[listing.waste_stream] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  const displayName = listing.material_name || listing.subcategory || listing.waste_stream
  const stream      = WASTE_STREAMS[listing.waste_stream]

  return (
    <Link to={`/board/${listing.id}`}
      className="block bg-surface-card border border-surface-border rounded-xl p-5 hover:shadow-md hover:border-brand-forest/30 transition-all group">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', streamColor)}>
          {stream?.label ?? listing.waste_stream}
        </span>
        <StatusBadge status={listing.status} />
      </div>
      <h3 className="font-medium text-text-primary text-sm leading-snug mb-1 group-hover:text-brand-forest transition-colors line-clamp-2">
        {displayName}
      </h3>
      <p className="text-text-muted text-xs mb-3">{listing.quantity} {listing.unit}</p>
      <HazardBadge level={listing.hazard_level} />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border text-xs text-text-muted">
        <span>{listing.campus_location}</span>
        <span>
          {listing.claim_mode === 'open_bids'
            ? 'Sealed bids'
            : listing.pickup_date ? formatDate(listing.pickup_date) : formatDate(listing.created_at)}
        </span>
      </div>
    </Link>
  )
}
