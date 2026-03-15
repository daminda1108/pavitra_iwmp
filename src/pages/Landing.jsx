import { Link } from 'react-router-dom'
import {
  ArrowRight, Leaf, ClipboardList, UserCheck, FileCheck,
  ShieldCheck, Globe, Lock, Truck, Gem, Award
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  {
    n: '01',
    title: 'Post a waste listing',
    desc: 'Department coordinators and lab managers post surplus or waste materials with full details — stream, quantity, hazard level, and preferred pickup schedule.',
    icon: ClipboardList,
  },
  {
    n: '02',
    title: 'Collectors claim or bid',
    desc: 'CEA-licensed waste collectors browse the board and claim listings instantly, or submit competitive sealed bids for high-value material batches.',
    icon: UserCheck,
  },
  {
    n: '03',
    title: 'Coordinate & confirm',
    desc: 'Generator and collector confirm the pickup appointment. Completion requires mutual sign-off, ensuring nothing slips through the cracks.',
    icon: ShieldCheck,
  },
  {
    n: '04',
    title: 'Waste Transfer Record generated',
    desc: 'A PDF Waste Transfer Record (WTR) is automatically generated and stored — ready for CEA inspections, department records, and sustainability reports.',
    icon: FileCheck,
  },
]

const FEATURES = [
  {
    title: 'CEA compliance built in',
    desc: 'Every listing captures the data required for Sri Lanka CEA hazardous waste manifests. License verification, WTR generation, and destruction certificates all included.',
    icon: ShieldCheck,
    color: 'text-brand-forest',
    bg:   'bg-green-50',
  },
  {
    title: 'Bidding for valuable material',
    desc: 'Post e-waste, precious metals, or chemical batches as sealed-bid auctions. Collectors compete — generators choose the best offer.',
    icon: Gem,
    color: 'text-amber-600',
    bg:   'bg-amber-50',
  },
  {
    title: 'Full audit trail',
    desc: 'Every status change, bid, and confirmation is timestamped and stored. A clean record for every waste stream across every department.',
    icon: ClipboardList,
    color: 'text-blue-600',
    bg:   'bg-blue-50',
  },
]

const COLLECTORS = [
  {
    name:    'Ceylon Waste Management',
    tagline: 'Largest licensed e-waste recycler in Sri Lanka',
    badges:  ['Basel certified', 'Precious metals', 'ISO 14001'],
    icon:    Globe,
  },
  {
    name:    'Green Links Lanka',
    tagline: 'Pioneer in responsible e-waste management',
    badges:  ['CRT / Mercury handling', 'Campus doorstep pickup', 'Destruction certs'],
    icon:    Leaf,
  },
  {
    name:    'INSEE Ecocycle',
    tagline: 'Handles chemical + hazardous waste',
    badges:  ['Basel certified', 'ISO 14001', 'Hazardous waste licensed'],
    icon:    Award,
  },
]

export default function Landing() {
  const { user, profile } = useAuth()

  const dashboardPath = {
    generator:     '/dashboard',
    collector:     '/collector',
    admin:         '/admin',
    platform_admin:'/admin',
  }[profile?.role]

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-forest/10 via-transparent to-brand-sage/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-forest/10 text-brand-forest text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Leaf className="w-3.5 h-3.5" />
            Pilot — University of Peradeniya
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-brand-bark leading-tight mb-6">
            Institutional waste,<br />
            <span className="text-brand-forest">properly handled.</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Pavitra connects university departments with CEA-licensed waste collectors.
            List surplus chemicals, e-waste, and lab materials — and track every pickup to a verified Waste Transfer Record.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to={dashboardPath ?? '/board'}
                className="inline-flex items-center gap-2 bg-brand-forest text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-moss transition-colors">
                Go to dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/board"
                  className="inline-flex items-center gap-2 bg-brand-forest text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-moss transition-colors">
                  Browse listings <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center gap-2 bg-white border border-surface-border text-text-primary px-6 py-3 rounded-xl font-medium hover:border-brand-forest/40 transition-colors">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-surface-border py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-brand-bark mb-3">How it works</h2>
            <p className="text-text-muted max-w-xl mx-auto">From listing to legal compliance in four steps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(s => {
              const Icon = s.icon
              return (
                <div key={s.n} className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-xs font-bold text-brand-forest bg-brand-forest/10 px-2 py-0.5 rounded-md">
                      {s.n}
                    </span>
                    <Icon className="w-4 h-4 text-text-muted" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2 text-sm">{s.title}</h3>
                  <p className="text-text-muted text-xs leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-brand-bark mb-3">Built for compliance</h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Designed around Sri Lanka's CEA requirements and real university workflows.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-surface-card border border-surface-border rounded-2xl p-6">
                  <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2 text-sm">{f.title}</h3>
                  <p className="text-text-muted text-xs leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Verified collectors */}
      <section className="bg-white border-t border-surface-border py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-brand-bark mb-3">Verified collectors</h2>
            <p className="text-text-muted max-w-xl mx-auto">
              CEA-licensed waste management companies already active on the platform.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {COLLECTORS.map(c => {
              const Icon = c.icon
              return (
                <div key={c.name} className="bg-brand-cream border border-surface-border rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-brand-forest/10 rounded-xl flex items-center justify-center">
                      <Icon className="w-4 h-4 text-brand-forest" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-text-primary">{c.name}</p>
                      <p className="text-xs text-text-muted">{c.tagline}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.badges.map(b => (
                      <span key={b} className="text-xs bg-white border border-surface-border text-text-muted px-2 py-0.5 rounded-full">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-center text-xs text-text-muted mt-6">
            All collectors verified for CEA licensing before access is granted.{' '}
            <Link to="/register/collector" className="text-brand-forest hover:underline">Apply to join →</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl text-brand-bark mb-4">Ready to list your first batch?</h2>
          <p className="text-text-muted mb-8">
            University departments can post waste listings once authorised by a department coordinator.
            Contact your department's waste coordinator or email us to get started.
          </p>
          <Link to="/board"
            className="inline-flex items-center gap-2 bg-brand-forest text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-moss transition-colors">
            View the waste board <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-forest rounded-md flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-semibold text-brand-bark text-sm">Pavitra</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/board" className="hover:text-text-primary transition-colors">Waste Board</Link>
            <Link to="/wanted" className="hover:text-text-primary transition-colors">Buyers Seeking</Link>
            <Link to="/login" className="hover:text-text-primary transition-colors">Sign In</Link>
          </div>
          <p>Pilot programme — University of Peradeniya © 2025</p>
        </div>
      </footer>
    </div>
  )
}
