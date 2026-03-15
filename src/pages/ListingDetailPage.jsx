import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, Calendar, MapPin, Package, Clock, Lock,
  AlertCircle, CheckCircle, Loader2, Gavel
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import StatusBadge from '../components/shared/StatusBadge'
import HazardBadge from '../components/shared/HazardBadge'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { cn, formatDate, formatDateTime } from '../lib/utils'
import { WASTE_STREAMS, FINANCIAL_DIRECTIONS } from '../lib/constants'

export default function ListingDetailPage() {
  const { id }            = useParams()
  const { user, profile } = useAuth()

  const [listing,   setListing]   = useState(null)
  const [collector, setCollector] = useState(null)
  const [myClaim,   setMyClaim]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [claiming,  setClaiming]  = useState(false)
  const [claimErr,  setClaimErr]  = useState(null)
  const [claimOk,   setClaimOk]   = useState(false)

  const [bidDirection,  setBidDirection]  = useState('free')
  const [bidPrice,      setBidPrice]      = useState('')
  const [bidNote,       setBidNote]       = useState('')
  const [bidDate,       setBidDate]       = useState('')

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase
        .from('listings')
        .select('*, generators(id, faculty, department, lab_name, profiles(full_name), institutions(name))')
        .eq('id', id)
        .single()
      setListing(data)

      if (user && profile?.role === 'collector') {
        const [{ data: col }, { data: existing }] = await Promise.all([
          supabase.from('collectors').select('*').eq('id', user.id).single(),
          supabase.from('claims').select('*').eq('listing_id', id).eq('collector_id', user.id).maybeSingle(),
        ])
        setCollector(col)
        setMyClaim(existing)
      }
      setLoading(false)
    }
    load()
  }, [id, user, profile])

  async function submitClaim() {
    setClaimErr(null)
    setClaiming(true)
    const { data, error } = await supabase.from('claims').insert({
      listing_id:           id,
      collector_id:         user.id,
      proposed_pickup_date: bidDate || null,
      collector_note:       bidNote || null,
      financial_direction:  bidDirection,
      offered_price:        bidPrice ? Number(bidPrice) : null,
      price_currency:       'LKR',
    }).select().single()

    if (error) { setClaimErr(error.message); setClaiming(false); return }

    const newStatus = listing.claim_mode === 'open_bids' ? 'bidding' : 'claimed'
    if (listing.status === 'open' || (listing.claim_mode === 'open_bids' && listing.status === 'bidding')) {
      await supabase.from('listings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
      setListing(prev => prev ? { ...prev, status: newStatus } : prev)
    }

    setMyClaim(data)
    setClaimOk(true)
    setClaiming(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-forest" />
      </div>
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-brand-bark mb-3">Listing not found</h1>
        <Link to="/board" className="text-sm text-brand-forest hover:underline">Back to board</Link>
      </div>
    </div>
  )

  const gen         = listing.generators
  const institution = gen?.institutions
  const stream      = WASTE_STREAMS[listing.waste_stream]
  const displayName = listing.material_name || listing.subcategory || listing.waste_stream
  const isOpen      = ['open', 'bidding'].includes(listing.status)
  const isBid       = listing.claim_mode === 'open_bids'
  const canClaim    = profile?.role === 'collector' && collector?.status === 'approved'
  const alreadyDone = !!myClaim || claimOk

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/board" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-forest mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to board
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: details ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Main card */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs text-text-muted uppercase tracking-wide font-medium">
                    {stream?.label ?? listing.waste_stream}
                  </span>
                  <h1 className="font-display text-2xl text-brand-bark mt-0.5 leading-tight">{displayName}</h1>
                </div>
                <StatusBadge status={listing.status} />
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <HazardBadge level={listing.hazard_level} />
                {isBid && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-violet-50 text-violet-700 border-violet-200">
                    <Gavel className="w-3 h-3" /> Open bids
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <MetaRow icon={Package}  label="Quantity"        value={`${listing.quantity} ${listing.unit}`} />
                <MetaRow icon={MapPin}   label="Location"        value={listing.campus_location} />
                {listing.lab_name       && <MetaRow icon={MapPin}   label="Lab"             value={listing.lab_name} />}
                <MetaRow icon={Calendar} label="Posted"          value={formatDate(listing.created_at)} />
                {listing.pickup_date    && <MetaRow icon={Calendar} label="Preferred pickup" value={formatDate(listing.pickup_date)} />}
                {listing.pickup_window  && <MetaRow icon={Clock}    label="Time window"      value={listing.pickup_window} />}
                {listing.frequency      && <MetaRow icon={Clock}    label="Frequency"        value={listing.frequency} />}
                {listing.bid_deadline   && <MetaRow icon={Clock}    label="Bid deadline"     value={formatDateTime(listing.bid_deadline)} />}
              </div>

              {listing.handling_notes && (
                <div className="mt-5 pt-4 border-t border-surface-border">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Handling notes</p>
                  <p className="text-sm text-text-primary leading-relaxed">{listing.handling_notes}</p>
                </div>
              )}
            </div>

            {/* E-waste details */}
            {listing.waste_stream === 'ewaste' && (listing.ewaste_item_count || listing.ewaste_device_categories?.length || listing.ewaste_has_pcb || listing.ewaste_data_bearing) && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-6">
                <h3 className="font-semibold text-text-primary mb-4">E-waste details</h3>
                <div className="space-y-2.5 text-sm">
                  {listing.ewaste_item_count > 0 && <p><span className="text-text-muted">Item count: </span>{listing.ewaste_item_count}</p>}
                  {listing.ewaste_condition && <p><span className="text-text-muted">Condition: </span>{listing.ewaste_condition}</p>}
                  {listing.ewaste_device_categories?.length > 0 && (
                    <p><span className="text-text-muted">Device types: </span>{listing.ewaste_device_categories.join(', ')}</p>
                  )}
                  {listing.ewaste_has_pcb && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Contains PCBs — Basel-certified collector required
                    </div>
                  )}
                  {listing.ewaste_data_bearing && (
                    <div className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <Lock className="w-4 h-4 shrink-0" />
                      Data-bearing — data destruction certificate required
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Photos */}
            {listing.photos?.length > 0 && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-6">
                <h3 className="font-semibold text-text-primary mb-4">Photos</h3>
                <div className="grid grid-cols-3 gap-3">
                  {listing.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="w-full aspect-square object-cover rounded-xl border border-surface-border hover:opacity-90 transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Generator */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-6">
              <h3 className="font-semibold text-text-primary mb-3">Generator</h3>
              <div className="text-sm space-y-1">
                {institution && <p className="font-medium">{institution.name}</p>}
                {gen?.faculty    && <p className="text-text-muted">{gen.faculty}</p>}
                {gen?.department && <p className="text-text-muted">{gen.department}</p>}
                {gen?.lab_name   && <p className="text-text-muted">{gen.lab_name}</p>}
                <div className="pt-2 mt-2 border-t border-surface-border">
                  <p className="text-xs text-text-muted">Authorized by</p>
                  <p className="font-medium">{listing.authorized_by_name}</p>
                  <p className="text-xs text-text-muted">{listing.authorized_by_title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: claim sidebar ── */}
          <div className="space-y-4">
            {listing.financial_hint && listing.financial_hint !== 'unknown' && (
              <div className="bg-white border border-surface-border rounded-xl p-4 text-sm">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Generator expects</p>
                <p className="text-text-primary">
                  {{ expect_to_receive: 'Payment for this material', expect_to_pay: 'To pay for disposal', expect_free: 'Free collection' }[listing.financial_hint]}
                </p>
              </div>
            )}

            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              {/* Not logged in */}
              {!user && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-text-muted">Sign in as an approved collector to {isBid ? 'bid on' : 'claim'} this listing.</p>
                  <Link to="/login" className="block w-full py-2.5 bg-brand-forest text-white text-sm font-medium rounded-xl hover:bg-brand-moss transition text-center">
                    Sign in
                  </Link>
                </div>
              )}

              {/* Wrong role */}
              {user && profile?.role !== 'collector' && (
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Only approved collectors can claim listings.
                </p>
              )}

              {/* Pending collector */}
              {user && profile?.role === 'collector' && collector?.status !== 'approved' && (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  Your account is pending approval.
                </div>
              )}

              {/* Success */}
              {claimOk && (
                <div className="text-sm text-brand-forest bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {isBid ? 'Bid submitted successfully.' : 'Claim submitted. Awaiting generator confirmation.'}
                </div>
              )}

              {/* Already claimed */}
              {myClaim && !claimOk && (
                <div className="space-y-3">
                  <div className="text-sm text-brand-forest bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    You already {isBid ? 'placed a bid' : 'claimed this listing'}.
                  </div>
                  <StatusBadge status={myClaim.status} />
                </div>
              )}

              {/* Closed */}
              {!isOpen && !myClaim && !claimOk && user && (
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  This listing is no longer accepting {isBid ? 'bids' : 'claims'}.
                </p>
              )}

              {/* Claim / bid form */}
              {canClaim && isOpen && !alreadyDone && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-text-primary text-sm">
                    {isBid ? 'Submit your bid' : 'Claim this listing'}
                  </h3>
                  {isBid && <p className="text-xs text-text-muted">Your bid is sealed — only the generator sees it.</p>}

                  {/* Financial direction */}
                  <div className="space-y-2">
                    {Object.entries(FINANCIAL_DIRECTIONS).map(([key, fd]) => (
                      <label key={key} className={cn(
                        'flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-sm transition-colors',
                        bidDirection === key ? 'border-brand-forest bg-brand-forest/5' : 'border-surface-border hover:border-brand-forest/30'
                      )}>
                        <input type="radio" name="bd" value={key} checked={bidDirection === key} onChange={() => setBidDirection(key)} className="mt-0.5 accent-brand-forest" />
                        <div>
                          <div className="font-medium text-text-primary leading-none">{fd.label}</div>
                          <div className="text-xs text-text-muted mt-0.5">{fd.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {bidDirection !== 'free' && (
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">Amount (LKR, optional)</label>
                      <input type="number" value={bidPrice} onChange={e => setBidPrice(e.target.value)} min="0" placeholder="0.00"
                        className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Proposed pickup date (optional)</label>
                    <input type="date" value={bidDate} onChange={e => setBidDate(e.target.value)} min={new Date().toISOString().slice(0,10)}
                      className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Note to generator (optional)</label>
                    <textarea value={bidNote} onChange={e => setBidNote(e.target.value)} rows={3}
                      placeholder="Brief intro, certifications, questions..."
                      className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition resize-none" />
                  </div>

                  {claimErr && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{claimErr}
                    </div>
                  )}

                  <button onClick={submitClaim} disabled={claiming}
                    className="w-full py-2.5 bg-brand-forest text-white font-medium rounded-xl hover:bg-brand-moss disabled:opacity-50 transition text-sm flex items-center justify-center gap-2">
                    {claiming
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                      : isBid
                        ? <><Gavel className="w-4 h-4" /> Submit bid</>
                        : <><CheckCircle className="w-4 h-4" /> Claim listing</>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function MetaRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-text-primary font-medium">{value}</p>
      </div>
    </div>
  )
}
