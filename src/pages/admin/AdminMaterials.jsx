import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Plus, Upload, X, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { WASTE_STREAMS } from '../../lib/constants'

export default function AdminMaterials() {
  const [materials, setMaterials] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [stream,    setStream]    = useState('')
  const [showAdd,   setShowAdd]   = useState(false)
  const [csvModal,  setCsvModal]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('material_library').select('*').order('waste_stream').order('common_name')
    if (stream) q = q.eq('waste_stream', stream)
    const { data } = await q
    setMaterials(data ?? [])
    setLoading(false)
  }, [stream])

  useEffect(() => { load() }, [load])

  const visible = search.trim()
    ? materials.filter(m =>
        [m.common_name, m.cas_number, m.subcategory].filter(Boolean).join(' ')
          .toLowerCase().includes(search.toLowerCase()))
    : materials

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-brand-bark">Material Library</h1>
        <div className="flex gap-2">
          <button onClick={() => setCsvModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-border bg-white text-sm text-text-muted hover:text-brand-forest hover:border-brand-forest/40">
            <Upload className="w-4 h-4" /> CSV Import
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-moss">
            <Plus className="w-4 h-4" /> Add material
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, CAS..."
            className="pl-8 pr-8 py-2 rounded-xl border border-surface-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-forest/30 w-52" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select value={stream} onChange={e => setStream(e.target.value)}
          className="px-3 py-2 rounded-xl border border-surface-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-forest/30">
          <option value="">All streams</option>
          {Object.entries(WASTE_STREAMS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
        {stream && (
          <button onClick={() => setStream('')} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <p className="text-xs text-text-muted mb-3">{visible.length} materials</p>

      {loading ? (
        <div className="flex justify-center h-32 items-center">
          <Loader2 className="w-5 h-5 animate-spin text-brand-forest" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-text-muted py-8 text-center">No materials found.</p>
      ) : (
        <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-xs text-text-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Stream</th>
                <th className="px-4 py-3 text-left font-medium">Subcategory</th>
                <th className="px-4 py-3 text-left font-medium">CAS #</th>
                <th className="px-4 py-3 text-left font-medium">Def. Hazard</th>
                <th className="px-4 py-3 text-left font-medium">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visible.map(m => (
                <tr key={m.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium text-text-primary">{m.common_name}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {WASTE_STREAMS[m.waste_stream]?.label ?? m.waste_stream}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{m.subcategory ?? '\u2014'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{m.cas_number ?? '\u2014'}</td>
                  <td className="px-4 py-3 text-xs capitalize text-text-muted">
                    {m.default_hazard_level?.replace('_', ' ') ?? '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted capitalize">
                    {m.institution_id ? 'Institution' : 'Platform'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddMaterialModal
          onClose={() => setShowAdd(false)}
          onAdded={m => { setMaterials(prev => [m, ...prev]); setShowAdd(false) }}
        />
      )}
      {csvModal && (
        <CsvImportModal
          onClose={() => setCsvModal(false)}
          onImported={() => { setCsvModal(false); load() }}
        />
      )}
    </div>
  )
}

function AddMaterialModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    common_name: '', waste_stream: '', subcategory: '',
    cas_number: '', default_hazard_level: 'non_hazardous', unit: 'kg',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!form.common_name || !form.waste_stream) { setError('Name and stream required.'); return }
    setSaving(true)
    const { data, error: err } = await supabase.from('material_library').insert({
      common_name:          form.common_name,
      waste_stream:         form.waste_stream,
      subcategory:          form.subcategory          || null,
      cas_number:           form.cas_number           || null,
      default_hazard_level: form.default_hazard_level,
      unit:                 form.unit,
      institution_id:       null,
    }).select().single()
    if (err) { setError(err.message); setSaving(false); return }
    onAdded(data)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">Add material</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Common name *</label>
            <input value={form.common_name} onChange={e => set('common_name', e.target.value)}
              placeholder="Acetone"
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Waste stream *</label>
              <select value={form.waste_stream} onChange={e => set('waste_stream', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/30">
                <option value="">Select...</option>
                {Object.entries(WASTE_STREAMS).map(([k, s]) => (
                  <option key={k} value={k}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Default hazard</label>
              <select value={form.default_hazard_level} onChange={e => set('default_hazard_level', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/30">
                <option value="non_hazardous">Non-hazardous</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Subcategory</label>
              <input value={form.subcategory} onChange={e => set('subcategory', e.target.value)}
                placeholder="Organic solvents"
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">CAS number</label>
              <input value={form.cas_number} onChange={e => set('cas_number', e.target.value)}
                placeholder="67-64-1"
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/30 font-mono" />
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CsvImportModal({ onClose, onImported }) {
  const [file,     setFile]     = useState(null)
  const [preview,  setPreview]  = useState([])
  const [error,    setError]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [imported, setImported] = useState(0)
  const fileRef = useRef()

  function parseCsv(text) {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj = {}
      headers.forEach((h, i) => { if (vals[i]) obj[h] = vals[i] })
      return obj
    }).filter(r => r.common_name && r.waste_stream)
  }

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f); setError('')
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCsv(ev.target.result)
      if (rows.length === 0) {
        setError('No valid rows. Required columns: common_name, waste_stream')
        return
      }
      setPreview(rows.slice(0, 5))
    }
    reader.readAsText(f)
  }

  async function doImport() {
    if (!file) return
    setSaving(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      const rows = parseCsv(ev.target.result)
      const payload = rows.map(r => ({
        common_name:          r.common_name,
        waste_stream:         r.waste_stream,
        subcategory:          r.subcategory          || null,
        cas_number:           r.cas_number           || null,
        default_hazard_level: r.default_hazard_level || 'non_hazardous',
        unit:                 r.unit                 || 'kg',
        institution_id:       null,
      }))
      const { error: err } = await supabase.from('material_library').upsert(payload, {
        onConflict:       'common_name,waste_stream,institution_id',
        ignoreDuplicates: false,
      })
      if (err) { setError(err.message); setSaving(false); return }
      setImported(payload.length)
      setSaving(false)
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">CSV Bulk Import</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-text-muted" /></button>
        </div>

        {imported > 0 ? (
          <div className="text-center py-6">
            <p className="text-green-700 font-semibold mb-1">{imported} materials imported.</p>
            <button onClick={onImported}
              className="mt-4 px-4 py-2 bg-brand-forest text-white rounded-xl text-sm">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 bg-surface-muted rounded-xl p-3 text-xs text-text-muted">
              <p className="font-medium text-text-primary mb-1">Required CSV columns:</p>
              <code>common_name, waste_stream, subcategory, cas_number, default_hazard_level, unit</code>
            </div>
            <div
              className="border-2 border-dashed border-surface-border rounded-xl p-6 text-center cursor-pointer hover:border-brand-forest/40 transition-colors mb-4"
              onClick={() => fileRef.current?.click()}>
              <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">{file ? file.name : 'Click to choose a CSV file'}</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>

            {preview.length > 0 && (
              <div className="mb-4 space-y-1">
                <p className="text-xs font-medium text-text-muted mb-2">
                  Preview (first {preview.length} rows)
                </p>
                {preview.map((r, i) => (
                  <div key={i} className="text-xs bg-surface-muted rounded-lg px-3 py-1.5 text-text-primary">
                    <strong>{r.common_name}</strong>
                    {' \u00b7 '}{r.waste_stream}
                    {r.cas_number ? ` \u00b7 CAS ${r.cas_number}` : ''}
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <div className="flex gap-3 justify-end">
              <button onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-text-muted border border-surface-border hover:text-text-primary">
                Cancel
              </button>
              <button onClick={doImport} disabled={!file || saving || preview.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-brand-forest text-white hover:bg-brand-moss disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
