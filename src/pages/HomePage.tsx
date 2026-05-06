import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { doctorApi } from '../services/api'
import { Spinner } from '../components/ui'
import { getSpecIcon } from '../utils/helpers'
import type { Specialization } from '../types'
import {
  Search, MapPin, Star, Shield, Clock, Video,
  ChevronRight, ArrowRight, Heart, Zap, Users,
} from 'lucide-react'

// ── Hero Search ────────────────────────────────────────────────────────────────
function HeroSearch() {
  const navigate    = useNavigate()
  const [q,    setQ]    = useState('')
  const [city, setCity] = useState('')

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q)    params.set('q', q)
    if (city) params.set('city', city)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch}
      className="bg-white/90 backdrop-blur rounded-2xl shadow-card-lg border border-white/60 p-2 flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search doctors, specializations…"
          className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
        />
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 sm:w-52">
        <MapPin size={18} className="text-slate-400 shrink-0" />
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="City"
          className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
        />
      </div>
      <button type="submit" className="btn-primary px-6 py-3 text-sm font-semibold whitespace-nowrap">
        Search <ArrowRight size={16} />
      </button>
    </form>
  )
}

// ── Stat Badge ─────────────────────────────────────────────────────────────────
interface StatBadgeProps {
  icon:  React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
}
function StatBadge({ icon: Icon, label, value }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
      <Icon size={20} className="text-teal-200" />
      <div>
        <p className="text-white font-bold text-lg leading-none">{value}</p>
        <p className="text-teal-200 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Feature Card ───────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon:  React.ComponentType<{ size?: number; className?: string }>
  color: string
  title: string
  desc:  string
}
function FeatureCard({ icon: Icon, color, title, desc }: FeatureCardProps) {
  return (
    <div className="card p-6 group hover:shadow-card-lg transition-all">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon size={22} className={`text-${color}-600`} />
      </div>
      <h3 className="font-display font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}

// ── Home Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()

  const { data: specsData, isLoading } = useQuery({
    queryKey: ['specializations'],
    queryFn:  () => doctorApi.getSpecializations().then(r => r.data.data ?? []),
  })

  const specs: Specialization[] = specsData ?? []

  const features: FeatureCardProps[] = [
    { icon: Search, color: 'teal',  title: 'Smart Search',          desc: 'Find the right doctor with filters for specialty, city, fee, rating, and availability — powered by Elasticsearch.' },
    { icon: Video,  color: 'cyan',  title: 'Video Consultations',   desc: 'Connect with doctors from home via secure video calls. Available for most specializations.' },
    { icon: Shield, color: 'blue',  title: 'Verified Doctors',      desc: 'Every doctor is verified for credentials and registration. See ratings from real patients.' },
    { icon: Clock,  color: 'teal',  title: 'Instant Booking',       desc: 'See real-time availability and book a slot in under 30 seconds — no phone calls needed.' },
    { icon: Heart,  color: 'rose',  title: 'Patient Records',       desc: 'Keep all your appointment history, prescriptions, and follow-up dates in one place.' },
    { icon: Star,   color: 'amber', title: 'Honest Reviews',        desc: 'Read genuine reviews from verified patients who have completed appointments.' },
  ]

  return (
    <div className="animate-fade-in">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 text-white overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-teal-200 text-xs font-semibold mb-6 backdrop-blur">
              <Zap size={12} className="fill-teal-400 text-teal-400" />
              India's Fastest Doctor Booking Platform
            </span>

            <h1 className="font-display text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
              Find & Book<br />
              <span className="text-teal-300">Top Doctors</span>{' '}Instantly
            </h1>
            <p className="text-teal-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Search from thousands of verified specialists. Book in-person or video consultations in seconds.
            </p>

            <div className="max-w-2xl mx-auto mb-10">
              <HeroSearch />
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-3">
              <StatBadge icon={Users}  value="10,000+" label="Verified Doctors" />
              <StatBadge icon={Star}   value="4.8★"    label="Average Rating" />
              <StatBadge icon={Clock}  value="30 sec"  label="Avg Booking Time" />
              <StatBadge icon={Shield} value="100%"    label="Verified Profiles" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Specializations ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-800">Browse Specializations</h2>
            <p className="text-slate-500 text-sm mt-1">Find the right specialist for your needs</p>
          </div>
          <button onClick={() => navigate('/specializations')} className="btn-secondary text-sm gap-1">
            View all <ChevronRight size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 stagger">
            {specs.slice(0, 12).map(spec => (
              <button key={spec.id}
                onClick={() => navigate(`/search?specialization_id=${spec.id}&specialization_name=${encodeURIComponent(spec.name)}`)}
                className="card-hover p-4 flex flex-col items-center gap-2 text-center group">
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {getSpecIcon(spec.name)}
                </span>
                <span className="text-xs font-medium text-slate-700 group-hover:text-teal-700 leading-snug">
                  {spec.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-slate-800 mb-3">Why DoctorFinder?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Everything you need to take control of your healthcare journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            {features.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── Doctor CTA ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative bg-gradient-to-br from-teal-700 to-cyan-800 rounded-3xl p-10 md:p-16 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Are you a Doctor?
            </h2>
            <p className="text-teal-100 mb-8 max-w-lg mx-auto">
              Join thousands of doctors on DoctorFinder. Manage your availability,
              connect with patients and grow your practice.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary bg-white text-teal-700 hover:bg-teal-50 shadow-lg px-8 py-3 text-base font-semibold">
              Join as a Doctor <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}