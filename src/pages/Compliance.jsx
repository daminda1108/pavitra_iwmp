import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Globe, BookOpen, CheckSquare, Square,
  ExternalLink, ChevronDown, ChevronUp, AlertTriangle, FileText
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'

const CEA_REGS = [
  { title: 'National Environmental Act No. 47 of 1980', desc: 'The primary environmental legislation in Sri Lanka. Establishes the Central Environmental Authority (CEA) and its mandate to regulate waste and pollution.' },
  { title: 'Environmental Protection Licence (EPL)', desc: 'Any facility generating scheduled (hazardous) waste above threshold quantities must hold a valid EPL. Universities generating chemical, e-waste, or biological waste may require an EPL.' },
  { title: 'Scheduled Waste Regulations (Gazette No. 595/16)', desc: 'Lists categories of waste requiring special handling, manifesting, and licensed disposal — including laboratory chemicals, solvents, heavy metals, and e-waste.' },
  { title: 'National Cleaner Production Policy', desc: 'Encourages waste minimisation at source, substitution of hazardous materials, and extended producer responsibility for e-waste.' },
]

const BASEL_ITEMS = [
  { title: 'What the Basel Convention covers', desc: 'Controls transboundary movements of hazardous waste. Sri Lanka ratified the Convention in 1992. Any export of e-waste or chemical waste to a third country requires Prior Informed Consent (PIC) from the importing country.' },
  { title: 'Certified handlers required', desc: 'E-waste exported or processed must be handled by Basel Convention-certified facilities. All collectors on this platform are verified for CEA licensing — check the Buyers Seeking board for Basel-certified collectors.' },
  { title: 'E-waste as Basel Annex IX waste', desc: 'Non-hazardous e-waste destined for recycling is listed in Annex IX (B1110). It can move freely between countries with appropriate documentation. Hazardous fractions (CRTs, PCBs, batteries) fall under Annex VIII and require full PIC procedures.' },
]

const UOP_POLICIES = [
  { title: 'UoP Environmental Health & Safety Policy', desc: 'Requires all faculties to conduct annual waste audits, maintain waste registers, and train departmental waste coordinators.' },
  { title: 'Faculty of Science Chemical Safety Protocol', desc: 'Specific to laboratory chemicals — outlines SDS requirements, incompatibility rules, storage standards, and disposal workflow using the IWMP platform.' },
  { title: 'IT Asset Disposal Policy', desc: 'All end-of-life IT assets must be processed through the IT Division. Data destruction certification is mandatory before disposal.' },
  { title: 'Cafeteria Waste Management', desc: 'Cafeteria operators are required to segregate food waste from packaging and present organic waste to the composting facility or approved collector.' },
]

const CHECKLIST_ITEMS = [
  'I have identified the correct waste stream (chemical, e-waste, organic, plastic, or general)',
  'The waste is properly packaged in an appropriate container (original or UN-approved)',
  'All containers are clearly labelled with: waste type, hazard class, quantity, date, and generator name',
  'Incompatible materials are segregated (acids from bases, oxidisers from flammables)',
  'Data-bearing devices have been sanitised and a Data Destruction Certificate obtained',
  'I have assessed the hazard level accurately (non-hazardous, low, medium, or high)',
  'My department coordinator has been notified and has approved the disposal',
  'I have read the applicable waste handling guideline for this waste stream',
  'The waste is stored safely while awaiting collection (no unauthorised access)',
  'I will confirm the pickup with the collector and complete the mutual sign-off on the platform',
]

const USEFUL_LINKS = [
  { label: 'Central Environmental Authority (CEA)', url: 'https://www.cea.lk', desc: 'Official regulator — EPL applications, scheduled waste guidance, fee schedules' },
  { label: 'Ministry of Environment (MEPA)', url: 'https://www.environment.gov.lk', desc: 'Policy, national action plans, and gazette notifications' },
  { label: 'Basel Convention Secretariat', url: 'https://www.basel.int', desc: 'PIC procedures, Annex classifications, country-specific guidance' },
  { label: 'UoP Environmental Health & Safety Office', url: 'https://www.pdn.ac.lk', desc: 'Internal policy documents, spill response contact, training schedule' },
]

function AccordionItem({ title, desc }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-surface-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-surface-muted hover:bg-surface-border/50 transition-colors">
        <span className="text-sm font-medium text-text-primary">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
      </button>
      {open && <div className="px-4 py-3 text-xs text-text-muted leading-relaxed bg-white">{desc}</div>}
    </div>
  )
}

