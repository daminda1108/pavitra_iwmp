import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Search, X, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { WASTE_STREAMS } from '../../lib/constants'
import StatusBadge from '../../components/shared/StatusBadge'
import HazardBadge from '../../components/shared/HazardBadge'

const STATUS_FILTERS = ['all', 'open', 'bidding', 'claimed', 'confirmed', 'completed', 'cancelled', 'expired']

export default function AdminListings() {
  const [listings, setListings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [status,   setStatus]   = useState('all')
  const [stream,   setStream]   = useState('')
  const [search,   setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('listings')
      .select('id, waste_stream, material_name, subcategory, status, hazard_level, quantity, unit, campus_location, claim_mode, created_at, generator_id, generators(profiles(full_name))')
      .order('created_at', { ascending: false })

    if (status !== 'all') q = q.eq('status', status)
    if (stream)           q = q.eq('waste_stream', stream)

    const { data } = await q
    setListings(data ?? [])
    setLoading(false)
  }, [status, stream])

  useEffect(() => { load() }, [load])

  const visible = search.trim()
    ? listings.filter(l => {
        const hay = [l.material_name, l.subcategory, l.waste_stream, l.campus_location]
          .filter(Boolean).join(' ').toLowerCase()
        return search.toLowerCase().split(' ').every(w => hay.includes(w))
      })
    : listings

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-brand-bark">All Listings</h1>
        <span className="text-sm text-text-muted">{listings.length} results</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search material, location..."
            className="pl-8 pr-8 py-2 rounded-xl border border-surface-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-forest/30 w-52" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-surface-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-forest/30 capitalize">
          {STATUS_FILTERS.map(s => <option key={s} value={s} className="capitalize">{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
        <select value={stream} onChange={e => setStream(e.target.value)}
          className="px-3 py-2 rounded-xl border border-surface-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-forest/30">
          <option value="">All streams</option>
          {Object.entries(WASTE_STREAMS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
        {(status !== 'all' || stream) && (
          <button onClick={() => { setStatus('all'); setStream('') }}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center h-32 items-center">
          <Loader2 className="w-5 h-5 animate-spin text-brand-forest" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-text-muted py-8 text-center">No listings found.</p>
      ) : (
        <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-xs text-text-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Material</th>
                <th className="px-4 py-3 text-left font-medium">Stream</th>
                <th className="px-4 py-3 text-left font-medium">Qty</th>
                <th className="px-4 py-3 text-left font-medium">Hazard</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Generator</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visible.map(l => (
                <tr key={l.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary truncate max-w-[180px]">
                      {l.material_name || l.subcategory || l.waste_stream}
                    </p>
                    {l.campus_location && <p className="text-xs text-text-muted">{l.campus_location}</p>}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {WASTE_STREAMS[l.waste_stream]?.label ?? l.waste_stream}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                    {l.quantity} {l.unit}
                  </td>
                  <td className="px-4 py-3">
                    <HazardBadge level={l.hazard_level} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {l.generators?.profiles?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                    {formatDate(l.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/board/${l.id}`} target="_blank"
                      className="text-text-muted hover:text-brand-forest">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
