import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-6xl text-brand-forest mb-4">404</h1>
        <p className="text-text-muted mb-8">This page doesn't exist.</p>
        <Link to="/" className="text-brand-forest hover:underline">Go home</Link>
      </main>
    </div>
  )
}
