import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminApi, doctorApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Avatar, PageLoader, EmptyState, Spinner, StarRating, Pagination,
} from '../../components/ui'
import { fmt, apiError, getSpecIcon } from '../../utils/helpers'
import type { DoctorSummary, DoctorDetail, Specialization } from '../../types'
import {
  LayoutDashboard, Stethoscope, Users, Calendar, BadgeCheck,
  Sparkles, ShieldCheck, Plus, Search, IndianRupee, CheckCircle2,
  AlertTriangle, FileText, MapPin, Briefcase, GraduationCap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import React from 'react'

// ── Tab type ──────────────────────────────────────────────────────────────────
type AdminTab = 'overview' | 'doctors' | 'specializations'

// ── Stat Card (compact) ───────────────────────────────────────────────────────
interface StatCardProps {
  icon:   React.ComponentType<{ size?: number; className?: string }>
  label:  string
  value:  number | string
  hint?:  string
  color?: 'teal' | 'blue' | 'amber' | 'green' | 'red'
}
function StatCard({ icon: Icon, label, value, hint, color = 'teal' }: StatCardProps) {
  const colors: Record<string, { bg: string; fg: string }> = {
    teal:  { bg: 'bg-teal-100',  fg: 'text-teal-600'  },
    blue:  { bg: 'bg-blue-100',  fg: 'text-blue-600'  },
    amber: { bg: 'bg-amber-100', fg: 'text-amber-600' },
    green: { bg: 'bg-green-100', fg: 'text-green-600' },
    red:   { bg: 'bg-red-100',   fg: 'text-red-600'   },
  }
  const c = colors[color] ?? colors.teal
  return (
    <div className="stat-card">
      <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', c.bg)}>
        <Icon size={20} className={c.fg} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-display font-bold text-slate-800 truncate">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
        {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}

// ── Tab Button ────────────────────────────────────────────────────────────────
interface TabButtonProps {
  active:  boolean
  icon:    React.ComponentType<{ size?: number; className?: string }>
  label:   string
  count?:  number
  onClick: () => void
}
function TabButton({ active, icon: Icon, label, count, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
        active
          ? 'bg-teal-600 text-white shadow-btn'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}>
      <Icon size={16} /> {label}
      {count != null && count > 0 && (
        <span className={clsx(
          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
          active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

// ── Defensive field picker — handles snake_case / camelCase variations ───────
function pick(obj: any, keys: string[], fallback: number | string = 0): number | string {
  if (!obj) return fallback
  for (const k of keys) {
    if (obj[k] != null) return obj[k]
  }
  return fallback
}

// ════════════════════════════════════════════════════════════════════════════════
// VERIFY MODAL — full doctor detail before verifying
// ════════════════════════════════════════════════════════════════════════════════
interface VerifyModalProps {
  doctorId: number | null
  onClose:  () => void
}
function VerifyModal({ doctorId, onClose }: VerifyModalProps) {
  const qc = useQueryClient()

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['admin-doctor-detail', doctorId],
    queryFn:  () => doctorApi.getById(doctorId!).then(r => r.data.data ?? r.data),
    enabled:  !!doctorId,
  })

  const { mutate: verify, isPending: verifying } = useMutation({
    mutationFn: () => adminApi.verifyDoctor(doctorId!),
    onSuccess:  () => {
      toast.success('Doctor verified successfully')
      qc.invalidateQueries({ queryKey: ['admin-pending-doctors'] })
      qc.invalidateQueries({ queryKey: ['admin-doctors'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      onClose()
    },
    onError: e => toast.error(apiError(e)),
  })

  if (!doctorId) return null

  const d = doctor as DoctorDetail | undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-800">Review Doctor</h3>
            <p className="text-xs text-slate-500 mt-0.5">Verify credentials before approval</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-12 flex justify-center"><Spinner size={28} /></div>
          ) : !d ? (
            <EmptyState icon={AlertTriangle} title="Couldn't load doctor" />
          ) : (
            <div className="space-y-5">
              {/* Identity */}
              <div className="flex items-start gap-4">
                <Avatar name={d.full_name} src={d.profile_photo_url} size="xl" />
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl font-bold text-slate-800">Dr. {d.full_name}</h2>
                  <p className="text-sm text-teal-600 font-medium">
                    {getSpecIcon(d.specialization ?? '')} {d.specialization ?? 'No specialization set'}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    {d.city && <span className="flex items-center gap-1"><MapPin size={11} /> {d.city}</span>}
                    {d.experience_years != null && (
                      <span className="flex items-center gap-1"><Briefcase size={11} /> {d.experience_years} years exp</span>
                    )}
                  </div>
                  {d.is_verified && (
                    <span className="badge-green text-[10px] mt-2 inline-flex">
                      <BadgeCheck size={10} /> Already Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Registration #</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1 break-all">
                    {d.registration_number ?? <span className="text-red-500 font-normal italic">Missing</span>}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Consultation Fee</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{fmt.currency(d.consultation_fee)}</p>
                </div>
              </div>

              {/* Qualifications */}
              {d.qualifications && d.qualifications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-teal-600" /> Qualifications
                  </p>
                  <div className="space-y-2">
                    {d.qualifications.map((q, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 text-xs">
                        <p className="font-semibold text-slate-800">{q.degree}</p>
                        {(q.university || q.year) && (
                          <p className="text-slate-500 mt-0.5">
                            {q.university}{q.university && q.year ? ' • ' : ''}{q.year}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio / About */}
              {(d.bio || d.about) && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <FileText size={13} className="text-teal-600" /> About
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed p-3 rounded-xl bg-slate-50">
                    {d.bio ?? d.about}
                  </p>
                </div>
              )}

              {/* Languages */}
              {d.languages && d.languages.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.languages.map(l => (
                      <span key={l} className="badge-slate text-[10px]">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing-info warning */}
              {!d.registration_number && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold">Missing registration number</p>
                    <p className="mt-0.5">This doctor hasn't provided a medical registration number. Verify anyway only if you have confirmed credentials offline.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-100 bg-slate-50">
          <Link
            to={`/doctors/${doctorId}`}
            target="_blank"
            className="btn-secondary text-xs px-4 py-2">
            View Public Profile ↗
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost text-xs px-4 py-2">Cancel</button>
            {d?.is_verified ? (
              <span className="badge-green text-xs">
                <BadgeCheck size={12} /> Already Verified
              </span>
            ) : (
              <button
                onClick={() => verify()}
                disabled={verifying || isLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 shadow-btn disabled:opacity-50">
                {verifying ? <Spinner size={14} className="text-white" /> : <CheckCircle2 size={14} />}
                Verify Doctor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// PENDING DOCTOR CARD — large, action-forward
// ════════════════════════════════════════════════════════════════════════════════
interface PendingCardProps {
  doctor:    DoctorSummary
  onReview:  (id: number) => void
  onQuickVerify: (id: number) => void
  quickVerifying: boolean
}
function PendingCard({ doctor: d, onReview, onQuickVerify, quickVerifying }: PendingCardProps) {
  return (
    <div className="card p-5 hover:shadow-card-lg transition-all border-l-4 border-l-amber-400">
      <div className="flex items-start gap-4">
        <Avatar name={d.full_name} src={d.profile_photo_url} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-slate-800 truncate">Dr. {d.full_name}</h3>
              <p className="text-xs text-teal-600 font-medium">
                {getSpecIcon(d.specialization ?? '')} {d.specialization ?? '—'}
              </p>
            </div>
            <span className="badge-amber text-[10px] shrink-0">Pending</span>
          </div>

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
            {d.city && <span className="flex items-center gap-1"><MapPin size={10} /> {d.city}</span>}
            {d.experience_years != null && (
              <span className="flex items-center gap-1"><Briefcase size={10} /> {d.experience_years} yrs</span>
            )}
            <span className="font-medium text-slate-700">{fmt.currency(d.consultation_fee)}</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => onReview(d.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 shadow-btn">
              <FileText size={12} /> Review & Verify
            </button>
            <button
              onClick={() => onQuickVerify(d.id)}
              disabled={quickVerifying}
              title="Skip review — verify directly"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 disabled:opacity-50">
              <CheckCircle2 size={12} /> Quick Verify
            </button>
            <Link
              to={`/doctors/${d.id}`}
              target="_blank"
              className="btn-ghost text-xs px-3 py-2">
              View Public Profile ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB — stats + pending verification queue (the hero)
// ════════════════════════════════════════════════════════════════════════════════
interface OverviewTabProps {
  onReview: (id: number) => void
}
function OverviewTab({ onReview }: OverviewTabProps) {
  const qc = useQueryClient()

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => adminApi.stats().then(r => r.data.data ?? r.data),
  })

  // Pull a generous page of doctors; we filter to unverified client-side
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: ['admin-pending-doctors'],
    queryFn:  () => doctorApi.search({ page: 1, page_size: 50 } as any)
      .then(r => r.data.data ?? r.data),
  })

  const { mutate: quickVerify, isPending: quickVerifying } = useMutation({
    mutationFn: (id: number) => adminApi.verifyDoctor(id),
    onSuccess:  () => {
      toast.success('Doctor verified')
      qc.invalidateQueries({ queryKey: ['admin-pending-doctors'] })
      qc.invalidateQueries({ queryKey: ['admin-doctors'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: e => toast.error(apiError(e)),
  })

  const s: any = statsData ?? {}
  const totalDoctors    = pick(s, ['total_doctors', 'doctors_count', 'totalDoctors', 'doctors'])
  const totalPatients   = pick(s, ['total_patients', 'patients_count', 'totalPatients', 'patients'])
  const totalAppts      = pick(s, ['total_appointments', 'appointments_count', 'totalAppointments', 'appointments'])
  const verifiedDoctors = pick(s, ['verified_doctors', 'verifiedDoctors'])
  const totalRevenue    = pick(s, ['total_revenue', 'revenue', 'totalRevenue'])

  const allDoctors: DoctorSummary[] =
    (doctorsData as any)?.results ??
    (doctorsData as any)?.items ??
    (Array.isArray(doctorsData) ? doctorsData : []) ??
    []
  const pending = allDoctors.filter(d => !d.is_verified)

  return (
    <div className="space-y-8">
      {/* Stats strip */}
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">Platform Overview</h2>
        {statsLoading ? (
          <div className="py-8"><Spinner size={28} /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Stethoscope} color="teal"
              label="Total Doctors" value={totalDoctors}
              hint={`${verifiedDoctors} verified`} />
            <StatCard icon={Users} color="blue"
              label="Patients" value={totalPatients} />
            <StatCard icon={Calendar} color="amber"
              label="Appointments" value={totalAppts} />
            {Number(totalRevenue) > 0 ? (
              <StatCard icon={IndianRupee} color="green"
                label="Revenue" value={fmt.currency(Number(totalRevenue))} />
            ) : (
              <StatCard icon={AlertTriangle} color="amber"
                label="Pending Verification" value={pending.length} />
            )}
          </div>
        )}
      </div>

      {/* Pending verification queue — the main thing */}
      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Awaiting Verification
              {pending.length > 0 && (
                <span className="badge-amber text-xs">{pending.length}</span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Review credentials and approve doctors so they appear in search results
            </p>
          </div>
        </div>

        {doctorsLoading ? (
          <div className="py-12"><Spinner size={32} /></div>
        ) : pending.length === 0 ? (
          <div className="card p-8">
            <EmptyState
              icon={CheckCircle2}
              title="All caught up!"
              desc="There are no doctors waiting for verification right now."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
            {pending.map(d => (
              <PendingCard
                key={d.id}
                doctor={d}
                onReview={onReview}
                onQuickVerify={(id) => quickVerify(id)}
                quickVerifying={quickVerifying}
              />
            ))}
          </div>
        )}
      </div>

      {/* Raw stats peek — collapsed, useful for QA */}
      <details className="card p-5 group">
        <summary className="cursor-pointer text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700">
          Raw stats response (debug)
        </summary>
        <pre className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 text-xs overflow-auto">
{JSON.stringify(s, null, 2)}
        </pre>
      </details>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// DOCTORS TAB — full table for browsing everyone
// ════════════════════════════════════════════════════════════════════════════════
interface DoctorsTabProps {
  onReview: (id: number) => void
}
function DoctorsTab({ onReview }: DoctorsTabProps) {
  const qc = useQueryClient()
  // Backend uses 1-indexed pages; Pagination component uses 0-indexed. Convert at boundary.
  const [page, setPage]     = useState(0)
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState<'all' | 'unverified' | 'verified'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-doctors', page, query],
    queryFn:  () => doctorApi.search({
      q:         query || undefined,
      page:      page + 1,      // 0-indexed → 1-indexed
      page_size: 12,
    } as any).then(r => r.data.data ?? r.data),
  })

  const { mutate: feature } = useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) =>
      adminApi.featureDoctor(id, featured),
    onSuccess: () => {
      toast.success('Updated')
      qc.invalidateQueries({ queryKey: ['admin-doctors'] })
    },
    onError: e => toast.error(apiError(e)),
  })

  const items: DoctorSummary[] =
    (data as any)?.results ?? (data as any)?.items ?? (Array.isArray(data) ? data : []) ?? []
  const totalPages = (data as any)?.total_pages ?? 1

  const filtered = items.filter(d => {
    if (filter === 'verified')   return d.is_verified
    if (filter === 'unverified') return !d.is_verified
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-800">All Doctors</h2>
          <p className="text-sm text-slate-500 mt-0.5">Browse, search, and manage every doctor</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(0) }}
              placeholder="Search doctors…"
              className="input pl-9 py-2 text-sm w-64" />
          </div>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value as any); setPage(0) }}
            className="input py-2 text-sm w-auto">
            <option value="all">All</option>
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20"><Spinner size={32} /></div>
      ) : !filtered.length ? (
        <EmptyState icon={Stethoscope} title="No doctors found"
          desc={filter !== 'all' ? `No ${filter} doctors match.` : 'Try a different search.'} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3 hidden md:table-cell">Specialization</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Experience</th>
                  <th className="px-5 py-3 hidden md:table-cell">Rating</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Fee</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/doctors/${d.id}`}
                        className="flex items-center gap-3 group">
                        <Avatar name={d.full_name} src={d.profile_photo_url} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 group-hover:text-teal-700 truncate">
                            Dr. {d.full_name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{d.city ?? '—'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs text-slate-600">
                        {getSpecIcon(d.specialization ?? '')} {d.specialization ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-xs text-slate-600">
                      {d.experience_years} yrs
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <StarRating rating={d.avg_rating} count={d.total_reviews} size={11} />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-xs font-medium text-slate-700">
                      {fmt.currency(d.consultation_fee)}
                    </td>
                    <td className="px-5 py-4">
                      {d.is_verified ? (
                        <span className="badge-green text-[10px]">
                          <BadgeCheck size={10} /> Verified
                        </span>
                      ) : (
                        <span className="badge-amber text-[10px]">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {!d.is_verified && (
                          <button
                            onClick={() => onReview(d.id)}
                            className="btn-primary text-xs px-3 py-1.5">
                            Review
                          </button>
                        )}
                        <button
                          onClick={() => feature({ id: d.id, featured: true })}
                          title="Feature on homepage"
                          className="btn-ghost text-xs px-2 py-1.5">
                          <Sparkles size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SPECIALIZATIONS TAB
// ════════════════════════════════════════════════════════════════════════════════
function SpecializationsTab() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', description: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-specs'],
    queryFn:  () => doctorApi.getSpecializations().then(r => r.data.data ?? r.data ?? []),
  })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => doctorApi.createSpecialization({
      name:        form.name.trim(),
      description: form.description.trim() || undefined,
    } as any),
    onSuccess: () => {
      toast.success('Specialization added')
      setForm({ name: '', description: '' })
      qc.invalidateQueries({ queryKey: ['admin-specs'] })
      qc.invalidateQueries({ queryKey: ['specializations'] })
    },
    onError: e => toast.error(apiError(e)),
  })

  const items: Specialization[] = Array.isArray(data) ? data : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-800">Specializations</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage the catalog of medical specialties</p>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Plus size={14} className="text-teal-600" /> Add Specialization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Cardiology"
              className="input text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description (optional)"
              className="input text-sm" />
          </div>
        </div>
        <button
          onClick={() => create()}
          disabled={creating || !form.name.trim()}
          className="btn-primary text-xs mt-3 px-4 py-2">
          {creating ? <Spinner size={14} className="text-white" /> : 'Add'}
        </button>
      </div>

      {isLoading ? (
        <div className="py-12"><Spinner size={28} /></div>
      ) : !items.length ? (
        <EmptyState icon={Sparkles} title="No specializations yet"
          desc="Add the first one above." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {items.map(spec => (
            <div key={spec.id} className="card p-5 flex items-start gap-3">
              <span className="text-3xl shrink-0">{getSpecIcon(spec.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{spec.name}</p>
                {spec.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{spec.description}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-2">ID #{spec.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [reviewingId, setReviewingId] = useState<number | null>(null)

  // Pull pending count for the tab badge
  const { data: pendingCountData } = useQuery({
    queryKey: ['admin-pending-doctors'],
    queryFn:  () => doctorApi.search({ page: 1, page_size: 50 } as any)
      .then(r => r.data.data ?? r.data),
  })
  const pendingCount = (() => {
    const items: DoctorSummary[] =
      (pendingCountData as any)?.results ??
      (pendingCountData as any)?.items ??
      (Array.isArray(pendingCountData) ? pendingCountData : []) ??
      []
    return items.filter(d => !d.is_verified).length
  })()

  if (loading) return <PageLoader />
  if (!user)   return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-btn shrink-0">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <h1 className="section-title flex items-center gap-2">
              Admin Panel
              <span className="badge-teal text-[10px]">Admin</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Welcome back, {user.full_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-100 shadow-card">
          <TabButton active={tab === 'overview'}
            icon={LayoutDashboard} label="Overview"
            count={pendingCount}
            onClick={() => setTab('overview')} />
          <TabButton active={tab === 'doctors'}
            icon={Stethoscope} label="Doctors"
            onClick={() => setTab('doctors')} />
          <TabButton active={tab === 'specializations'}
            icon={Sparkles} label="Specializations"
            onClick={() => setTab('specializations')} />
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {tab === 'overview'        && <OverviewTab onReview={setReviewingId} />}
        {tab === 'doctors'         && <DoctorsTab  onReview={setReviewingId} />}
        {tab === 'specializations' && <SpecializationsTab />}
      </div>

      {/* Verify modal */}
      <VerifyModal doctorId={reviewingId} onClose={() => setReviewingId(null)} />
    </div>
  )
}