function ChecklistItem({ text, checked, toggle }) {
  return (
    <button onClick={toggle}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-surface-muted transition-colors text-left group">
      {checked
        ? <CheckSquare className="w-4 h-4 text-brand-forest mt-0.5 shrink-0" />
        : <Square className="w-4 h-4 text-text-muted mt-0.5 shrink-0 group-hover:text-brand-forest transition-colors" />
      }
      <span className={`text-xs leading-relaxed ${checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>{text}</span>
    </button>
  )
}

export default function Compliance() {
  const [checks, setChecks] = useState(Array(CHECKLIST_ITEMS.length).fill(false))
  const allDone = checks.every(Boolean)
  const doneCount = checks.filter(Boolean).length

  function toggle(i) {
    setChecks(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-forest/10 text-brand-forest text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Regulatory Compliance Hub
          </div>
          <h1 className="font-display text-4xl text-brand-bark mb-3">Regulatory Compliance</h1>
          <p className="text-text-muted text-base leading-relaxed max-w-2xl">
            Overview of applicable regulations, institutional policies, and compliance requirements for waste management at the University of Peradeniya.
            Use the pre-listing checklist to ensure compliance before posting.
          </p>
          <div className="mt-4 text-xs text-text-muted">
            Last updated: March 2025 · For waste handling procedures, see the{' '}
            <Link to="/guidelines" className="text-brand-forest hover:underline">Guidelines page</Link>.
          </div>
        </div>

        <div className="space-y-8">

          {/* CEA Regulations */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-forest/10 rounded-xl flex items-center justify-center">
                <FileText className="w-4 h-4 text-brand-forest" />
              </div>
              <h2 className="font-display text-xl text-brand-bark">CEA Regulations</h2>
            </div>
            <div className="space-y-2">
              {CEA_REGS.map(r => <AccordionItem key={r.title} title={r.title} desc={r.desc} />)}
            </div>
          </section>

          {/* Basel Convention */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-display text-xl text-brand-bark">Basel Convention</h2>
            </div>
            <div className="space-y-2">
              {BASEL_ITEMS.map(r => <AccordionItem key={r.title} title={r.title} desc={r.desc} />)}
            </div>
          </section>

          {/* Institutional Policies */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-sage/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-brand-amber" />
              </div>
              <h2 className="font-display text-xl text-brand-bark">UoP Institutional Policies</h2>
            </div>
            <div className="space-y-2">
              {UOP_POLICIES.map(r => <AccordionItem key={r.title} title={r.title} desc={r.desc} />)}
            </div>
          </section>

          {/* Pre-listing checklist */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="font-display text-xl text-brand-bark">Pre-Listing Compliance Checklist</h2>
              </div>
              <span className="text-xs text-text-muted bg-surface-muted px-3 py-1 rounded-full">
                {doneCount}/{CHECKLIST_ITEMS.length} complete
              </span>
            </div>
            <div className="bg-white border border-surface-border rounded-2xl p-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <ChecklistItem key={i} text={item} checked={checks[i]} toggle={() => toggle(i)} />
              ))}
            </div>
            {allDone && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">All compliance checks passed</p>
                  <p className="text-xs text-green-600 mt-0.5">You're ready to post a waste listing on the platform.</p>
                </div>
                <Link to="/dashboard/new"
                  className="ml-auto shrink-0 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                  Post now
                </Link>
              </div>
            )}
          </section>

          {/* Useful links */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-text-muted" />
              </div>
              <h2 className="font-display text-xl text-brand-bark">Useful Links</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {USEFUL_LINKS.map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col gap-1 p-4 bg-white border border-surface-border rounded-xl hover:border-brand-forest/40 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-brand-forest group-hover:underline">{l.label}</span>
                    <ExternalLink className="w-3 h-3 text-text-muted" />
                  </div>
                  <p className="text-xs text-text-muted">{l.desc}</p>
                </a>
              ))}
            </div>
          </section>

          {/* Warning box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              <strong>Non-compliance consequences:</strong> Failure to comply with CEA regulations can result in fines, suspension of the EPL, and personal liability for faculty staff.
              If you are uncertain about how to classify or handle waste, contact the <strong>Faculty Safety Officer</strong> before proceeding.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
