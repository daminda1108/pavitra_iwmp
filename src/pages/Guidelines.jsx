import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FlaskConical, Monitor, Leaf, Package, Trash2, AlertTriangle,
  ChevronDown, ChevronUp, ShieldCheck, BookOpen, ArrowRight
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'

const SECTIONS = [
  {
    id: 'chemical',
    icon: FlaskConical,
    title: 'Chemical & Lab Waste',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    content: {
      overview: 'Chemical and laboratory waste requires careful segregation, labelling, and storage before disposal. Improper handling poses significant risks to health and the environment.',
      dos: [
        'Label all containers with chemical name, hazard class, date generated, and generator name',
        'Segregate incompatible chemicals (acids from bases, oxidisers from flammables)',
        'Store in secondary containment trays within a dedicated chemical waste store',
        'Use original containers or UN-approved chemical waste containers',
        'Complete the waste manifest before handing to a licensed collector',
        'Report spills immediately to the Faculty Safety Officer',
      ],
      donts: [
        'Do not mix different chemical waste streams in a single container',
        'Do not pour chemical waste down laboratory sinks',
        'Do not store chemical waste for more than 90 days without disposal',
        'Do not leave unlabelled containers even temporarily',
      ],
      ppe: ['Chemical-resistant gloves (nitrile or neoprene)', 'Lab coat / chemical-resistant apron', 'Safety goggles (splash-proof)', 'Closed-toe shoes', 'Fume hood use for volatile chemicals'],
      regulations: ['CEA National Environmental Act No. 47 of 1980', 'CEA Scheduled Waste Regulations', 'Basel Convention (for export of hazardous waste)', 'UoP Faculty of Science Chemical Safety Policy'],
    }
  },
  {
    id: 'ewaste',
    icon: Monitor,
    title: 'Electronic Waste (E-Waste)',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    content: {
      overview: 'E-waste includes end-of-life computers, laboratory instruments, batteries, and other electronic equipment. Sri Lanka is a signatory to the Basel Convention, which governs transboundary movement of e-waste.',
      dos: [
        'Catalogue all e-waste with asset tag, device type, model, and serial number',
        'Perform data destruction (degaussing or physical destruction) before disposal of data-bearing devices',
        'Obtain a Data Destruction Certificate for all storage media',
        'Use only Basel Convention-certified collectors (Green Links Lanka, Ceylon Waste Management)',
        'Segregate batteries separately — lithium, lead-acid, and NiMH require different handling',
        'Remove and segregate ink cartridges / toner from printers before handing over',
      ],
      donts: [
        'Do not place e-waste in general waste bins',
        'Do not remove components (RAM, HDD) before cataloguing — collectors need full units',
        'Do not allow uncertified handlers to collect e-waste',
        'Do not crush or puncture batteries',
      ],
      ppe: ['Anti-static wrist strap (for PCB handling)', 'Cut-resistant gloves (for CRT screens)', 'Dust mask (for CRT/monitor disassembly)', 'Safety goggles'],
      regulations: ['Basel Convention on the Control of Transboundary Movements of Hazardous Wastes', 'CEA E-Waste Regulations (Schedule I)', 'Sri Lanka National E-Waste Policy 2018', 'UoP IT Asset Disposal Policy'],
    }
  },
  {
    id: 'organic',
    icon: Leaf,
    title: 'Organic / Food Waste',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    content: {
      overview: 'Organic waste from university cafeterias, gardens, and non-infectious lab material can often be composted or collected for biogas generation. Contamination with non-organic waste reduces its recyclability.',
      dos: [
        'Segregate food scraps into designated green bins immediately',
        'Drain excess liquid before placing food waste in bins',
        'Compost garden and green waste where composting facilities exist on campus',
        'Label lab-origin organic waste (e.g., culture media) and treat as biohazard if applicable',
        'Schedule regular collections to prevent odour and pest issues',
      ],
      donts: [
        'Do not mix packaging, plastics, or metals with organic waste',
        'Do not include microbiological culture waste without prior inactivation (autoclave)',
        'Do not compact organic waste tightly in bins — airflow is needed',
      ],
      ppe: ['Gloves (latex or nitrile)', 'Apron', 'Closed-toe shoes'],
      regulations: ['CEA National Environmental Act — solid waste provisions', 'Local Authority solid waste by-laws (Kandy Municipal Council)', 'UoP Cafeteria Waste Management Guidelines'],
    }
  },
  {
    id: 'plastic',
    icon: Package,
    title: 'Plastic & Recyclables',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    content: {
      overview: 'Plastic waste from labs and offices must be segregated by resin type where possible. Contaminated lab plastics (reagent bottles with residues) require decontamination before disposal as recyclables.',
      dos: [
        'Rinse and dry plastic bottles before placing in recycling bins',
        'Sort by resin code (PET #1, HDPE #2) where separate bins are available',
        'Crush PET bottles to reduce volume',
        'Decontaminate lab plastic consumables (pipette tips, tubes) by rinsing with appropriate solvent then water',
        'Place sharps in designated sharps containers — not in plastic recycling',
      ],
      donts: [
        'Do not include polystyrene foam (EPS) in plastic recycling',
        'Do not include contaminated lab plastics without decontamination',
        'Do not mix with food waste or chemical residues',
        'Do not include PVC unless specifically designated bin is available',
      ],
      ppe: ['Gloves', 'Apron for contaminated plastics'],
      regulations: ['CEA Plastic Waste Regulations', 'Central Environmental Authority (CEA) circular on single-use plastics', 'UoP Sustainability Policy'],
    }
  },
  {
    id: 'general',
    icon: Trash2,
    title: 'General Mixed Waste',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    content: {
      overview: 'General waste is the residual waste stream after recyclables, organic waste, and hazardous materials have been separated. Minimising general waste is a key sustainability goal for the university.',
      dos: [
        'Ensure all recyclable and hazardous items have been removed first',
        'Place in designated black bins',
        'Use compostable or minimal packaging where possible',
        'Report unusually large volumes to the Department Administrator for special collection',
      ],
      donts: [
        'Do not place hazardous materials in general waste',
        'Do not overfill bins beyond their rated capacity',
        'Do not dump waste in corridors, stairwells, or non-designated areas',
      ],
      ppe: ['Gloves for handling bulk waste', 'Closed-toe shoes'],
      regulations: ['Local Authority waste collection schedules', 'UoP Cleansing Services guidelines'],
    }
  },
  {
    id: 'hazardous',
    icon: AlertTriangle,
    title: 'Hazardous Materials — Emergency Procedures',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    content: {
      overview: 'In the event of a chemical spill, fire involving hazardous materials, or accidental release, follow the RACE protocol: Rescue, Alert, Contain, Evacuate. Do not attempt to contain major spills without proper training and PPE.',
      dos: [
        'ALERT — immediately notify lab supervisor and call UoP Security (+94 81 239 3000)',
        'RESCUE — assist injured persons without self-endangering',
        'CONTAIN small spills only if safe: use spill kit appropriate to chemical class',
        'EVACUATE the lab if spill is large, involves toxic vapours, or creates fire risk',
        'Post a spill notice on the door before evacuating',
        'Complete an Incident Report Form within 24 hours',
        'Review and replenish spill kit after any use',
      ],
      donts: [
        'Do not re-enter a contaminated area without Level B PPE minimum',
        'Do not use water on metal fires (sodium, potassium, lithium)',
        'Do not use CO2 extinguisher on alkali metal fires',
        'Do not attempt to neutralise acid spills with base without proper training',
      ],
      ppe: ['Full face shield', 'Chemical-resistant suit (Level B for major spills)', 'Supplied-air respirator or SCBA for toxic vapour situations', 'Chemical-resistant boots and gloves', 'Spill kit: absorbent pads, neutraliser sachets, disposal bags'],
      regulations: ['UoP Emergency Response Plan (ERP-LAB-001)', 'CEA Emergency Preparedness Guidelines', 'OSHA Laboratory Standard (29 CFR 1910.1450) — referenced for best practice'],
    }
  },
]

