import { useState, useEffect } from 'react'
import { Loader2, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { WASTE_STREAMS } from '../../lib/constants'

const STREAM_COLORS = {
  organic:  '#4ade80',
  plastic:  '#60a5fa',
  paper:    '#fbbf24',
  ewaste:   '#a78bfa',
  chemical: '#f87171',
  general:  '#9ca3af',
}

function downloadCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReports() {
  const [listings,  setListings]  = useState([])
  const [claims,    setClaims]    = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const [lRes, cRes] = await Promise.all([
        supabase.from('listings').select('waste_stream, status, created_at, faculty, department, quantity, unit'),
        supabase.from('claims').select('status, created_at'),
      ])
      setListings(lRes.data ?? [])
      setClaims(cRes.data   ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex justify-center h-32 items-center">
      <Loader2 className="w-5 h-5 animate-spin text-brand-forest" />
    </div>
  )

  // By stream (pie)
  const streamCounts = Object.keys(WASTE_STREAMS).map(key => ({
    name:  WASTE_STREAMS[key].label,
    value: listings.filter(l => l.waste_stream === key).length,
    key,
  })).filter(s => s.value > 0)

  // By status (bar)
  const statusCounts = ['open','bidding','claimed','confirmed','completed','cancelled'].map(s => ({
    status: s.charAt(0).toUpperCase() + s.slice(1),
    count:  listings.filter(l => l.status === s).length,
  })).filter(s => s.count > 0)

  // Monthly listings (last 6 months)
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    const count = listings.filter(l => {
      const ld = new Date(l.created_at)
      return ld.getFullYear() === d.getFullYear() && ld.getMonth() === d.getMonth()
    }).length
    return { month: label, count }
  })

  // By faculty/department
  const faculties = [...new Set(listings.map(l => l.faculty).filter(Boolean))]
  const facultyData = faculties.map(f => ({
    faculty: f,
    count: listings.filter(l => l.faculty === f).length,
  })).sort((a, b) => b.count - a.count)

  const completionRate = listings.length > 0
    ? Math.round((listings.filter(l => l.status === 'completed').length / listings.length) * 100)
    : 0

  const claimRate = listings.length > 0
    ? Math.round((claims.length / listings.length) * 100)
    : 0

  function handleExport() {
    const rows = listings.map(l => ({
      date:        l.created_at?.slice(0, 10),
      waste_stream: l.waste_stream,
      status:      l.status,
      faculty:     l.faculty ?? '',
      department:  l.department ?? '',
      quantity:    l.quantity ?? '',
      unit:        l.unit ?? '',
    }))
    downloadCSV(rows, `uop-iwmp-report-${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-brand-bark">Reports</h1>
        <button onClick={handleExport}
          className="flex items-center gap-2 border border-surface-border bg-white text-text-primary px-4 py-2 rounded-xl text-sm hover:bg-surface-muted transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-surface-border rounded-xl p-5">
          <p className="text-xs text-text-muted mb-1">Total listings</p>
          <p className="text-3xl font-semibold text-text-primary">{listings.length}</p>
        </div>
        <div className="bg-white border border-surface-border rounded-xl p-5">
          <p className="text-xs text-text-muted mb-1">Completion rate</p>
          <p className="text-3xl font-semibold text-green-600">{completionRate}%</p>
        </div>
        <div className="bg-white border border-surface-border rounded-xl p-5">
          <p className="text-xs text-text-muted mb-1">Total claims</p>
          <p className="text-3xl font-semibold text-text-primary">{claims.length}</p>
        </div>
        <div className="bg-white border border-surface-border rounded-xl p-5">
          <p className="text-xs text-text-muted mb-1">Claim rate</p>
          <p className="text-3xl font-semibold text-text-primary">{claimRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly listings */}
        <div className="bg-white border border-surface-border rounded-xl p-5">
          <h2 className="font-semibold text-text-primary text-sm mb-4">Listings per month</h2>
          {listings.length === 0 ? (
            <p className="text-xs text-text-muted">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#800020" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By stream */}
        <div className="bg-white border border-surface-border rounded-xl p-5">
          <h2 className="font-semibold text-text-primary text-sm mb-4">Listings by waste stream</h2>
          {streamCounts.length === 0 ? (
            <p className="text-xs text-text-muted">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={streamCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {streamCounts.map(s => (
                    <Cell key={s.key} fill={STREAM_COLORS[s.key] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status breakdown */}
        <div className="bg-white border border-surface-border rounded-xl p-5">
          <h2 className="font-semibold text-text-primary text-sm mb-4">Listings by status</h2>
          {statusCounts.length === 0 ? (
            <p className="text-xs text-text-muted">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusCounts} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#C5A649" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Faculty breakdown */}
        <div className="bg-white border border-surface-border rounded-xl p-5">
          <h2 className="font-semibold text-text-primary text-sm mb-4">Listings by faculty / department</h2>
          {facultyData.length === 0 ? (
            <p className="text-xs text-text-muted">No faculty data yet — listings need a faculty field to appear here.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={facultyData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="faculty" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#800020" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
