export const WASTE_STREAMS = {
  organic: {
    label: 'Organic / Food Waste',
    icon: 'Leaf',
    color: 'green',
    subcategories: ['Food scraps', 'Cafeteria waste', 'Garden / green waste', 'Animal waste (lab)', 'Other organic'],
    hazardAllowed: ['non_hazardous', 'low'],
  },
  plastic: {
    label: 'Plastic',
    icon: 'Package',
    color: 'blue',
    subcategories: ['PET bottles', 'HDPE containers', 'LDPE film/bags', 'PP plastics', 'Mixed plastic', 'Lab plastic consumables'],
    hazardAllowed: ['non_hazardous', 'low', 'medium'],
  },
  paper: {
    label: 'Paper & Cardboard',
    icon: 'FileText',
    color: 'yellow',
    subcategories: ['Office paper', 'Cardboard / boxes', 'Newspapers & magazines', 'Lab filter paper', 'Mixed paper'],
    hazardAllowed: ['non_hazardous'],
  },
  ewaste: {
    label: 'E-Waste',
    icon: 'Monitor',
    color: 'purple',
    subcategories: ['Computers & laptops', 'Lab equipment & instruments', 'Cables & wiring', 'Batteries', 'Mobile devices', 'Printers & peripherals', 'Mixed e-waste'],
    hazardAllowed: ['non_hazardous', 'low', 'medium', 'high'],
  },
  chemical: {
    label: 'Chemical / Lab Waste',
    icon: 'FlaskConical',
    color: 'red',
    subcategories: ['Organic solvents', 'Inorganic reagents', 'Acids & bases', 'Expired chemicals', 'Lab consumables (non-sharp)', 'Sharps & glassware', 'Biological waste'],
    hazardAllowed: ['low', 'medium', 'high'],
  },
  general: {
    label: 'General Mixed Waste',
    icon: 'Trash2',
    color: 'gray',
    subcategories: ['General mixed', 'Cafeteria packaging', 'Event waste', 'Sanitary waste'],
    hazardAllowed: ['non_hazardous', 'low'],
  }
}

export const EWASTE_DEVICE_CATEGORIES = [
  'Computers & laptops',
  'Lab instruments & analyzers',
  'Monitors (CRT/LCD)',
  'Printers & peripherals',
  'Cables & wiring',
  'Batteries (specify type)',
  'Oscilloscopes/meters',
  'Centrifuges & lab motors',
  'Audio/visual equipment',
  'Network equipment',
  'Mobile/handheld devices',
  'Other',
]

export const EWASTE_BADGES = {
  cea_ewaste:       { label: 'CEA E-Waste Licensed',       icon: 'Shield',      color: 'green'  },
  basel_certified:  { label: 'Basel Convention Certified', icon: 'Globe',       color: 'blue'   },
  data_destruction: { label: 'Data Destruction Certified', icon: 'Lock',        color: 'purple' },
  crt_capable:      { label: 'CRT/Mercury Handling',       icon: 'Monitor',     color: 'amber'  },
  precious_metals:  { label: 'Precious Metal Recovery',    icon: 'Gem',         color: 'amber'  },
  iso_certified:    { label: 'ISO 14001 Certified',        icon: 'Award',       color: 'teal'   },
  doorstep_pickup:  { label: 'Doorstep Campus Pickup',     icon: 'Truck',       color: 'green'  },
  destruction_cert: { label: 'Issues Destruction Cert.',   icon: 'FileCheck',   color: 'blue'   },
}

export const UNITS = ['kg', 'bags', 'boxes', 'litres', 'units', 'tonnes']

export const HAZARD_LEVELS = {
  non_hazardous: { label: 'Non-hazardous',                         color: 'green',  icon: 'CheckCircle' },
  low:           { label: 'Low hazard',                            color: 'yellow', icon: 'AlertCircle' },
  medium:        { label: 'Medium hazard — special handling req.', color: 'orange', icon: 'AlertTriangle' },
  high:          { label: 'High hazard — certified disposal req.', color: 'red',    icon: 'ShieldAlert' },
}

export const PICKUP_WINDOWS = ['Morning (8am–12pm)', 'Afternoon (12pm–5pm)', 'Flexible']
export const FREQUENCIES    = ['Weekly', 'Fortnightly', 'Monthly']
export const DAYS_OF_WEEK   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export const FINANCIAL_HINTS = {
  unknown:            { label: 'Not sure — let collectors declare' },
  expect_to_receive:  { label: 'Expect to receive payment (valuable material)' },
  expect_to_pay:      { label: 'Expect to pay for disposal (hazardous/low-value)' },
  expect_free:        { label: 'Expect free collection' },
}

export const FINANCIAL_DIRECTIONS = {
  buyer_pays: { label: 'We will pay the institution', description: 'Collector pays for the material' },
  uni_pays:   { label: 'We charge for disposal',      description: 'Institution pays collector' },
  free:        { label: 'Free collection',             description: 'No payment either way' },
}

export const LISTING_STATUSES = {
  open:      { label: 'Open',      color: 'status-open',      icon: 'Circle'    },
  bidding:   { label: 'Bidding',   color: 'status-bidding',   icon: 'Gavel'     },
  claimed:   { label: 'Claimed',   color: 'status-claimed',   icon: 'UserCheck' },
  confirmed: { label: 'Confirmed', color: 'status-confirmed', icon: 'CheckCircle2' },
  completed: { label: 'Completed', color: 'status-completed', icon: 'CheckCheck' },
  cancelled: { label: 'Cancelled', color: 'status-cancelled', icon: 'XCircle'   },
  expired:   { label: 'Expired',   color: 'status-expired',   icon: 'Clock'     },
}
