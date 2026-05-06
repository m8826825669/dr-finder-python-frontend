import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { appointmentApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Avatar, PageLoader, EmptyState, Pagination, Modal } from '../../components/ui'
import { fmt, STATUS_COLORS, CONSULTATION_LABELS } from '../../utils/helpers'
import type { Appointment, AppointmentStatus, ReviewRequest } from '../../types'
import { Calendar, Clock, User, Video, Star, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ── Appointment Card ───────────────────────────────────────────────────────────
interface AppointmentCardProps {
  appt:     Appointment
  onCancel: (id: number) => void
  onReview: (appt: Appointment) => void
}
function AppointmentCard({ appt, onCancel, onReview }: AppointmentCardProps) {
  const statusCls = STATUS_COLORS[appt.status] ?? 'badge-slate'
  return (
    <div className="card p-5 hover:shadow-card-lg transition-all">
      <div className="flex items-start gap-4">
        <Avatar name={appt.doctor_name ?? '?'} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Dr. {appt.doctor_name}</h3>
              <p className="text-xs text-teal-600 font-medium">{appt.specialization}</p>
            </div>
            <span className={clsx('badge shrink-0', statusCls)}>{appt.status}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={11} /> {fmt.date(appt.slot_date)}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {fmt.time(appt.start_time)}</span>
            <span className="flex items-center gap-1">
              {appt.consultation_type === 'VIDEO' ? <Video size={11} /> : <User size={11} />}
              {CONSULTATION_LABELS[appt.consultation_type]}
            </span>
            <span className="font-medium text-slate-700">{fmt.currency(appt.fee_paid)}</span>
          </div>
          {appt.prescription && (
            <div className="mt-2 p-2.5 rounded-lg bg-teal-50 text-xs text-teal-800">
              <span className="font-semibold">Rx: </span>{appt.prescription}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Link to={`/doctors/${appt.doctor_id}`} className="btn-ghost text-xs px-3 py-1.5 gap-1">
              <ChevronRight size={12} /> View Doctor
            </Link>
            {(['PENDING', 'CONFIRMED'] as AppointmentStatus[]).includes(appt.status) && (
              <button onClick={() => onCancel(appt.id)}
                className="badge-red cursor-pointer text-xs px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                Cancel
              </button>
            )}
            {appt.status === 'COMPLETED' && (
              <button onClick={() => onReview(appt)}
                className="badge-amber cursor-pointer text-xs px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1">
                <Star size={10} /> Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Review Modal ───────────────────────────────────────────────────────────────
interface ReviewModalProps {
  appt:    Appointment | null
  onClose: () => void
}
function ReviewModal({ appt, onClose }: ReviewModalProps) {
  const qc = useQueryClient()
  const [rating,  setRating]  = useState(5)
  const [comment, setComment] = useState('')
  const [anon,    setAnon]    = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!appt) throw new Error('No appointment')
      const body: ReviewRequest = { rating, comment, is_anonymous: anon }
      return appointmentApi.review(appt.id, body)
    },
    onSuccess: () => {
      toast.success('Review submitted!')
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
      onClose()
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      toast.error(err?.response?.data?.detail ?? 'Failed to submit review')
    },
  })

  return (
    <Modal open={!!appt} onClose={onClose} title={`Review Dr. ${appt?.doctor_name}`}>
      <div className="space-y-4">
        <div>
          <label className="label">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                className={clsx('w-10 h-10 rounded-xl font-bold text-sm transition-all',
                  n <= rating ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400 hover:bg-amber-100')}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Comment (optional)</label>
          <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Share your experience…" className="input resize-none text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} className="rounded" />
          Submit anonymously
        </label>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm">Cancel</button>
          <button onClick={() => mutate()} disabled={isPending}
            className="btn-primary flex-1 justify-center text-sm">
            {isPending ? '…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Patient Dashboard ──────────────────────────────────────────────────────────
const STATUS_TABS: Array<AppointmentStatus | ''> = ['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export default function PatientDashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const [status,     setStatus]     = useState<AppointmentStatus | ''>('')
  const [page,       setPage]       = useState(0)
  const [reviewAppt, setReviewAppt] = useState<Appointment | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-appointments', status, page],
    queryFn: () => appointmentApi.getMyAppointments({
      status: status || undefined, page, page_size: 8,
    }).then(r => r.data.data ?? r.data),
  })

  const { mutate: cancelMutate } = useMutation({
    mutationFn: (id: number) => appointmentApi.cancel(id, {}),
    onSuccess: () => { toast.success('Appointment cancelled'); qc.invalidateQueries({ queryKey: ['my-appointments'] }) },
    onError:   (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      toast.error(err?.response?.data?.detail ?? 'Cancel failed')
    },
  })

  const appts      = data?.results ?? []
  const total      = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user?.full_name ?? '?'} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">
              Hello, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 text-sm">{total} appointment{total !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <button onClick={() => navigate('/search')} className="btn-primary text-sm gap-2">
          Find a Doctor
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5">
        {STATUS_TABS.map(s => (
          <button key={s || 'all'} onClick={() => { setStatus(s); setPage(0) }}
            className={clsx('px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
              status === s ? 'bg-teal-600 text-white shadow-btn' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300')}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Appointments */}
      {appts.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments yet"
          desc="Find a doctor and book your first appointment."
          action={<button onClick={() => navigate('/search')} className="btn-primary text-sm">Browse Doctors</button>}
        />
      ) : (
        <div className="space-y-3 stagger">
          {appts.map(appt => (
            <AppointmentCard key={appt.id} appt={appt}
              onCancel={id => cancelMutate(id)}
              onReview={a => setReviewAppt(a)}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      <ReviewModal appt={reviewAppt} onClose={() => setReviewAppt(null)} />
    </div>
  )
}