import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sendEmail } from '../../lib/email'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'

const STATUS_TABS = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export default function AdminCollectors() {
  const [collectors, setCollectors] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('pending')
  const [modal,      setModal]      = useState(null) // { id, action: 'approve'|'reject' }
  const [reason,     setReason]     = useState('')
  const [saving,     setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('collectors')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
    setCollectors(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const visible = tab === 'all' ? collectors : collectors.filter(c => c.status === tab)

  async function handleAction() {
    if (!modal) return
    setSaving(true)
    const updates = modal.action === 'approve'
      ? { status: 'approved', rejection_reason: null }
      : { status: 'rejected', rejection_reason: reason || 'Application declined.' }
    await supabase.from('collectors').update(updates).eq('id', modal.id)
    setCollectors(prev => prev.map(c => c.id === modal.id ? { ...c, ...updates } : c))

    // Fire-and-forget email notification
    const col = collectors.find(c => c.id === modal.id)
    if (col?.profiles?.email) {
      if (modal.action === 'approve') {
        sendEmail('collector_approved', col.profiles.email, { company_name: col.company_name })
      } else {
        sendEmail('collector_rejected', col.profiles.email, {
          company_name: col.company_name,
          reason: reason || 'Application declined.',
        })
      }
    }

    setModal(null)
    setReason('')
    setSaving(false)
  }

  const pendingCount = collectors.filter(c => c.status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-brand-bark">Collectors</h1>
        <span className="text-sm text-text-muted">{collectors.length} total</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-muted p-1 rounded-xl w-fit mb-6">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === t.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            )}>
            {t.label}
            {t.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-32 items-center">
          <Loader2 className="w-5 h-5 animate-spin text-brand-forest" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-text-muted py-8 text-center">No collectors in this category.</p>
      ) : (
        <div className="space-y-3">
          {visible.map(c => <CollectorRow key={c.id} collector={c} onAction={setModal} />)}
        </div>
      )}

      {/* Approve/Reject Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="font-semibold text-text-primary mb-1 capitalize">
              {modal.action} collector?
            </h2>
            <p className="text-sm text-text-muted mb-4">{modal.company_name}</p>
            {modal.action === 'reject' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Rejection reason (shown to applicant)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="CEA license not verifiable. Please reapply with current credentials."
                  className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 resize-none"
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setModal(null); setReason('') }}
                className="px-4 py-2 rounded-xl text-sm text-text-muted hover:text-text-primary border border-surface-border">
                Cancel
              </button>
              <button onClick={handleAction} disabled={saving}
                className={cn('px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60',
                  modal.action === 'approve' ? 'bg-brand-forest hover:bg-brand-moss' : 'bg-red-600 hover:bg-red-700'
                )}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : modal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CollectorRow({ collector: c, onAction }) {
  const [expanded, setExpanded] = useState(false)

  const statusColors = {
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm text-text-primary">{c.company_name}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border capitalize', statusColors[c.status] ?? 'bg-gray-50 text-gray-600 border-gray-200')}>
              {c.status}
            </span>
          </div>
          <p className="text-xs text-text-muted">{c.cea_license} · {c.service_area}</p>
        </div>
        <div className="flex items-center gap-2">
          {c.status === 'pending' && (
            <>
              <button onClick={() => onAction({ id: c.id, action: 'approve', company_name: c.company_name })}
                className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button onClick={() => onAction({ id: c.id, action: 'reject', company_name: c.company_name })}
                className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}
          {c.status === 'approved' && (
            <button onClick={() => onAction({ id: c.id, action: 'reject', company_name: c.company_name })}
              className="text-xs text-red-500 hover:text-red-700 border border-transparent hover:border-red-200 px-2 py-1 rounded-lg">
              Revoke
            </button>
          )}
          <Link to={`/collector/${c.id}`} target="_blank"
            className="text-text-muted hover:text-brand-forest p-1.5 rounded-lg">
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button onClick={() => setExpanded(e => !e)} className="text-text-muted hover:text-text-primary p-1.5 rounded-lg">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-border px-4 py-3 bg-surface-muted text-xs text-text-muted grid grid-cols-2 gap-y-1.5 gap-x-4">
          {c.profiles?.email     && <Row label="Email"      value={c.profiles.email} />}
          {c.contact_person      && <Row label="Contact"    value={c.contact_person} />}
          {c.website             && <Row label="Website"    value={c.website} />}
          {c.cea_verified !== undefined && <Row label="CEA verified" value={c.cea_verified ? 'Yes' : 'No'} />}
          <Row label="Applied"   value={formatDate(c.created_at)} />
          {c.rejection_reason    && <Row label="Reason" value={c.rejection_reason} className="col-span-2" />}
          {c.description && (
            <div className="col-span-2 mt-1">
              <span className="font-medium text-text-primary">Description: </span>{c.description}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, className }) {
  return (
    <div className={className}>
      <span className="font-medium text-text-primary">{label}: </span>{value}
    </div>
  )
}
