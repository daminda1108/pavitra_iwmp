import { Link } from 'react-router-dom'
import { Calendar, MapPin, Package, MoreHorizontal, Pencil, XCircle, Eye } from 'lucide-react'
import StatusBadge from '../shared/StatusBadge'
import HazardBadge from '../shared/HazardBadge'
import { formatDate, formatCurrency } from '../../lib/utils'
import { WASTE_STREAMS } from '../../lib/constants'

const STREAM_DOT = {
  green:  'bg-green-400',
  blue:   'bg-blue-400',
  yellow: 'bg-yellow-400',
  purple: 'bg-purple-400',
  red:    'bg-red-400',
  gray:   'bg-gray-400',
}

export default function ListingCard({ listing, onCancel, showActions = true }) {
  const stream = WASTE_STREAMS[listing.waste_stream]
  const displayName = listing.material_name || listing.subcategory || listing.waste_stream

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block w-2 h-2 rounded-full ${STREAM_DOT[stream?.color] ?? 'bg-gray-400'}`} />
            <span className="text-xs text-text-muted uppercase tracking-wide font-medium">
              {stream?.label ?? listing.waste_stream}
            </span>
          </div>
          <h3 className="font-medium text-text-primary text-sm leading-snug truncate" title={displayName}>
            {displayName}
          </h3>
          {listing.material_name_internal && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{listing.material_name_internal}</p>
          )}
        </div>
        <StatusBadge status={listing.status} className="shrink-0" />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          {listing.quantity} {listing.unit}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {listing.campus_location}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(listing.created_at)}
        </span>
        {listing.lab_name && (
          <span className="text-text-muted">{listing.lab_name}</span>
        )}
      </div>

      {/* Hazard */}
      <HazardBadge level={listing.hazard_level} />

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
          <Link
            to={`/board/${listing.id}`}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-forest transition-colors px-2 py-1 rounded-lg hover:bg-surface-muted"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Link>

          {['open', 'bidding'].includes(listing.status) && (
            <Link
              to={`/dashboard/listing/${listing.id}/edit`}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-forest transition-colors px-2 py-1 rounded-lg hover:bg-surface-muted"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}

          {['open', 'bidding'].includes(listing.status) && onCancel && (
            <button
              onClick={() => onCancel(listing.id)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 ml-auto"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}
