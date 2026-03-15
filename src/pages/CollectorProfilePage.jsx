import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, Globe, Phone, MapPin, CheckCircle, Loader2,
  Shield, Award, Lock, Monitor, Gem, Truck, FileCheck
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import StatusBadge from '../components/shared/StatusBadge'
import { supabase } from '../lib/supabase'
import { WASTE_STREAMS } from '../lib/constants'

const BADGE_CONFIG = {
  basel_certified:           { label: 'Basel Convention Certified',  icon: Globe,      color: 'bg-blue-50   text-blue-700   border-blue-200'   },
  data_destruction_certified:{ label: 'Data Destruction Certified',  icon: Lock,       color: 'bg-purple-50 text-purple-700 border-purple-200' },
  crt_capable:               { label: 'CRT / Mercury Handling',      icon: Monitor,    color: 'bg-amber-50  text-amber-700  border-amber-200'  },
  precious_metal_recovery:   { label: 'Precious Metal Recovery',     icon: Gem,        color: 'bg-amber-50  text-amber-700  border-amber-200'  },
  iso_14001:                 { label: 'ISO 14001 Certified',         icon: Award,      color: 'bg-teal-50   text-teal-700   border-teal-200'   },
  doorstep_pickup:           { label: 'Campus Doorstep Pickup',      icon: Truck,      color: 'bg-green-50  text-green-700  border-green-200'  },
  issues_destruction_cert:   { label: 'Issues Destruction Certs.',   icon: FileCheck,  color: 'bg-blue-50   text-blue-700   border-blue-200'   },
  handles_hazardous:         { label: 'Handles Hazardous Waste',     icon: Shield,     color: 'bg-red-50    text-red-700    border-red-200'    },
}

export default function CollectorProfilePage() {
  const { id } = useParams()
  const [collector, setCollector] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase
        .from('collectors')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .eq('status', 'approved')  // only show approved collectors publicly
        .single()
      setCollector(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-forest" />
      </div>
    </div>
  )

  if (!collector) return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-brand-bark mb-3">Collector not found</h1>
        <Link to="/board" className="text-sm text-brand-forest hover:underline">Back to board</Link>
      </div>
    </div>
  )

  const badges = Object.entries(BADGE_CONFIG).filter(([key]) => {
    if (key === 'handles_hazardous') return collector.handles_hazardous
    return collector[key] === true
  })

  const streams = (collector.accepted_streams ?? []).map(s => WASTE_STREAMS[s]?.label ?? s)

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/board" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-forest mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to board
        </Link>

        {/* Header */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 mb-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="font-display text-2xl text-brand-bark">{collector.company_name}</h1>
              {collector.contact_person && (
                <p className="text-text-muted text-sm mt-0.5">Contact: {collector.contact_person}</p>
              )}
            </div>
            <StatusBadge status={collector.status} />
          </div>

          <div className="space-y-2 text-sm">
            {collector.service_area && (
              <div className="flex items-center gap-2 text-text-muted">
                <MapPin className="w-4 h-4 shrink-0" />
                {collector.service_area}
              </div>
            )}
            {collector.website && (
              <div className="flex items-center gap-2 text-text-muted">
                <Globe className="w-4 h-4 shrink-0" />
                <a href={collector.website.startsWith('http') ? collector.website : `https://${collector.website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-brand-forest hover:underline truncate">
                  {collector.website}
                </a>
              </div>
            )}
          </div>

          {collector.description && (
            <p className="mt-4 pt-4 border-t border-surface-border text-sm text-text-primary leading-relaxed">
              {collector.description}
            </p>
          )}
        </div>

        {/* CEA License */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">CEA License</p>
              <p className="font-mono text-sm font-medium text-text-primary">{collector.cea_license}</p>
            </div>
            {collector.cea_verified && (
              <div className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Verified
              </div>
            )}
          </div>
        </div>

        {/* Accepted streams */}
        {streams.length > 0 && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-5">
            <h3 className="font-semibold text-text-primary mb-3 text-sm">Accepted waste streams</h3>
            <div className="flex flex-wrap gap-2">
              {streams.map(s => (
                <span key={s} className="px-3 py-1.5 bg-brand-cream border border-surface-border text-text-primary text-xs rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <h3 className="font-semibold text-text-primary mb-3 text-sm">Certifications & capabilities</h3>
            <div className="flex flex-col gap-2.5">
              {badges.map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <div key={key} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${cfg.color}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {cfg.label}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
