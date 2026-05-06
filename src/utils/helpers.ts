import { format, parseISO } from 'date-fns'
import type { AppointmentStatus, ConsultationType, BadgeVariant } from '../types'

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmt = {
  date:     (d: string | Date | null | undefined): string =>
    d ? format(typeof d === 'string' ? parseISO(d) : d, 'dd MMM yyyy') : '—',

  time:     (t: string | null | undefined): string =>
    t ? t.slice(0, 5) : '—',

  datetime: (d: string | null | undefined): string =>
    d ? format(parseISO(d), 'dd MMM yyyy, hh:mm a') : '—',

  currency: (n: number | null | undefined): string =>
    n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—',

  rating:   (r: number | null | undefined): string =>
    r != null ? Number(r).toFixed(1) : '0.0',
}

// ─── Appointment status → badge CSS class ────────────────────────────────────
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING:   'badge-amber',
  CONFIRMED: 'badge-blue',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
  NO_SHOW:   'badge-slate',
}

// ─── Day names (index 0 = Monday) ────────────────────────────────────────────
export const DAY_NAMES: string[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

// ─── Consultation type labels ─────────────────────────────────────────────────
export const CONSULTATION_LABELS: Record<ConsultationType, string> = {
  IN_PERSON: 'In Person',
  VIDEO:     'Video Call',
  PHONE:     'Phone',
}

// ─── Extract readable message from Axios error ────────────────────────────────
export function apiError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    const res = e.response as Record<string, unknown> | undefined
    const data = res?.data as Record<string, unknown> | undefined
    return (
      (typeof data?.message === 'string' ? data.message : undefined) ??
      (typeof data?.detail  === 'string' ? data.detail  : undefined) ??
      (typeof e.message === 'string' ? e.message : undefined) ??
      'Something went wrong'
    )
  }
  return 'Something went wrong'
}

// ─── Get initials from name ───────────────────────────────────────────────────
export function getInitials(name: string = ''): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
}

// ─── Specialization icons ─────────────────────────────────────────────────────
export const SPEC_ICONS: Record<string, string> = {
  'Cardiology':       '❤️',
  'Neurology':        '🧠',
  'Orthopedics':      '🦴',
  'Dermatology':      '🌿',
  'Pediatrics':       '👶',
  'Psychiatry':       '🧘',
  'Ophthalmology':    '👁️',
  'ENT':              '👂',
  'Gynecology':       '🌸',
  'General Medicine': '⚕️',
  'Dentistry':        '🦷',
  'Oncology':         '🔬',
}

export const getSpecIcon = (name: string): string => SPEC_ICONS[name] ?? '🏥'

// ─── Clamp text ───────────────────────────────────────────────────────────────
export function clampText(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

// ─── Sort options ─────────────────────────────────────────────────────────────
export interface SortOption {
  value: string
  label: string
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'relevance',  label: 'Most Relevant' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'fee_asc',    label: 'Fee: Low to High' },
  { value: 'fee_desc',   label: 'Fee: High to Low' },
  { value: 'experience', label: 'Most Experienced' },
]