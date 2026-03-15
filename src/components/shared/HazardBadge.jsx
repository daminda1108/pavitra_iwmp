import { CheckCircle, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react'
import { cn } from '../../lib/utils'

const HAZARD_CONFIG = {
  non_hazardous: { label: 'Non-hazardous',   icon: CheckCircle,  classes: 'bg-green-50 text-green-700 border-green-200'  },
  low:           { label: 'Low hazard',       icon: AlertCircle,  classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  medium:        { label: 'Medium hazard',    icon: AlertTriangle, classes: 'bg-orange-50 text-orange-700 border-orange-200' },
  high:          { label: 'High hazard',      icon: ShieldAlert,  classes: 'bg-red-50 text-red-700 border-red-200'    },
}

export default function HazardBadge({ level, className }) {
  const config = HAZARD_CONFIG[level] ?? HAZARD_CONFIG.non_hazardous
  const Icon = config.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.classes, className
    )}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </span>
  )
}
