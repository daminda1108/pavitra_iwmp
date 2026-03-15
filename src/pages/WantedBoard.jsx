import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, Plus, X, MapPin, Calendar, Package, Repeat
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import EmptyState from '../components/shared/EmptyState'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { cn, formatDate } from '../lib/utils'
import { WASTE_STREAMS } from '../lib/constants'

const STREAM_COLORS = {
  organic:  'bg-green-100  text-green-800  border-green-200',
  plastic:  'bg-blue-100   text-blue-800   border-blue-200',
  paper:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  ewaste:   'bg-purple-100 text-purple-800 border-purple-200',
  chemical: 'bg-red-100    text-red-800    border-red-200',
  general:  'bg-gray-100   text-gray-700   border-gray-200',
}

export default function WantedBoard() {
  const { user, profile } = useAuth()
  const isCollector = profile?.role === 'collector'

  const [listings,  setListings]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [stream,    setStream]    = useState('')
  const [showForm,  setShowForm]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('wanted_listings')
      .select('*, collectors(company_name, service_area, cea_license)')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (stream) q = q.eq('waste_stream', stream)
    const { data } = await q
    setListings(data ?? [])
    setLoading(false)
  }, [stream])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl text-brand-bark">Buyers Seeking</h1>
            <p className="text-text-muted text-sm mt-1">
              CEA-licensed collectors actively seeking specific waste streams from institutions.
            </p>
          </div>
          {isCollector && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-moss transition-colors">
              <Plus className="w-4 h-4" /> Post wanted listing
            </button>
          )}
        </div>

        {/* Stream filter */}
        <div className="flex flex-wrap gap-2 mb-6">
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

        {loading ? (
          <div className="flex justify-center h-48 items-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-forest" />
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No wanted listings"
            description={stream ? 'No collectors seeking this stream right now.' : 'No active wanted listings at this time.'}
            action={isCollector ? (
              <button onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-brand-forest text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-moss">
                <Plus className="w-4 h-4" /> Post a wanted listing
              </button>
            ) : undefined}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map(l => <WantedCard key={l.id} listing={l} />)}
          </div>
        )}
      </main>

      {showForm && (
        <PostWantedModal
          onClose={() => setShowForm(false)}
          onPosted={item => {
            setListings(prev => [item, ...prev])
            setShowForm(false)
          }}
          userId={user?.id}
        />
      )}
    </div>
  )
}

function WantedCard({ listing: l }) {
  const stream = WASTE_STREAMS[l.waste_stream]
  const streamColor = STREAM_COLORS[l.waste_stream] ?? 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 hover:shadow-md hover:border-brand-forest/30 transition-all">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', streamColor)}>
          {stream?.label ?? l.waste_stream}
        </span>
        <span className="text-xs text-text-muted">{formatDate(l.expires_at)}</span>
      </div>

      <p className="font-semibold text-text-primary text-sm mb-1">
        {l.collectors?.company_name ?? 'Collector'}
      </p>

      {(l.subcategories?.length > 0) && (
        <p className="text-xs text-text-muted mb-2 line-clamp-1">
          {l.subcategories.join(', ')}
        </p>
      )}

      <div className="space-y-1.5 text-xs text-text-muted mt-3">
        {l.min_quantity && (
          <div className="flex items-center gap-1.5">
            <Package className="w-3 h-3 shrink-0" />
            Min. {l.min_quantity} {l.min_quantity_unit ?? 'units'}
          </div>
        )}
        {l.frequency_preference && (
          <div className="flex items-center gap-1.5">
            <Repeat className="w-3 h-3 shrink-0" />
            {l.frequency_preference}
          </div>
        )}
        {l.service_area && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {l.service_area}
          </div>
        )}
      </div>

      {l.notes && (
        <p className="mt-3 pt-3 border-t border-surface-border text-xs text-text-muted line-clamp-2">
          {l.notes}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-surface-border text-xs text-text-muted">
        CEA #{l.collectors?.cea_license ?? '—'}
        {l.collectors?.service_area && <span className="ml-2">· {l.collectors.service_area}</span>}
      </div>
    </div>
  )
}

function PostWantedModal({ onClose, onPosted, userId }) {
  const [form,   setForm]   = useState({
    waste_stream: '', notes: '', min_quantity: '', min_quantity_unit: 'kg',
    frequency_preference: '', service_area: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (!form.waste_stream) { setError('Please select a waste stream.'); return }
    setSaving(true)
    const { data, error: err } = await supabase.from('wanted_listings').insert({
      collector_id:         userId,
      waste_stream:         form.waste_stream,
      min_quantity:         form.min_quantity ? parseFloat(form.min_quantity) : null,
      min_quantity_unit:    form.min_quantity_unit || null,
      frequency_preference: form.frequency_preference || null,
      service_area:         form.service_area || null,
      notes:                form.notes || null,
      is_active:            true,
      expires_at:           new Date(Date.now() + 90 * 86400000).toISOString(),
    }).select('*, collectors(company_name, service_area, cea_license)').single()
    if (err) { setError(err.message); setSaving(false); return }
    onPosted(data)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-text-primary">Post wanted listing</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Waste stream *</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(WASTE_STREAMS).map(([k, s]) => (
                <button key={k} type="button"
                  onClick={() => set('waste_stream', form.waste_stream === k ? '' : k)}
                  className={cn('px-3 py-1.5 rounded-full text-xs border transition-colors',
                    form.waste_stream === k
                      ? `${STREAM_COLORS[k]} font-medium`
                      : 'bg-white text-text-muted border-surface-border hover:border-brand-forest/40'
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Min. quantity</label>
              <input type="number" value={form.min_quantity} onChange={e => set('min_quantity', e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Unit</label>
              <select value={form.min_quantity_unit} onChange={e => set('min_quantity_unit', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/30">
                {['kg', 'tonnes', 'litres', 'units', 'bags', 'boxes'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Pickup frequency</label>
            <select value={form.frequency_preference} onChange={e => set('frequency_preference', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/30">
              <option value="">One-time or flexible</option>
              <option value="Weekly">Weekly</option>
              <option value="Fortnightly">Fortnightly</option>
              <option value="Monthly">Monthly</option>
              <option value="On demand">On demand</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Service area</label>
            <input value={form.service_area} onChange={e => set('service_area', e.target.value)}
              placeholder="Kandy, Central Province"
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30" />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Additional requirements, certifications available, contact preferences..."
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 resize-none" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-text-muted border border-surface-border hover:text-text-primary">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-brand-forest text-white hover:bg-brand-moss disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Post listing
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