function Section({ section }) {
  const [open, setOpen] = useState(false)
  const Icon = section.icon

  return (
    <div className={`border ${section.border} rounded-2xl overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between p-5 ${section.bg} text-left`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
            <Icon className={`w-5 h-5 ${section.color}`} />
          </div>
          <span className="font-semibold text-text-primary">{section.title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>

      {open && (
        <div className="p-5 bg-white space-y-5">
          <p className="text-sm text-text-muted leading-relaxed">{section.content.overview}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Do's</h4>
              <ul className="space-y-1.5">
                {section.content.dos.map((d, i) => (
                  <li key={i} className="text-xs text-text-muted flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>{d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Don'ts</h4>
              <ul className="space-y-1.5">
                {section.content.donts.map((d, i) => (
                  <li key={i} className="text-xs text-text-muted flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5 shrink-0">✗</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-brand-bark uppercase tracking-wide mb-2">Required PPE</h4>
            <div className="flex flex-wrap gap-2">
              {section.content.ppe.map((p, i) => (
                <span key={i} className="text-xs bg-surface-muted border border-surface-border text-text-muted px-2.5 py-1 rounded-full">{p}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-brand-bark uppercase tracking-wide mb-2">Regulatory References</h4>
            <ul className="space-y-1">
              {section.content.regulations.map((r, i) => (
                <li key={i} className="text-xs text-text-muted">· {r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Guidelines() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-forest/10 text-brand-forest text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Waste Handling Guidelines
          </div>
          <h1 className="font-display text-4xl text-brand-bark mb-3">Waste Handling Guidelines</h1>
          <p className="text-text-muted text-base leading-relaxed max-w-2xl">
            Standard operating procedures for waste generation, segregation, storage, and handover at the University of Peradeniya.
            All departments are required to follow these guidelines in accordance with CEA regulations and UoP policy.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
            <span>Last reviewed: March 2025</span>
            <span>·</span>
            <Link to="/compliance" className="text-brand-forest hover:underline flex items-center gap-1">
              View regulatory compliance hub <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Quick reference card */}
        <div className="bg-brand-forest text-white rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-brand-sage" />
            <div>
              <h2 className="font-semibold mb-2">Before you post a waste listing</h2>
              <ul className="space-y-1.5 text-sm text-white/80">
                <li>1. Identify the correct waste stream (chemical, e-waste, organic, plastic, general)</li>
                <li>2. Assess the hazard level (non-hazardous → high) using the hazard guide below</li>
                <li>3. Ensure the waste is properly packaged and labelled</li>
                <li>4. Confirm your department coordinator has authorised the disposal</li>
                <li>5. List on UoP IWMP — only CEA-licensed collectors can claim</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map(s => <Section key={s.id} section={s} />)}
        </div>

        {/* Footer note */}
        <div className="mt-10 p-5 bg-white border border-surface-border rounded-2xl text-xs text-text-muted leading-relaxed">
          <strong className="text-text-primary">Disclaimer:</strong> These guidelines are provided for informational purposes and reflect current best practice and applicable regulations.
          They do not replace formal safety training. For department-specific protocols or chemical-specific guidance, contact the{' '}
          <strong>Faculty Safety Officer</strong> or the <strong>UoP Environmental Health &amp; Safety Office</strong>.
          In an emergency, dial <strong>119</strong> (fire/police) or UoP Security at <strong>+94 81 239 3000</strong>.
        </div>
      </div>
    </div>
  )
}
