import { useState, useEffect, useCallback } from 'react'
import { Loader2, Send, Copy, CheckCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate, formatDateTime } from '../../lib/utils'
import { cn } from '../../lib/utils'

const TABS = [
  { key: 'generators', label: 'Generators' },
  { key: 'invites',    label: 'Invites'    },
]

export default function AdminGenerators() {
  const [tab,        setTab]        = useState('generators')
  const [generators, setGenerators] = useState([])
  const [invites,    setInvites]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [genRes, invRes] = await Promise.all([
      supabase.from('generators')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false }),
      supabase.from('generator_invites')
        .select('*')
        .order('created_at', { ascending: false }),
    ])
    setGenerators(genRes.data ?? [])
    setInvites(invRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-brand-bark">Generators</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-moss">
          <Send className="w-4 h-4" /> Send Invite
        </button>
      </div>

      <div className="flex gap-1 bg-surface-muted p-1 rounded-xl w-fit mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === t.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            )}>
            {t.label}
            {t.key === 'invites' && (
              <span className="ml-1.5 text-xs text-text-muted">
                ({invites.filter(i => !i.used).length} unused)
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-32 items-center">
          <Loader2 className="w-5 h-5 animate-spin text-brand-forest" />
        </div>
      ) : tab === 'generators' ? (
        <GeneratorsTable generators={generators} />
      ) : (
        <InvitesTable invites={invites} />
      )}

      {showForm && (
        <InviteModal onClose={() => setShowForm(false)} onCreated={inv => {
          setInvites(prev => [inv, ...prev])
          setShowForm(false)
          setTab('invites')
        }} />
      )}
    </div>
  )
}

function GeneratorsTable({ generators }) {
  if (generators.length === 0) return (
    <p className="text-sm text-text-muted py-8 text-center">No generators registered yet.</p>
  )
  return (
    <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-xs text-text-muted uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Faculty / Dept</th>
            <th className="px-4 py-3 text-left font-medium">Authorized</th>
            <th className="px-4 py-3 text-left font-medium">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {generators.map(g => (
            <tr key={g.id} className="hover:bg-surface-muted/50">
              <td className="px-4 py-3 font-medium text-text-primary">
                {g.profiles?.full_name ?? '—'}
              </td>
              <td className="px-4 py-3 text-text-muted">{g.profiles?.email ?? '—'}</td>
              <td className="px-4 py-3 text-text-muted">
                {[g.faculty, g.department].filter(Boolean).join(' / ') || '—'}
              </td>
              <td className="px-4 py-3">
                {g.is_authorized
                  ? <span className="flex items-center gap-1 text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
                  : <span className="text-amber-600">Pending</span>
                }
              </td>
              <td className="px-4 py-3 text-text-muted">{formatDate(g.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InvitesTable({ invites }) {
  const [copied, setCopied] = useState(null)

  function copyLink(token) {
    const url = `${window.location.origin}/register/generator?token=${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  if (invites.length === 0) return (
    <p className="text-sm text-text-muted py-8 text-center">No invites sent yet.</p>
  )
  return (
    <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-xs text-text-muted uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Faculty / Dept</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Expires</th>
            <th className="px-4 py-3 text-left font-medium">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {invites.map(inv => (
            <tr key={inv.id} className="hover:bg-surface-muted/50">
              <td className="px-4 py-3 text-text-primary">{inv.email || '—'}</td>
              <td className="px-4 py-3 text-text-muted">
                {[inv.faculty, inv.department].filter(Boolean).join(' / ') || '—'}
              </td>
              <td className="px-4 py-3">
                {inv.used
                  ? <span className="text-green-700 font-medium">Used</span>
                  : new Date(inv.expires_at) < new Date()
                    ? <span className="text-red-500">Expired</span>
                    : <span className="text-amber-600">Pending</span>
                }
              </td>
              <td className="px-4 py-3 text-text-muted">{formatDateTime(inv.expires_at)}</td>
              <td className="px-4 py-3">
                {!inv.used && (
                  <button onClick={() => copyLink(inv.id)}
                    className="flex items-center gap-1 text-xs text-brand-forest hover:underline">
                    {copied === inv.id ? <><CheckCircle className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InviteModal({ onClose, onCreated }) {
  const [form,   setForm]   = useState({ email: '', faculty: '', department: '', days: '7' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const expires_at = new Date(Date.now() + parseInt(form.days) * 86400000).toISOString()
    // Get institution_id for UoP by name, fallback to first institution
    let { data: inst } = await supabase.from('institutions').select('id').eq('name', 'University of Peradeniya').maybeSingle()
    if (!inst) {
      const { data: fallback } = await supabase.from('institutions').select('id').limit(1).maybeSingle()
      inst = fallback
    }
    const { data, error: err } = await supabase.from('generator_invites').insert({
      email:          form.email || null,
      faculty:        form.faculty || null,
      department:     form.department || null,
      institution_id: inst?.id ?? null,
      expires_at,
    }).select().single()
    if (err) { setError(err.message); setSaving(false); return }
    onCreated(data)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">Send Generator Invite</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Email (optional)</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
              placeholder="researcher@pdn.ac.lk"
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Faculty</label>
              <input value={form.faculty} onChange={e => setForm(f => ({...f, faculty: e.target.value}))}
                placeholder="Faculty of Science"
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Department</label>
              <input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))}
                placeholder="Dept. of Chemistry"
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Expires in</label>
            <select value={form.days} onChange={e => setForm(f => ({...f, days: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 bg-white">
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-text-muted border border-surface-border hover:text-text-primary">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-brand-forest text-white hover:bg-brand-moss disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Create invite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
