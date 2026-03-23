import { useState, useEffect, useCallback } from 'react'
import { Megaphone, Plus, Pencil, Trash2, Pin, PinOff, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'

const CATEGORIES = ['general', 'policy', 'safety', 'regulation']

const CATEGORY_STYLES = {
  general:    { label: 'General',    bg: 'bg-gray-100',   text: 'text-gray-700'  },
  policy:     { label: 'Policy',     bg: 'bg-blue-100',   text: 'text-blue-700'  },
  safety:     { label: 'Safety',     bg: 'bg-red-100',    text: 'text-red-700'   },
  regulation: { label: 'Regulation', bg: 'bg-amber-100',  text: 'text-amber-700' },
}

export default function AdminAnnouncements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [editing, setEditing]             = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleField(id, field, current) {
    await supabase.from('announcements').update({ [field]: !current }).eq('id', id)
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, [field]: !current } : a))
  }

  async function remove(id) {
    if (!window.confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  function openEdit(a) {
    setEditing(a)
    setShowForm(true)
  }

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-brand-bark">Announcements</h1>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-moss">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center h-32 items-center">
          <Loader2 className="w-5 h-5 animate-spin text-brand-forest" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          <Megaphone className="w-8 h-8 mx-auto mb-3 text-text-muted/40" />
          No announcements yet. Create one to notify platform users.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const cat = CATEGORY_STYLES[a.category] ?? CATEGORY_STYLES.general
            return (
              <div key={a.id}
                className={cn(
                  'bg-white border rounded-xl p-4',
                  a.is_pinned ? 'border-brand-forest/40 shadow-sm' : 'border-surface-border',
                  !a.is_active && 'opacity-50'
                )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {a.is_pinned && <Pin className="w-3.5 h-3.5 text-brand-forest shrink-0" />}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                        {cat.label}
                      </span>
                      {!a.is_active && (
                        <span className="text-xs text-text-muted bg-surface-muted px-2 py-0.5 rounded-full">Hidden</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-text-primary text-sm">{a.title}</h3>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-text-muted mt-2">{formatDate(a.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleField(a.id, 'is_pinned', a.is_pinned)}
                      title={a.is_pinned ? 'Unpin' : 'Pin'}
                      className="p-1.5 rounded-lg text-text-muted hover:text-brand-forest hover:bg-surface-muted transition-colors">
                      {a.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button onClick={() => toggleField(a.id, 'is_active', a.is_active)}
                      title={a.is_active ? 'Hide' : 'Show'}
                      className="p-1.5 rounded-lg text-text-muted hover:text-brand-forest hover:bg-surface-muted transition-colors">
                      {a.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(a)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-brand-forest hover:bg-surface-muted transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(a.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <AnnouncementModal
          initial={editing}
          userId={user?.id}
          onClose={() => setShowForm(false)}
          onSaved={saved => {
            setAnnouncements(prev =>
              editing
                ? prev.map(a => a.id === saved.id ? saved : a)
                : [saved, ...prev]
            )
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

function AnnouncementModal({ initial, userId, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:     initial?.title    ?? '',
    content:   initial?.content  ?? '',
    category:  initial?.category ?? 'general',
    is_pinned: initial?.is_pinned ?? false,
    is_active: initial?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.')
      return
    }
    setSaving(true)
    setError('')

    const payload = { ...form, created_by: userId, updated_at: new Date().toISOString() }

    if (initial) {
      const { data, error: err } = await supabase
        .from('announcements').update(payload).eq('id', initial.id).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(data)
    } else {
      const { data, error: err } = await supabase
        .from('announcements').insert(payload).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(data)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">
            {initial ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-text-muted" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              required placeholder="e.g. New chemical disposal procedure"
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30" />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Content</label>
            <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))}
              required rows={4} placeholder="Announcement details..."
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 bg-white">
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_STYLES[c].label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_pinned}
                  onChange={e => setForm(f => ({...f, is_pinned: e.target.checked}))}
                  className="rounded" />
                <span className="text-xs text-text-primary">Pin to top</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(f => ({...f, is_active: e.target.checked}))}
                  className="rounded" />
                <span className="text-xs text-text-primary">Visible to users</span>
              </label>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-text-muted border border-surface-border hover:text-text-primary">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-brand-forest text-white hover:bg-brand-moss disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              {initial ? 'Save changes' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
