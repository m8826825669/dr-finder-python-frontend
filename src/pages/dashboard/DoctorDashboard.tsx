import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentApi, doctorApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Avatar, PageLoader, EmptyState, Spinner, StarRating } from '../../components/ui'
import { fmt, DAY_NAMES, apiError, getSpecIcon } from '../../utils/helpers'
import type {
  Appointment, AvailabilityRequest, ConsultationType, DoctorDetail,
} from '../../types'
import {
  Calendar, Clock, CheckCircle, Plus, Trash2, ClipboardList, Star,
  User, BadgeCheck, Briefcase, MapPin, GraduationCap, IndianRupee,
  Edit3, ShieldCheck, Sparkles, Video, Home, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { format } from 'date-fns'
import React from 'react'
import DoctorProfileWizard from './DoctorProfileWizard'

// ── Status colors (lowercase to match backend) ───────────────────────────────
const STATUS_COLORS_LC: Record<string, string> = {
  pending:   'badge-amber',
  confirmed: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
  no_show:   'badge-slate',
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon:   React.ComponentType<{ size?: number; className?: string }>
  label:  string
  value:  number | string
  color?: 'teal' | 'blue' | 'amber' | 'green' | 'red'
}
function StatCard({ icon: Icon, label, value, color = 'teal' }: StatCardProps) {
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
        <p className="text-2xl font-display font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

// ── Appointment Row ───────────────────────────────────────────────────────────
interface AppointmentRowProps {
  appt:       Appointment
  onConfirm:  (id: number) => void
  onComplete: (id: number) => void
}
function AppointmentRow({ appt, onConfirm, onComplete }: AppointmentRowProps) {
  const status = (appt.status ?? '').toLowerCase()
  const sc = STATUS_COLORS_LC[status] ?? 'badge-slate'
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <Avatar name={appt.patient_name ?? '?'} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{appt.patient_name}</p>
        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
          <Calendar size={10} /> {fmt.date((appt as any).slot_date ?? (appt as any).appointment_date)}
          <Clock size={10} /> {fmt.time(appt.start_time)}
        </p>
        {appt.symptoms && <p className="text-xs text-slate-400 mt-0.5 truncate">"{appt.symptoms}"</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={clsx('badge text-xs capitalize', sc)}>{status}</span>
        {status === 'pending' && (
          <button onClick={() => onConfirm(appt.id)} className="btn-primary text-xs px-3 py-1.5">
            Confirm
          </button>
        )}
        {status === 'confirmed' && (
          <button onClick={() => onComplete(appt.id)}
            className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors font-medium">
            Complete
          </button>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// AVAILABILITY MANAGER — unchanged behavior, takes doctorId as prop
// ════════════════════════════════════════════════════════════════════════════════
function AvailabilityManager({ doctorId }: { doctorId: number | string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '13:00',
    slot_duration_minutes: 30,
    consultation_type: 'in_person' as ConsultationType,
  })
  const [slotForm, setSlotForm] = useState({
    from_date: format(new Date(), 'yyyy-MM-dd'),
    to_date: '',
  })

  const { data: avails } = useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn:  () => doctorApi.getAvailability(doctorId).then(r => r.data.data ?? r.data ?? []),
    enabled:  !!doctorId,
  })

  const { mutate: addAvail, isPending: adding } = useMutation({
    mutationFn: () => {
      const body: AvailabilityRequest = {
        ...form,
        start_time: form.start_time + ':00',
        end_time:   form.end_time   + ':00',
      }
      return doctorApi.addAvailability(doctorId, body)
    },
    onSuccess: () => { toast.success('Availability added'); qc.invalidateQueries({ queryKey: ['doctor-availability', doctorId] }) },
    onError:   e => toast.error(apiError(e)),
  })

  const { mutate: deleteAvail } = useMutation({
    mutationFn: (id: number) => doctorApi.deleteAvailability(doctorId, id),
    onSuccess: () => { toast.success('Removed'); qc.invalidateQueries({ queryKey: ['doctor-availability', doctorId] }) },
  })

  const { mutate: genSlots, isPending: generating } = useMutation({
    mutationFn: () => doctorApi.generateSlots(doctorId, slotForm),
    onSuccess: r => toast.success(typeof r.data.data === 'string' ? r.data.data : 'Slots generated!'),
    onError:   e => toast.error(apiError(e)),
  })

  const availList: any[] = Array.isArray(avails) ? avails : []

  return (
    <div className="space-y-6">
      {/* Current schedule */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Current Schedule</h4>
        {!availList.length && <p className="text-xs text-slate-400 italic">No schedule set yet.</p>}
        <div className="space-y-2">
          {availList.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-xs">
              <span className="font-semibold text-slate-700 w-24">{DAY_NAMES[a.day_of_week]}</span>
              <span className="text-slate-500">{fmt.time(a.start_time)} – {fmt.time(a.end_time)}</span>
              <span className="badge-teal">{a.slot_duration_minutes} min</span>
              <button onClick={() => deleteAvail(a.id)} className="ml-auto text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add schedule */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
        <h4 className="text-sm font-semibold text-teal-800 mb-3 flex items-center gap-2"><Plus size={14} /> Add Schedule</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-teal-700">Day</label>
            <select className="input text-sm" value={form.day_of_week}
              onChange={e => setForm(f => ({ ...f, day_of_week: Number(e.target.value) }))}>
              {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-teal-700">Slot Duration</label>
            <select className="input text-sm" value={form.slot_duration_minutes}
              onChange={e => setForm(f => ({ ...f, slot_duration_minutes: Number(e.target.value) }))}>
              {[15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
          <div>
            <label className="label text-teal-700">Start Time</label>
            <input type="time" className="input text-sm" value={form.start_time}
              onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
          </div>
          <div>
            <label className="label text-teal-700">End Time</label>
            <input type="time" className="input text-sm" value={form.end_time}
              onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
          </div>
          <div>
            <label className="label text-teal-700">Type</label>
            <select className="input text-sm" value={form.consultation_type}
              onChange={e => setForm(f => ({ ...f, consultation_type: e.target.value as ConsultationType }))}>
              <option value="in_person">In Person</option>
              <option value="video">Video</option>
              <option value="phone">Phone</option>
            </select>
          </div>
        </div>
        <button onClick={() => addAvail()} disabled={adding} className="btn-primary text-xs mt-3 px-4 py-2">
          {adding ? <Spinner size={14} className="text-white" /> : 'Add Schedule'}
        </button>
      </div>

      {/* Generate slots */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-3">Generate Time Slots</h4>
        <p className="text-xs text-blue-600 mb-3">Creates bookable slots from your schedule for a date range.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-blue-700">From</label>
            <input type="date" className="input text-sm" value={slotForm.from_date}
              onChange={e => setSlotForm(f => ({ ...f, from_date: e.target.value }))} />
          </div>
          <div>
            <label className="label text-blue-700">To</label>
            <input type="date" className="input text-sm" value={slotForm.to_date}
              onChange={e => setSlotForm(f => ({ ...f, to_date: e.target.value }))} />
          </div>
        </div>
        <button onClick={() => genSlots()} disabled={generating || !slotForm.to_date}
          className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {generating ? <Spinner size={14} className="text-white" /> : 'Generate Slots'}
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// PROFILE OVERVIEW TAB
// ════════════════════════════════════════════════════════════════════════════════
interface ProfileOverviewProps {
  profile: DoctorDetail
  onEdit:  () => void
}
function ProfileOverview({ profile: p, onEdit }: ProfileOverviewProps) {
  return (
    <div className="space-y-5">
      {/* Verification banner */}
      {!p.is_verified ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-900">Awaiting verification</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Your profile is being reviewed by our admin team. Once verified, you'll appear in patient search results.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
          <BadgeCheck size={18} className="text-green-600 shrink-0" />
          <div className="flex-1 text-sm text-green-800">
            <span className="font-semibold">Verified</span> — your profile is live and patients can book with you.
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <Avatar name={p.full_name} src={(p as any).avatar_url} size="xl" />
            <div>
              <h2 className="font-display text-xl font-bold text-slate-800">Dr. {p.full_name}</h2>
              <p className="text-sm text-teal-600 font-medium mt-0.5">
                {getSpecIcon(p.specialization ?? '')} {p.specialization ?? '—'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                {p.city && <span className="flex items-center gap-1"><MapPin size={11} /> {p.city}</span>}
                <span className="flex items-center gap-1"><Briefcase size={11} /> {p.experience_years} years</span>
                <StarRating rating={p.avg_rating} count={p.total_reviews} size={11} />
              </div>
            </div>
          </div>
          <button onClick={onEdit} className="btn-secondary text-xs">
            <Edit3 size={12} /> Edit Profile
          </button>
        </div>

        {/* Quick info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Fee</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{fmt.currency(p.consultation_fee)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Video Fee</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {(p as any).video_fee ? fmt.currency((p as any).video_fee) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Registration #</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5 break-all">{p.registration_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Patients</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{(p as any).total_patients ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Services / availability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {p.clinic_name && (
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <MapPin size={13} className="text-teal-600" /> Clinic
            </p>
            <p className="text-sm font-semibold text-slate-800">{p.clinic_name}</p>
            {p.clinic_address && <p className="text-xs text-slate-500 mt-1">{p.clinic_address}</p>}
            {(p.city || p.state || (p as any).pincode) && (
              <p className="text-xs text-slate-500 mt-0.5">
                {[p.city, p.state, (p as any).pincode].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-700 mb-3">Consultation Types</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-teal-600" /> In-Person
              <span className="ml-auto badge-teal text-[10px]">Default</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Video size={14} className={p.available_for_video ? 'text-teal-600' : 'text-slate-300'} />
              <span className={p.available_for_video ? 'text-slate-800' : 'text-slate-400'}>Video</span>
              {p.available_for_video && <span className="ml-auto badge-green text-[10px]">On</span>}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Home size={14} className={(p as any).available_for_home ? 'text-teal-600' : 'text-slate-300'} />
              <span className={(p as any).available_for_home ? 'text-slate-800' : 'text-slate-400'}>Home Visits</span>
              {(p as any).available_for_home && <span className="ml-auto badge-green text-[10px]">On</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {p.bio && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-700 mb-2">About</p>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{p.bio}</p>
        </div>
      )}

      {/* Qualifications */}
      {p.qualifications && p.qualifications.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <GraduationCap size={13} className="text-teal-600" /> Qualifications
          </p>
          <div className="space-y-2">
            {p.qualifications.map((q: any, i: number) => (
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

      {/* Languages */}
      {p.languages && p.languages.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-700 mb-2">Languages</p>
          <div className="flex flex-wrap gap-1.5">
            {p.languages.map((l: string) => (
              <span key={l} className="badge-slate text-[10px]">{l}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN DOCTOR DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
type DashTab = 'overview' | 'appointments' | 'schedule'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<DashTab>('overview')
  const [editing, setEditing] = useState(false)

  // Pull doctor's own profile — handles "no profile yet" case
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['my-doctor-profile'],
    queryFn:  () => doctorApi.getMyProfile()
      .then(r => (r.data.data ?? r.data) as DoctorDetail | null),
  })
  const profile = profileData ?? null
  const hasProfile = !!profile

  // Appointments — only fetched once we have a profile
  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn:  () => appointmentApi.getDoctorAppointments({ page: 1, page_size: 50 })
      .then(r => r.data.data ?? r.data),
    enabled:  hasProfile,
  })

  const { mutate: confirm } = useMutation({
    mutationFn: (id: number) => appointmentApi.confirm(id),
    onSuccess: () => { toast.success('Confirmed!'); qc.invalidateQueries({ queryKey: ['doctor-appointments'] }) },
    onError:   e => toast.error(apiError(e)),
  })

  const { mutate: complete } = useMutation({
    mutationFn: (id: number) => appointmentApi.complete(id),
    onSuccess: () => { toast.success('Marked complete!'); qc.invalidateQueries({ queryKey: ['doctor-appointments'] }) },
    onError:   e => toast.error(apiError(e)),
  })

  if (profileLoading) return <PageLoader />

  // ── STATE 1: No profile yet — show onboarding wizard ────────────────────────
  if (!hasProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="page-header text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 items-center justify-center shadow-btn mb-3">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800">
            Welcome, Dr. {user?.full_name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Let's set up your profile so patients can find and book with you
          </p>
        </div>
        <DoctorProfileWizard
          onComplete={() => {
            qc.invalidateQueries({ queryKey: ['my-doctor-profile'] })
            setTab('overview')
          }}
        />
      </div>
    )
  }

  // ── STATE 2: Editing existing profile ───────────────────────────────────────
  if (editing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="page-header">
          <h1 className="font-display text-2xl font-bold text-slate-800">Edit Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Update your details. Changes go live after save.
          </p>
        </div>
        <DoctorProfileWizard
          existingProfile={profile}
          onComplete={() => {
            qc.invalidateQueries({ queryKey: ['my-doctor-profile'] })
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  // ── STATE 3: Normal dashboard ───────────────────────────────────────────────
  const appts = ((apptData as any)?.results ?? (apptData as any)?.items ?? []) as Appointment[]
  const pending   = appts.filter(a => (a.status ?? '').toLowerCase() === 'pending').length
  const confirmed = appts.filter(a => (a.status ?? '').toLowerCase() === 'confirmed').length
  const completed = appts.filter(a => (a.status ?? '').toLowerCase() === 'completed').length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar name={user?.full_name ?? '?'} src={(profile as any)?.avatar_url} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
              Dr. {user?.full_name}
              {profile.is_verified && <BadgeCheck size={20} className="text-green-600" />}
            </h1>
            <p className="text-teal-600 text-sm font-medium">{profile.specialization}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ClipboardList} label="Total"     value={appts.length} color="teal"  />
        <StatCard icon={Clock}         label="Pending"   value={pending}      color="amber" />
        <StatCard icon={CheckCircle}   label="Confirmed" value={confirmed}    color="blue"  />
        <StatCard icon={Star}          label="Completed" value={completed}    color="green" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {([
          { key: 'overview',     label: 'Profile' },
          { key: 'appointments', label: 'Appointments' },
          { key: 'schedule',     label: 'Schedule' },
        ] as { key: DashTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all',
              tab === t.key
                ? 'bg-teal-600 text-white shadow-btn'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <ProfileOverview profile={profile} onEdit={() => setEditing(true)} />
      )}

      {tab === 'appointments' && (
        <div className="card overflow-hidden">
          {apptLoading ? (
            <div className="p-8 flex justify-center"><Spinner size={28} /></div>
          ) : appts.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments yet"
              desc="Once patients book with you, they'll appear here." />
          ) : (
            appts.map(a => (
              <AppointmentRow key={a.id} appt={a}
                onConfirm={id => confirm(id)}
                onComplete={id => complete(id)}
              />
            ))
          )}
        </div>
      )}

      {tab === 'schedule' && (
        <div className="card p-6">
          <AvailabilityManager doctorId={profile.id} />
        </div>
      )}
    </div>
  )
}