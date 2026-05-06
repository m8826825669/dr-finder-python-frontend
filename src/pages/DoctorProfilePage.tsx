import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { doctorApi, appointmentApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Avatar, StarRating, PageLoader, ErrorBanner, Modal, Spinner } from '../components/ui'
import { fmt, CONSULTATION_LABELS } from '../utils/helpers'
import type { TimeSlot, ConsultationType, DoctorDetail, Qualification } from '../types'
import {
  MapPin, Clock, Video, CheckCircle, GraduationCap,
  Globe, Calendar, ChevronLeft, User, Award,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import clsx from 'clsx'

// ── Slot Picker ────────────────────────────────────────────────────────────────
interface SlotPickerProps {
  doctorId: string
  onBook:   (args: { slotId: number; cType: ConsultationType; symptoms: string }) => void
}
function SlotPicker({ doctorId, onBook }: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [cType,    setCType]    = useState<ConsultationType>('IN_PERSON')
  const [symptoms, setSymptoms] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['slots', doctorId, selectedDate],
    queryFn:  () => doctorApi.getSlots(doctorId, selectedDate).then(r => r.data.data ?? []),
  })

  const slots = data ?? []
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i)
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE'), day: format(d, 'd') }
  })

  return (
    <div className="space-y-4">
      {/* Date tabs */}
      <div className="grid grid-cols-7 gap-1">
        {dates.map(d => (
          <button key={d.value}
            onClick={() => { setSelectedDate(d.value); setSelectedSlot(null) }}
            className={clsx(
              'flex flex-col items-center py-2 px-1 rounded-xl text-xs transition-all',
              selectedDate === d.value
                ? 'bg-teal-600 text-white shadow-btn'
                : 'bg-slate-100 text-slate-600 hover:bg-teal-50'
            )}>
            <span className="font-medium">{d.label}</span>
            <span className="text-base font-bold">{d.day}</span>
          </button>
        ))}
      </div>

      {/* Consultation type */}
      <div className="flex gap-2">
        {(['IN_PERSON', 'VIDEO'] as ConsultationType[]).map(v => (
          <button key={v} onClick={() => setCType(v)}
            className={clsx(
              'flex-1 py-2 rounded-xl text-xs font-medium transition-all border',
              cType === v
                ? 'border-teal-600 bg-teal-50 text-teal-700'
                : 'border-slate-200 text-slate-600 hover:border-teal-300'
            )}>
            {CONSULTATION_LABELS[v]}
          </button>
        ))}
      </div>

      {/* Slots grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-xl" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-6">
          No available slots on this date
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {slots.map(slot => (
            <button key={slot.id}
              onClick={() => setSelectedSlot(slot)}
              className={clsx(
                'py-2 px-3 rounded-xl text-xs font-medium transition-all border',
                selectedSlot?.id === slot.id
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-slate-200 hover:border-teal-400 text-slate-700'
              )}>
              {fmt.time(slot.start_time)}
            </button>
          ))}
        </div>
      )}

      {/* Symptoms input */}
      {selectedSlot && (
        <div>
          <label className="label">Symptoms (optional)</label>
          <textarea
            rows={2}
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="Briefly describe your symptoms…"
            className="input resize-none text-sm"
          />
        </div>
      )}

      <button
        disabled={!selectedSlot}
        onClick={() => {
          if (selectedSlot) onBook({ slotId: selectedSlot.id, cType, symptoms })
        }}
        className="btn-primary w-full justify-center py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
        {selectedSlot ? `Book ${fmt.time(selectedSlot.start_time)} slot` : 'Select a time slot'}
      </button>
    </div>
  )
}

