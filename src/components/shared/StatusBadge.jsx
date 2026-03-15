import { Circle, Gavel, UserCheck, CheckCircle2, CheckCheck, XCircle, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

const STATUS_CONFIG = {
  open:      { label: 'Open',      icon: Circle,        classes: 'bg-green-50  text-green-700  border-green-200'  },
  bidding:   { label: 'Bidding',   icon: Gavel,         classes: 'bg-violet-50 text-violet-700 border-violet-200' },
  claimed:   { label: 'Claimed',   icon: UserCheck,     classes: 'bg-amber-50  text-amber-700  border-amber-200'  },
  confirmed: { label: 'Confirmed', icon: CheckCircle2,  classes: 'bg-blue-50   text-blue-700   border-blue-200'   },
  completed: { label: 'Completed', icon: CheckCheck,    classes: 'bg-gray-50   text-gray-600   border-gray-200'   },
  cancelled: { label: 'Cancelled', icon: XCircle,       classes: 'bg-red-50    text-red-700    border-red-200'    },
  expired:   { label: 'Expired',   icon: Clock,         classes: 'bg-gray-50   text-gray-500   border-gray-200'   },
  pending:   { label: 'Pending',   icon: Clock,         classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved:  { label: 'Approved',  icon: CheckCircle2,  classes: 'bg-green-50  text-green-700  border-green-200'  },
  rejected:  { label: 'Rejected',  icon: XCircle,       classes: 'bg-red-50    text-red-700    border-red-200'    },
  suspended: { label: 'Suspended', icon: XCircle,       classes: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export default function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] ?? { label: status, icon: Circle, classes: 'bg-gray-50 text-gray-600 border-gray-200' }
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
