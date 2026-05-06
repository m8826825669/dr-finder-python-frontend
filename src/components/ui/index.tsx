import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { Loader2, Star, StarHalf, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { getInitials } from '../../utils/helpers'
import type { AvatarSize, SelectOption } from '../../types'

// ── Spinner ───────────────────────────────────────────────────────────────────
interface SpinnerProps { size?: number; className?: string }
export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return <Loader2 size={size} className={clsx('animate-spin text-teal-600', className)} />
}

// ── Page Loader ───────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Spinner size={36} />
      <p className="text-sm text-slate-500">Loading…</p>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?:   React.ComponentType<{ size?: number; className?: string }>
  title:   string
  desc?:   string
  action?: ReactNode
}
export function EmptyState({ icon: Icon, title, desc, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Icon size={28} className="text-slate-400" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-slate-700">{title}</h3>
      {desc   && <p className="text-sm text-slate-500 max-w-xs">{desc}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ── Error Banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
      <AlertCircle size={18} className="shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
interface AvatarProps {
  name:       string
  src?:       string | null
  size?:      AvatarSize
  className?: string
}
export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const sizes: Record<AvatarSize, string> = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }
  return src ? (
    <img src={src} alt={name}
      className={clsx('rounded-full object-cover ring-2 ring-white shadow', sizes[size], className)} />
  ) : (
    <div className={clsx(
      'rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold ring-2 ring-white shadow',
      sizes[size], className
    )}>
      {getInitials(name)}
    </div>
  )
}

// ── Star Rating ───────────────────────────────────────────────────────────────
interface StarRatingProps { rating?: number; count?: number; size?: number }
export function StarRating({ rating = 0, count, size = 14 }: StarRatingProps) {
  const full  = Math.floor(rating)
  const half  = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center gap-0.5">
        {Array(full).fill(0).map((_, i) => <Star key={i} size={size} className="fill-amber-400 text-amber-400" />)}
        {half && <StarHalf size={size} className="fill-amber-400 text-amber-400" />}
        {Array(empty).fill(0).map((_, i) => <Star key={i} size={size} className="text-slate-300" />)}
      </span>
      {count != null && <span className="text-xs text-slate-500">({count})</span>}
    </span>
  )
}

// ── Field (labeled input) ─────────────────────────────────────────────────────
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:     string
  error?:     string
}
export function Field({ label, error, className = '', ...props }: FieldProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input
        className={clsx('input', error && 'border-red-400 focus:ring-red-400', className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string
  options:  SelectOption[]
}
export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={clsx('input appearance-none', className)} {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open:     boolean
  onClose:  () => void
  title?:   string
  children: ReactNode
  width?:   string
}
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-2xl w-full animate-slide-up', width)}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h3 className="font-display text-lg font-semibold text-slate-800">{title}</h3>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
interface PaginationProps {
  page:        number
  totalPages:  number
  onChange:    (page: number) => void
}
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 0}
        className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">← Prev</button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i).map(i => (
        <button key={i} onClick={() => onChange(i)}
          className={clsx('w-8 h-8 rounded-lg text-xs font-medium transition-colors',
            i === page ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
          {i + 1}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}
        className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next →</button>
    </div>
  )
}

// ── Doctor Card Skeleton ──────────────────────────────────────────────────────
export function DoctorCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex gap-4">
        <div className="skeleton w-16 h-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-3/4 rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-7 w-20 rounded-full" />
        <div className="skeleton h-7 w-24 rounded-full" />
      </div>
    </div>
  )
}