// ── Doctor Profile Page ────────────────────────────────────────────────────────
export default function DoctorProfilePage() {
  const { id }       = useParams<{ id: string }>()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const [bookOpen,   setBookOpen]  = useState(false)
  const [activeTab,  setActiveTab] = useState<'about' | 'qualifications' | 'reviews'>('about')

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ['doctor', id],
    queryFn:  () => doctorApi.getById(id!).then(r => r.data.data ?? r.data),
    enabled:  !!id,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['doctor-reviews', id],
    queryFn:  () => doctorApi.getReviews(id!, { page: 0, page_size: 5 }).then(r => r.data.data ?? r.data),
    enabled:  activeTab === 'reviews' && !!id,
  })

  const { mutate: bookMutate, isPending: booking } = useMutation({
    mutationFn: ({ slotId, cType, symptoms }: { slotId: number; cType: ConsultationType; symptoms: string }) =>
      appointmentApi.book({
        doctor_id:         Number(id),
        time_slot_id:      slotId,
        consultation_type: cType,
        symptoms,
      }),
    onSuccess: () => {
      setBookOpen(false)
      toast.success('Appointment booked successfully!')
      navigate('/patient/dashboard')
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      toast.error(err?.response?.data?.detail ?? 'Booking failed')
    },
  })

  if (isLoading) return <PageLoader />
  if (error || !doctor) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <ErrorBanner message="Doctor not found" />
      </div>
    )
  }

  const d = doctor as DoctorDetail

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6 gap-2">
        <ChevronLeft size={16} /> Back to results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Profile ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header card */}
          <div className="card p-6">
            <div className="flex gap-5">
              <div className="relative shrink-0">
                <Avatar name={d.full_name} src={d.avatar_url} size="xl" />
                {d.is_verified && (
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center ring-2 ring-white">
                    <CheckCircle size={14} className="text-white" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-bold text-slate-800">
                    Dr. {d.full_name}
                  </h1>
                  {d.is_verified  && <span className="badge-teal mt-1">Verified</span>}
                  {d.is_featured  && <span className="badge-amber mt-1">⭐ Featured</span>}
                </div>
                <p className="text-teal-600 font-semibold mt-0.5">{d.specialization}</p>

                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <StarRating rating={d.avg_rating} count={d.total_reviews} />
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={11} /> {d.experience_years} years exp
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <User size={11} /> {d.total_patients} patients
                  </span>
                </div>

                {(d.city || d.clinic_name) && (
                  <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                    <MapPin size={13} />
                    {[d.clinic_name, d.clinic_address, d.city].filter(Boolean).join(', ')}
                  </p>
                )}

                {d.languages?.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Globe size={11} /> Speaks: {d.languages.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              {d.available_for_video && (
                <span className="badge-teal flex items-center gap-1">
                  <Video size={11} /> Video consult
                </span>
              )}
              {d.available_for_home && <span className="badge-blue">🏠 Home visit</span>}
              {d.accepting_new_patients
                ? <span className="badge-green">Accepting new patients</span>
                : <span className="badge-red">Not accepting</span>
              }
            </div>
          </div>

          {/* Tabs */}
          <div className="card overflow-hidden">
            <div className="flex border-b border-slate-100">
              {(['about', 'qualifications', 'reviews'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'flex-1 py-3 text-sm font-medium capitalize transition-colors',
                    activeTab === tab
                      ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  )}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* About tab */}
              {activeTab === 'about' && (
                <div className="space-y-3 animate-fade-in">
                  {d.bio
                    ? <p className="text-sm text-slate-600 leading-relaxed">{d.bio}</p>
                    : <p className="text-sm text-slate-400 italic">No bio available.</p>
                  }
                  {d.registration_number && (
                    <p className="text-xs text-slate-500 mt-2">
                      Registration: <span className="font-mono">{d.registration_number}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Qualifications tab */}
              {activeTab === 'qualifications' && (
                <div className="space-y-3 animate-fade-in">
                  {d.qualifications?.length > 0
                    ? d.qualifications.map((q: Qualification, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                          <GraduationCap size={18} className="text-teal-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{q.degree}</p>
                            <p className="text-xs text-slate-500">
                              {[q.college, q.year].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        </div>
                      ))
                    : <p className="text-sm text-slate-400 italic">No qualifications listed.</p>
                  }
                  {d.awards?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Awards</h4>
                      {d.awards.map((a: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                          <Award size={14} className="text-amber-500 shrink-0" /> {a}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-4 animate-fade-in">
                  {reviewsData?.results?.length > 0
                    ? reviewsData.results.map(r => (
                        <div key={r.id} className="p-4 rounded-xl bg-slate-50">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar name={r.patient_name} size="xs" />
                            <span className="text-sm font-medium text-slate-700">{r.patient_name}</span>
                            <StarRating rating={r.rating} size={12} />
                            <span className="text-xs text-slate-400 ml-auto">{fmt.date(r.created_at)}</span>
                          </div>
                          {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                        </div>
                      ))
                    : <p className="text-sm text-slate-400 italic">No reviews yet.</p>
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Booking sidebar ──────────────────────────────── */}
        <div className="space-y-4">
          {/* Fee card */}
          <div className="card p-5">
            <h3 className="font-display font-semibold text-slate-800 mb-3">Consultation Fees</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">In Person</span>
                <span className="font-semibold">{fmt.currency(d.consultation_fee)}</span>
              </div>
              {d.video_fee && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Video Call</span>
                  <span className="font-semibold">{fmt.currency(d.video_fee)}</span>
                </div>
              )}
              {d.follow_up_fee && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Follow-Up</span>
                  <span className="font-semibold">{fmt.currency(d.follow_up_fee)}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => user ? setBookOpen(true) : navigate('/login')}
              disabled={!d.accepting_new_patients}
              className="btn-primary w-full justify-center mt-4 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              <Calendar size={16} />
              {d.accepting_new_patients ? 'Book Appointment' : 'Not Accepting Patients'}
            </button>
            {!user && (
              <p className="text-xs text-slate-400 text-center mt-2">Sign in required to book</p>
            )}
          </div>

          {/* Quick stats */}
          <div className="card p-5 grid grid-cols-2 gap-4">
            {[
              [fmt.rating(d.avg_rating), 'Avg Rating',  'text-amber-500'],
              [d.total_reviews,          'Reviews',     'text-teal-600'],
              [d.total_patients,         'Patients',    'text-blue-600'],
              [`${d.experience_years}yr`,'Experience',  'text-purple-600'],
            ].map(([val, lbl, cls]) => (
              <div key={String(lbl)} className="text-center">
                <p className={`text-xl font-bold font-display ${cls}`}>{val}</p>
                <p className="text-xs text-slate-500 mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        title={`Book with Dr. ${d.full_name}`}
        width="max-w-md">
        {id && (
          <SlotPicker
            doctorId={id}
            onBook={args => bookMutate(args)}
          />
        )}
        {booking && (
          <div className="flex justify-center mt-3">
            <Spinner size={20} />
          </div>
        )}
      </Modal>
    </div>
  )
}