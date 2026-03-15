import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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

export default function AdminReports() {
  const [listings,  setListings]  = useState([])
  const [claims,    setClaims]    = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const [lRes, cRes] = await Promise.all([
        supabase.from('listings').select('waste_stream, status, created_at'),
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

  const completionRate = listings.length > 0
    ? Math.round((listings.filter(l => l.status === 'completed').length / listings.length) * 100)
    : 0

  const claimRate = listings.length > 0
    ? Math.round((claims.length / listings.length) * 100)
    : 0

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-bark mb-6">Reports</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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
                <Bar dataKey="count" fill="#3D6B4F" radius={[4,4,0,0]} />
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
                <Pie data={streamCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
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
              <Bar dataKey="count" fill="#4e8c67" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
