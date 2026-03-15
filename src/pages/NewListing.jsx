import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check, Search, X, Loader2,
  AlertCircle, FlaskConical, Monitor, Leaf, Package, FileText, Trash2,
  Upload, Image as ImageIcon
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import HazardBadge from '../components/shared/HazardBadge'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { cn, formatDate } from '../lib/utils'
import {
  WASTE_STREAMS, EWASTE_DEVICE_CATEGORIES, HAZARD_LEVELS,
  UNITS, PICKUP_WINDOWS, FREQUENCIES, DAYS_OF_WEEK,
  FINANCIAL_HINTS
} from '../lib/constants'

// ── Step indicator ────────────────────────────────────────────────────────
const STEPS = ['Material', 'Details', 'Schedule', 'Submit']

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              i < current  ? 'bg-brand-forest text-white' :
              i === current ? 'bg-brand-forest text-white ring-4 ring-brand-forest/20' :
                             'bg-surface-muted text-text-muted'
            )}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn('text-xs hidden sm:block', i === current ? 'text-brand-forest font-medium' : 'text-text-muted')}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('h-px flex-1 mx-2 mb-4', i < current ? 'bg-brand-forest' : 'bg-surface-border')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Stream icon map ────────────────────────────────────────────────────────
const STREAM_ICONS = {
  organic:  Leaf,
  plastic:  Package,
  paper:    FileText,
  ewaste:   Monitor,
  chemical: FlaskConical,
  general:  Trash2,
}

