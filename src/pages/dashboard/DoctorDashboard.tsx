import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentApi, doctorApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Avatar, PageLoader, EmptyState, Spinner } from '../../components/ui'
import { fmt, STATUS_COLORS, DAY_NAMES } from '../../utils/helpers'
import type { Appointment, AvailabilityRequest, ConsultationType } from '../../types'
import { Calendar, Clock, CheckCircle, Plus, Trash2, ClipboardList, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { format } from 'date-fns'
import React from 'react'

// ── Stat Card ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon:   React.ComponentType<{ size?: number; className?: string }>
  label:  string
  value:  number | string
  color?: string
}
function StatCard({ icon: Icon, label, value, color = 'teal' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`w-11 h-11 rounded-2xl bg-${color}-100 flex items-center justify-center shrink-0`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

// ── Appointment Row ────────────────────────────────────────────────────────────
interface AppointmentRowProps {
  appt:       Appointment
  onConfirm:  (id: number) => void
  onComplete: (id: number) => void
}
function AppointmentRow({ appt, onConfirm, onComplete }: AppointmentRowProps) {
  const sc = STATUS_COLORS[appt.status] ?? 'badge-slate'
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <Avatar name={appt.patient_name ?? '?'} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{appt.patient_name}</p>
        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
          <Calendar size={10} /> {fmt.date(appt.slot_date)}
          <Clock size={10} /> {fmt.time(appt.start_time)}
        </p>
        {appt.symptoms && <p className="text-xs text-slate-400 mt-0.5 truncate">"{appt.symptoms}"</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={clsx('badge text-xs', sc)}>{appt.status}</span>
        {appt.status === 'PENDING' && (
          <button onClick={() => onConfirm(appt.id)} className="btn-primary text-xs px-3 py-1.5">
            Confirm
          </button>
        )}
        {appt.status === 'CONFIRMED' && (
          <button onClick={() => onComplete(appt.id)}
            className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors font-medium">
            Complete
          </button>
        )}
      </div>
    </div>
  )
}

// ── Availability Manager ───────────────────────────────────────────────────────
function AvailabilityManager({ doctorId }: { doctorId: number | string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '13:00',
    slot_duration_minutes: 30,
    consultation_type: 'IN_PERSON' as ConsultationType,
  })
  const [slotForm, setSlotForm] = useState({
    from_date: format(new Date(), 'yyyy-MM-dd'),
    to_date: '',
  })

  const { data: avails } = useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn:  () => doctorApi.getAvailability(doctorId).then(r => r.data.data ?? []),
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
    onError:   (e: unknown) => toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed'),
  })

  const { mutate: deleteAvail } = useMutation({
    mutationFn: (id: number) => doctorApi.deleteAvailability(doctorId, id),
    onSuccess: () => { toast.success('Removed'); qc.invalidateQueries({ queryKey: ['doctor-availability', doctorId] }) },
  })

  const { mutate: genSlots, isPending: generating } = useMutation({
    mutationFn: () => doctorApi.generateSlots(doctorId, slotForm),
    onSuccess: r => toast.success(typeof r.data.data === 'string' ? r.data.data : 'Slots generated!'),
    onError:   (e: unknown) => toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed'),
  })

  return (
    <div className="space-y-6">
      {/* Current schedule */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Current Schedule</h4>
        {!avails?.length && <p className="text-xs text-slate-400 italic">No schedule set yet.</p>}
        <div className="space-y-2">
          {avails?.map(a => (
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
              <option value="IN_PERSON">In Person</option>
              <option value="VIDEO">Video</option>
              <option value="PHONE">Phone</option>
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

// ── Doctor Dashboard (default export) ─────────────────────────────────────────
export default function DoctorDashboard() {
  const { user } = useAuth()
  const qc       = useQueryClient()
  const [tab, setTab] = useState<'appointments' | 'schedule'>('appointments')

  const { data: apptData, isLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn:  () => appointmentApi.getDoctorAppointments({ page: 0, page_size: 50 })
                     .then(r => r.data.data ?? r.data),
  })

  const { mutate: confirm } = useMutation({
    mutationFn: (id: number) => appointmentApi.confirm(id),
    onSuccess: () => { toast.success('Confirmed!'); qc.invalidateQueries({ queryKey: ['doctor-appointments'] }) },
    onError:   (e: unknown) => toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed'),
  })

  const { mutate: complete } = useMutation({
    mutationFn: (id: number) => appointmentApi.complete(id),
    onSuccess: () => { toast.success('Marked complete!'); qc.invalidateQueries({ queryKey: ['doctor-appointments'] }) },
    onError:   (e: unknown) => toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed'),
  })

  const appts     = (apptData?.results ?? []) as Appointment[]
  const pending   = appts.filter(a => a.status === 'PENDING').length
  const confirmed = appts.filter(a => a.status === 'CONFIRMED').length
  const completed = appts.filter(a => a.status === 'COMPLETED').length
  const doctorId  = appts[0]?.doctor_id

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user?.full_name ?? '?'} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">Dr. {user?.full_name}</h1>
            <p className="text-teal-600 text-sm font-medium">Doctor Dashboard</p>
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
      <div className="flex gap-2 mb-5">
        {(['appointments', 'schedule'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all',
              tab === t ? 'bg-teal-600 text-white shadow-btn' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300')}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'appointments' && (
        <div className="card overflow-hidden">
          {appts.length === 0
            ? <EmptyState icon={Calendar} title="No appointments yet" desc="Once patients book with you, they'll appear here." />
            : appts.map(a => (
                <AppointmentRow key={a.id} appt={a}
                  onConfirm={id => confirm(id)}
                  onComplete={id => complete(id)}
                />
              ))
          }
        </div>
      )}

      {tab === 'schedule' && (
        <div className="card p-6">
          {doctorId
            ? <AvailabilityManager doctorId={doctorId} />
            : <p className="text-sm text-slate-500 text-center py-8">Complete your doctor profile to manage schedule.</p>
          }
        </div>
      )}
    </div>
  )
}