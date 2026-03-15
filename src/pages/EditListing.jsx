import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle, Save, XCircle } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import HazardBadge from '../components/shared/HazardBadge'
import StatusBadge from '../components/shared/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { UNITS, PICKUP_WINDOWS, FREQUENCIES, DAYS_OF_WEEK, FINANCIAL_HINTS } from '../lib/constants'

export default function EditListing() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [listing,  setListing]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)
  const [saved,    setSaved]    = useState(false)

  const [quantity,      setQuantity]      = useState('')
  const [unit,          setUnit]          = useState('kg')
  const [handlingNotes, setHandlingNotes] = useState('')
  const [pickupDate,    setPickupDate]    = useState('')
  const [pickupWindow,  setPickupWindow]  = useState('')
  const [frequency,     setFrequency]     = useState('')
  const [preferredDays, setPreferredDays] = useState([])
  const [financialHint, setFinancialHint] = useState('unknown')
  const [bidDeadline,   setBidDeadline]   = useState('')

  useEffect(() => {
    if (!id || !user) return
    async function load() {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('generator_id', user.id)
        .single()

      if (error || !data) {
        setError('Listing not found or you do not have access.')
        setLoading(false)
        return
      }

      setListing(data)
      setQuantity(String(data.quantity))
      setUnit(data.unit)
      setHandlingNotes(data.handling_notes ?? '')
      setPickupDate(data.pickup_date ?? '')
      setPickupWindow(data.pickup_window ?? '')
      setFrequency(data.frequency ?? '')
      setPreferredDays(data.preferred_days ?? [])
      setFinancialHint(data.financial_hint ?? 'unknown')
      setBidDeadline(data.bid_deadline ? data.bid_deadline.slice(0,16) : '')
      setLoading(false)
    }
    load()
  }, [id, user])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const updates = {
      quantity:       Number(quantity),
      unit,
      handling_notes: handlingNotes || null,
      financial_hint: financialHint,
      updated_at:     new Date().toISOString(),
    }

    if (listing.pickup_type === 'one_time') {
      updates.pickup_date   = pickupDate   || null
      updates.pickup_window = pickupWindow || null
    } else {
      updates.frequency      = frequency      || null
      updates.preferred_days = preferredDays.length ? preferredDays : null
    }

    if (listing.claim_mode === 'open_bids') {
      updates.bid_deadline = bidDeadline || null
    }

    const { error: saveErr } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .eq('generator_id', user.id)

    if (saveErr) {
      setError(saveErr.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => navigate('/dashboard'), 1200)
  }

  async function handleCancel() {
    if (!confirm('Cancel this listing? This cannot be undone.')) return
    const { error } = await supabase
      .from('listings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('generator_id', user.id)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

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

  if (!listing) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-brand-bark mb-2">Not found</h1>
          <p className="text-text-muted text-sm">{error ?? 'This listing was not found.'}</p>
          <Link to="/dashboard" className="inline-block mt-6 text-sm text-brand-forest hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const canEdit = ['open', 'bidding'].includes(listing.status)

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-forest mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-bark">Edit listing</h1>
            <p className="text-text-muted text-sm mt-1">
              {listing.material_name || listing.subcategory || listing.waste_stream}
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </div>

        {!canEdit && (
          <div className="mb-6 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            This listing is <strong className="mx-1">{listing.status}</strong> and can no longer be edited.
          </div>
        )}

        {/* Locked context */}
        <div className="bg-surface-muted border border-surface-border rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">Locked fields</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <LockRow label="Waste stream"  value={listing.waste_stream} />
            <LockRow label="Subcategory"   value={listing.subcategory} />
            <LockRow label="Campus"        value={listing.campus_location} />
            <LockRow label="Claim mode"    value={listing.claim_mode === 'quick_claim' ? 'Quick claim' : 'Open bids'} />
          </div>
          <HazardBadge level={listing.hazard_level} />
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-5 flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <Save className="w-4 h-4 shrink-0" />
            Saved. Redirecting…
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                disabled={!canEdit} min="0.01" step="any"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition disabled:bg-surface-muted disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Unit</label>
              <select
                value={unit} onChange={e => setUnit(e.target.value)} disabled={!canEdit}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition disabled:bg-surface-muted disabled:cursor-not-allowed"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Handling notes
              {['medium','high'].includes(listing.hazard_level) && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              value={handlingNotes} onChange={e => setHandlingNotes(e.target.value)}
              disabled={!canEdit} rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition resize-none disabled:bg-surface-muted disabled:cursor-not-allowed"
            />
          </div>

          {listing.pickup_type === 'one_time' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Preferred date</label>
                <input
                  type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                  disabled={!canEdit} min={new Date().toISOString().slice(0,10)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition disabled:bg-surface-muted disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Time window</label>
                <select
                  value={pickupWindow} onChange={e => setPickupWindow(e.target.value)} disabled={!canEdit}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition disabled:bg-surface-muted disabled:cursor-not-allowed"
                >
                  <option value="">Any time</option>
                  {PICKUP_WINDOWS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
          )}

          {listing.pickup_type === 'recurring' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Frequency</label>
                <select
                  value={frequency} onChange={e => setFrequency(e.target.value)} disabled={!canEdit}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition disabled:bg-surface-muted disabled:cursor-not-allowed"
                >
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Preferred days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day} type="button" disabled={!canEdit}
                      onClick={() => setPreferredDays(prev =>
                        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                      )}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs border transition-colors',
                        preferredDays.includes(day)
                          ? 'bg-brand-forest text-white border-brand-forest'
                          : 'bg-white text-text-muted border-surface-border',
                        !canEdit && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {day.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {listing.claim_mode === 'open_bids' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Bid deadline</label>
              <input
                type="datetime-local" value={bidDeadline} onChange={e => setBidDeadline(e.target.value)}
                disabled={!canEdit} min={new Date().toISOString().slice(0,16)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition disabled:bg-surface-muted disabled:cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Financial expectation</label>
            <div className="space-y-2">
              {Object.entries(FINANCIAL_HINTS).map(([key, hint]) => (
                <label key={key} className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                  financialHint === key ? 'border-brand-forest bg-brand-forest/5' : 'border-surface-border bg-white',
                  !canEdit && 'opacity-50 cursor-not-allowed'
                )}>
                  <input
                    type="radio" name="financial_hint" value={key}
                    checked={financialHint === key}
                    onChange={() => canEdit && setFinancialHint(key)}
                    disabled={!canEdit}
                    className="accent-brand-forest"
                  />
                  <span className="text-sm text-text-primary">{hint.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-surface-border">
            {canEdit && (
              <button
                type="button" onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel listing
              </button>
            )}
            <div className="ml-auto">
              {canEdit ? (
                <button
                  type="submit" disabled={saving || saved}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-forest text-white font-medium rounded-xl hover:bg-brand-moss disabled:opacity-50 transition-colors text-sm"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Save className="w-4 h-4" /> Save changes</>
                  }
                </button>
              ) : (
                <Link to="/dashboard" className="px-6 py-2.5 bg-surface-muted text-text-muted font-medium rounded-xl text-sm">
                  Back to dashboard
                </Link>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

function LockRow({ label, value }) {
  if (!value) return null
  return (
    <div>
      <span className="text-text-muted block text-xs">{label}</span>
      <span className="text-text-primary font-medium capitalize">{value}</span>
    </div>
  )
}