// ── Main wizard ────────────────────────────────────────────────────────────
export default function NewListing() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [step,      setStep]      = useState(0)
  const [generator, setGenerator] = useState(null)
  const [locations, setLocations] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Step 1 — Material
  const [searchQuery,    setSearchQuery]    = useState('')
  const [searchResults,  setSearchResults]  = useState([])
  const [searching,      setSearching]      = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const searchDebounce = useRef(null)

  const [wasteStream,    setWasteStream]    = useState('')
  const [subcategory,    setSubcategory]    = useState('')
  const [materialName,   setMaterialName]   = useState('')
  const [materialLibId,  setMaterialLibId]  = useState(null)

  // Step 2 — Details
  const [quantity,       setQuantity]       = useState('')
  const [unit,           setUnit]           = useState('kg')
  const [hazardLevel,    setHazardLevel]    = useState('non_hazardous')
  const [handlingNotes,  setHandlingNotes]  = useState('')
  const [ewasteDevCats,  setEwasteDevCats]  = useState([])
  const [ewasteCount,    setEwasteCount]    = useState('')
  const [ewasteHasPCB,   setEwasteHasPCB]   = useState(false)
  const [ewasteDataBear, setEwasteDataBear] = useState(false)
  const [ewasteCondition, setEwasteCondition] = useState('')

  // Step 3 — Schedule
  const [campusLocation, setCampusLocation] = useState('')
  const [labName,        setLabName]        = useState('')
  const [pickupType,     setPickupType]     = useState('one_time')
  const [pickupDate,     setPickupDate]     = useState('')
  const [pickupWindow,   setPickupWindow]   = useState('')
  const [frequency,      setFrequency]      = useState('')
  const [preferredDays,  setPreferredDays]  = useState([])
  const [photos,         setPhotos]         = useState([])   // File[]
  const [photoUrls,      setPhotoUrls]      = useState([])   // uploaded URLs
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  // Step 4 — Submit
  const [authorizedByName,  setAuthorizedByName]  = useState('')
  const [authorizedByTitle, setAuthorizedByTitle] = useState('')
  const [claimMode,         setClaimMode]          = useState('quick_claim')
  const [bidDeadline,       setBidDeadline]        = useState('')
  const [financialHint,     setFinancialHint]      = useState('unknown')

  // ── Load generator + campus locations ────────────────────────────────────
  useEffect(() => {
    if (!user) return
    async function load() {
      const [genRes, locRes] = await Promise.all([
        supabase.from('generators').select('*, institutions(name)').eq('id', user.id).single(),
        supabase.from('campus_locations').select('id, name, zone').order('name'),
      ])
      if (genRes.data) {
        setGenerator(genRes.data)
        setLabName(genRes.data.lab_name ?? '')
      }
      setLocations(locRes.data ?? [])
    }
    load()
  }, [user])

  // ── Material search ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase.rpc('search_materials', {
        search_query:     searchQuery.trim(),
        p_institution_id: generator?.institution_id ?? null,
        p_waste_stream:   wasteStream || null,
        result_limit:     8,
      })
      setSearchResults(data ?? [])
      setSearching(false)
    }, 350)
  }, [searchQuery, generator, wasteStream])

  function applyMaterial(mat) {
    setSelectedMaterial(mat)
    setMaterialLibId(mat.id)
    setMaterialName(mat.name)
    setWasteStream(mat.waste_stream)
    setSubcategory(mat.subcategory ?? '')
    setHazardLevel(mat.default_hazard_level ?? 'non_hazardous')
    setHandlingNotes(mat.default_handling_notes ?? '')
    setUnit(mat.default_unit ?? 'kg')
    setSearchQuery('')
    setSearchResults([])
  }

  function clearMaterial() {
    setSelectedMaterial(null)
    setMaterialLibId(null)
    setMaterialName('')
  }

  // ── Photo upload ──────────────────────────────────────────────────────────
  async function handlePhotoSelect(e) {
    const files = Array.from(e.target.files).slice(0, 5 - photos.length)
    if (!files.length) return
    setPhotos(prev => [...prev, ...files])
    setUploadingPhotos(true)
    const uploaded = []
    for (const file of files) {
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage
        .from('listing-photos')
        .upload(path, file, { upsert: false })
      if (!error) {
        const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(data.path)
        uploaded.push(urlData.publicUrl)
      }
    }
    setPhotoUrls(prev => [...prev, ...uploaded])
    setUploadingPhotos(false)
  }

  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoUrls(prev => prev.filter((_, i) => i !== index))
  }

  // ── Validation per step ───────────────────────────────────────────────────
  function step0Valid() {
    return wasteStream !== ''
  }

  function step1Valid() {
    if (!quantity || Number(quantity) <= 0) return false
    if (!unit) return false
    if (['medium','high'].includes(hazardLevel) && !handlingNotes.trim()) return false
    return true
  }

  function step2Valid() {
    if (!campusLocation) return false
    if (pickupType === 'one_time' && !pickupDate) return false
    if (pickupType === 'recurring' && (!frequency || preferredDays.length === 0)) return false
    return true
  }

  function step3Valid() {
    if (!authorizedByName.trim() || !authorizedByTitle.trim()) return false
    if (claimMode === 'open_bids' && !bidDeadline) return false
    return true
  }

  const canAdvance = [step0Valid, step1Valid, step2Valid, step3Valid][step]?.()

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitError(null)
    setSubmitting(true)

    const payload = {
      generator_id:          user.id,
      waste_stream:          wasteStream,
      subcategory:           subcategory   || null,
      material_library_id:   materialLibId || null,
      material_name:         materialName  || null,
      hazard_level:          hazardLevel,
      handling_notes:        handlingNotes || null,
      quantity:              Number(quantity),
      unit,
      campus_location:       campusLocation,
      lab_name:              labName       || null,
      pickup_type:           pickupType,
      pickup_date:           pickupType === 'one_time' ? pickupDate : null,
      pickup_window:         pickupType === 'one_time' ? pickupWindow : null,
      frequency:             pickupType === 'recurring' ? frequency : null,
      preferred_days:        pickupType === 'recurring' ? preferredDays : null,
      photos:                photoUrls.length ? photoUrls : null,
      authorized_by_name:    authorizedByName.trim(),
      authorized_by_title:   authorizedByTitle.trim(),
      claim_mode:            claimMode,
      bid_deadline:          claimMode === 'open_bids' ? bidDeadline : null,
      financial_hint:        financialHint,
      status:                generator?.is_authorized ? 'open' : 'open',
      // e-waste
      ewaste_device_categories:   wasteStream === 'ewaste' ? ewasteDevCats  : null,
      ewaste_item_count:          wasteStream === 'ewaste' ? (Number(ewasteCount) || null) : null,
      ewaste_has_pcb:             wasteStream === 'ewaste' ? ewasteHasPCB   : false,
      ewaste_data_bearing:        wasteStream === 'ewaste' ? ewasteDataBear : false,
      ewaste_condition:           wasteStream === 'ewaste' ? ewasteCondition : null,
    }

    const { data, error } = await supabase.from('listings').insert(payload).select('id').single()

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-forest mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <h1 className="font-display text-3xl text-brand-bark mb-2">Post Waste</h1>
        <p className="text-text-muted text-sm mb-8">
          Fill in the details so certified collectors can see and claim this listing.
        </p>

        <StepBar current={step} />

        {/* ── STEP 0: Material ──────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-brand-bark">What material are you disposing?</h2>

            {/* Search box */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Search material library
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="e.g. sulphuric acid, laptop, centrifuge…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                />
                {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-text-muted" />}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-surface-border rounded-xl bg-white shadow-sm overflow-hidden">
                  {searchResults.map(mat => (
                    <button
                      key={mat.id}
                      onClick={() => applyMaterial(mat)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-muted transition-colors text-left border-b border-surface-border last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text-primary leading-snug">{mat.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-muted capitalize">{mat.waste_stream}</span>
                          {mat.cas_number && <span className="text-xs text-text-muted">CAS {mat.cas_number}</span>}
                          {mat.source === 'institution' && (
                            <span className="text-xs bg-brand-cream text-brand-bark border border-surface-border px-1.5 py-0.5 rounded-full">
                              Institutional
                            </span>
                          )}
                        </div>
                      </div>
                      <HazardBadge level={mat.default_hazard_level} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected material chip */}
            {selectedMaterial && (
              <div className="flex items-center gap-2 bg-brand-forest/5 border border-brand-forest/20 text-brand-forest rounded-xl px-4 py-2.5">
                <Check className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium flex-1">{selectedMaterial.name}</span>
                <button onClick={clearMaterial} className="text-brand-forest/60 hover:text-brand-forest">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="border-t border-surface-border pt-6">
              <p className="text-xs text-text-muted mb-4 uppercase tracking-wide font-medium">
                {selectedMaterial ? 'Confirm or change waste stream' : 'Or select manually'}
              </p>

              {/* Waste stream grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(WASTE_STREAMS).map(([key, stream]) => {
                  const Icon = STREAM_ICONS[key] ?? Package
                  return (
                    <button
                      key={key}
                      onClick={() => { setWasteStream(key); setSubcategory('') }}
                      className={cn(
                        'flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-colors',
                        wasteStream === key
                          ? 'border-brand-forest bg-brand-forest/5 text-brand-forest'
                          : 'border-surface-border bg-white text-text-muted hover:border-brand-forest/40 hover:bg-surface-muted'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium leading-tight">{stream.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Subcategory */}
            {wasteStream && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Subcategory <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <select
                  value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                >
                  <option value="">— Select subcategory —</option>
                  {WASTE_STREAMS[wasteStream]?.subcategories.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Material name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Material name / description{' '}
                <span className="text-text-muted font-normal">(shown on listing card)</span>
              </label>
              <input
                type="text"
                value={materialName}
                onChange={e => setMaterialName(e.target.value)}
                placeholder="e.g. Sulphuric Acid H₂SO₄ 98% — 10 L batch"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
              />
            </div>
          </div>
        )}

        {/* ── STEP 1: Details ───────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-brand-bark">Quantity & hazard details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  min="0.01"
                  step="any"
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Hazard level */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Hazard level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(HAZARD_LEVELS).map(([key, h]) => {
                  const allowed = WASTE_STREAMS[wasteStream]?.hazardAllowed ?? Object.keys(HAZARD_LEVELS)
                  const disabled = !allowed.includes(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={disabled}
                      onClick={() => setHazardLevel(key)}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm transition-colors',
                        hazardLevel === key
                          ? 'border-brand-forest bg-brand-forest/5 text-brand-forest font-medium'
                          : 'border-surface-border bg-white text-text-muted hover:border-brand-forest/40',
                        disabled && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <HazardBadge level={key} className="pointer-events-none" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Handling notes */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Handling notes{' '}
                {['medium','high'].includes(hazardLevel)
                  ? <span className="text-red-500">* required for this hazard level</span>
                  : <span className="text-text-muted font-normal">(optional)</span>
                }
              </label>
              <textarea
                value={handlingNotes}
                onChange={e => setHandlingNotes(e.target.value)}
                rows={3}
                placeholder="Storage conditions, safety precautions, packaging details…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition resize-none"
              />
            </div>

            {/* E-waste extra fields */}
            {wasteStream === 'ewaste' && (
              <div className="border border-brand-forest/20 bg-brand-forest/5 rounded-xl p-5 space-y-5">
                <h3 className="font-medium text-brand-forest text-sm">E-waste details</h3>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Device categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EWASTE_DEVICE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEwasteDevCats(prev =>
                          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                        )}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs border transition-colors',
                          ewasteDevCats.includes(cat)
                            ? 'bg-brand-forest text-white border-brand-forest'
                            : 'bg-white text-text-muted border-surface-border hover:border-brand-forest/40'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Item count
                    </label>
                    <input
                      type="number"
                      value={ewasteCount}
                      onChange={e => setEwasteCount(e.target.value)}
                      min="1"
                      placeholder="e.g. 12"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Condition
                    </label>
                    <select
                      value={ewasteCondition}
                      onChange={e => setEwasteCondition(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                    >
                      <option value="">— Select —</option>
                      {['Good', 'Fair', 'Poor', 'Non-functional'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ewasteHasPCB}
                      onChange={e => setEwasteHasPCB(e.target.checked)}
                      className="w-4 h-4 rounded border-surface-border text-brand-forest accent-brand-forest"
                    />
                    <span className="text-sm text-text-primary">
                      Contains PCBs (printed circuit boards)
                      <span className="text-text-muted"> — Basel-certified collector required</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ewasteDataBear}
                      onChange={e => setEwasteDataBear(e.target.checked)}
                      className="w-4 h-4 rounded border-surface-border text-brand-forest accent-brand-forest"
                    />
                    <span className="text-sm text-text-primary">
                      Data-bearing devices (HDDs, SSDs, phones)
                      <span className="text-text-muted"> — data destruction certificate required</span>
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Schedule & Location ───────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-brand-bark">Location & pickup schedule</h2>

            {/* Campus location */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Campus location <span className="text-red-500">*</span>
              </label>
              <select
                value={campusLocation}
                onChange={e => setCampusLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
              >
                <option value="">— Select location —</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Lab name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Lab / room name <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={labName}
                onChange={e => setLabName(e.target.value)}
                placeholder="e.g. Analytical Chemistry Lab, Room 203"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
              />
            </div>

            {/* Pickup type toggle */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Pickup type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[
                  { val: 'one_time',  label: 'One-time'  },
                  { val: 'recurring', label: 'Recurring' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setPickupType(opt.val)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      pickupType === opt.val
                        ? 'border-brand-forest bg-brand-forest/5 text-brand-forest'
                        : 'border-surface-border bg-white text-text-muted hover:border-brand-forest/40'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {pickupType === 'one_time' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Preferred date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    min={new Date().toISOString().slice(0,10)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Time window
                  </label>
                  <select
                    value={pickupWindow}
                    onChange={e => setPickupWindow(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                  >
                    <option value="">Any time</option>
                    {PICKUP_WINDOWS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
            )}

            {pickupType === 'recurring' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Frequency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                  >
                    <option value="">— Select —</option>
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Preferred days <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setPreferredDays(prev =>
                          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                        )}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs border transition-colors',
                          preferredDays.includes(day)
                            ? 'bg-brand-forest text-white border-brand-forest'
                            : 'bg-white text-text-muted border-surface-border hover:border-brand-forest/40'
                        )}
                      >
                        {day.slice(0,3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Photos <span className="text-text-muted font-normal">(up to 5, optional)</span>
              </label>

              {photos.length < 5 && (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-surface-border rounded-xl p-6 cursor-pointer hover:border-brand-forest/40 hover:bg-surface-muted transition-colors">
                  <Upload className="w-6 h-6 text-text-muted" />
                  <span className="text-sm text-text-muted">
                    {uploadingPhotos ? 'Uploading…' : 'Click to add photos'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                </label>
              )}

              {photos.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {photos.map((file, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-surface-border bg-surface-muted">
                      {photoUrls[i] ? (
                        <img src={photoUrls[i]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-text-muted" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Authorization & Submit ────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-brand-bark">Authorization & claim settings</h2>

            {/* Authorization */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
              <p className="text-sm text-amber-800 font-medium">
                This listing must be authorized by a department head or lab supervisor.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Authorized by (name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={authorizedByName}
                    onChange={e => setAuthorizedByName(e.target.value)}
                    placeholder="Prof. W. D. Rajapaksa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Title / position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={authorizedByTitle}
                    onChange={e => setAuthorizedByTitle(e.target.value)}
                    placeholder="Head of Department"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition"
                  />
                </div>
              </div>
            </div>

            {/* Claim mode */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                How should collectors claim this listing?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    val: 'quick_claim',
                    label: 'Quick claim',
                    desc: 'First collector to claim wins. Fastest — ideal for standard waste.',
                  },
                  {
                    val: 'open_bids',
                    label: 'Open bids',
                    desc: 'Collectors submit sealed offers. You review and choose. Ideal for valuable material.',
                  },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setClaimMode(opt.val)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-colors',
                      claimMode === opt.val
                        ? 'border-brand-forest bg-brand-forest/5'
                        : 'border-surface-border bg-white hover:border-brand-forest/40'
                    )}
                  >
                    <div className={cn('text-sm font-medium mb-1', claimMode === opt.val ? 'text-brand-forest' : 'text-text-primary')}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-text-muted leading-snug">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {claimMode === 'open_bids' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Bid deadline <span className="text-red-500">*</span>
                  <span className="text-text-muted font-normal"> (soft — collectors are notified)</span>
                </label>
                <input
                  type="datetime-local"
                  value={bidDeadline}
                  onChange={e => setBidDeadline(e.target.value)}
                  min={new Date().toISOString().slice(0,16)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest transition"
                />
              </div>
            )}

            {/* Financial hint */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Financial expectation <span className="text-text-muted font-normal">(hint only — not binding)</span>
              </label>
              <div className="space-y-2">
                {Object.entries(FINANCIAL_HINTS).map(([key, hint]) => (
                  <label key={key} className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    financialHint === key
                      ? 'border-brand-forest bg-brand-forest/5'
                      : 'border-surface-border bg-white hover:border-brand-forest/40'
                  )}>
                    <input
                      type="radio"
                      name="financial_hint"
                      value={key}
                      checked={financialHint === key}
                      onChange={() => setFinancialHint(key)}
                      className="accent-brand-forest"
                    />
                    <span className="text-sm text-text-primary">{hint.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Review summary */}
            <div className="border border-surface-border rounded-xl overflow-hidden">
              <div className="bg-surface-muted px-4 py-3 border-b border-surface-border">
                <h3 className="text-sm font-semibold text-text-primary">Review before posting</h3>
              </div>
              <div className="px-4 py-4 space-y-2 text-sm">
                <Row label="Material"  value={materialName || subcategory || wasteStream} />
                <Row label="Stream"    value={WASTE_STREAMS[wasteStream]?.label ?? wasteStream} />
                <Row label="Quantity"  value={`${quantity} ${unit}`} />
                <Row label="Hazard"    value={HAZARD_LEVELS[hazardLevel]?.label} />
                <Row label="Location"  value={campusLocation} />
                {labName && <Row label="Lab" value={labName} />}
                <Row label="Pickup"    value={pickupType === 'one_time'
                  ? `${formatDate(pickupDate)}${pickupWindow ? ` · ${pickupWindow}` : ''}`
                  : `${frequency} · ${preferredDays.join(', ')}`}
                />
                <Row label="Claim mode" value={claimMode === 'quick_claim' ? 'Quick claim (FCFS)' : 'Open bids'} />
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation buttons ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-surface-border">
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-surface-border text-sm text-text-muted hover:text-text-primary hover:border-brand-forest/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-forest text-white font-medium rounded-xl hover:bg-brand-moss disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canAdvance || submitting}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-forest text-white font-medium rounded-xl hover:bg-brand-moss disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
              ) : (
                <><Check className="w-4 h-4" /> Post listing</>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-text-muted w-28 shrink-0">{label}</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  )
}
