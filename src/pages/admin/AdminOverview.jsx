import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Package, Users, Building2, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDateTime } from '../../lib/utils'
import { WASTE_STREAMS } from '../../lib/constants'

export default function AdminOverview() {
  const [stats,   setStats]   = useState(null)
  const [recent,  setRecent]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [listRes, collRes, genRes, claimRes, recentRes] = await Promise.all([
        supabase.from('listings').select('status'),
        supabase.from('collectors').select('status'),
        supabase.from('generators').select('id'),
        supabase.from('claims').select('status'),
        supabase.from('listings')
          .select('id, waste_stream, material_name, subcategory, status, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      const listings   = listRes.data  ?? []
      const collectors = collRes.data  ?? []
      const claims     = claimRes.data ?? []
      const by = (arr, s) => arr.filter(x => x.status === s).length

      setStats({
        listings_open:       by(listings, 'open'),
        listings_bidding:    by(listings, 'bidding'),
        listings_completed:  by(listings, 'completed'),
        collectors_pending:  by(collectors, 'pending'),
        collectors_approved: by(collectors, 'approved'),
        generators_total:    (genRes.data ?? []).length,
      })
      setRecent(recentRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 animate-spin text-brand-forest" />
    </div>
  )

  const statCards = [
    { label: 'Open listings',        value: stats.listings_open,        icon: Package,    color: 'text-brand-forest' },
    { label: 'Bidding',              value: stats.listings_bidding,     icon: Clock,      color: 'text-amber-600'    },
    { label: 'Completed pickups',    value: stats.listings_completed,   icon: CheckCheck, color: 'text-green-600'    },
    { label: 'Approved collectors',  value: stats.collectors_approved,  icon: Users,      color: 'text-brand-forest' },
    { label: 'Pending approvals',    value: stats.collectors_pending,   icon: AlertCircle,color: 'text-amber-600'    },
    { label: 'Generators (depts)',   value: stats.generators_total,     icon: Building2,  color: 'text-text-primary' },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-bark mb-6">Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white border border-surface-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
              <p className={`text-3xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          )
        })}
      </div>

      {stats.collectors_pending > 0 && (
        <div className="mb-6 flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>{stats.collectors_pending}</strong> collector application
            {stats.collectors_pending > 1 ? 's' : ''} awaiting review.
          </span>
          <Link to="/admin/collectors" className="ml-auto text-xs font-medium underline">Review →</Link>
        </div>
      )}

      <div className="bg-white border border-surface-border rounded-xl p-5">
        <h2 className="font-semibold text-text-primary mb-4 text-sm">Recent listings</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-text-muted">No listings yet.</p>
        ) : (
          <div className="divide-y divide-surface-border">
            {recent.map(l => (
              <div key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="font-medium text-text-primary">
                    {l.material_name || l.subcategory || l.waste_stream}
                  </span>
                  <span className="text-text-muted ml-2 text-xs">
                    {WASTE_STREAMS[l.waste_stream]?.label ?? l.waste_stream}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="capitalize">{l.status}</span>
                  <span>{formatDateTime(l.created_at)}</span>
                  <Link to={`/board/${l.id}`} className="text-brand-forest hover:underline">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
