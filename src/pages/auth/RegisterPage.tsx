import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Field, ErrorBanner, Spinner } from '../../components/ui'
import { Stethoscope, Eye, EyeOff } from 'lucide-react'
import { apiError } from '../../utils/helpers'
import type { UserRole, RegisterRequest } from '../../types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function RegisterPage() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterRequest>({
    full_name: '', email: '', phone: '', password: '', role: 'patient',
  })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = <K extends keyof RegisterRequest>(k: K, v: RegisterRequest[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      await login(form.email, form.password)
      toast.success('Account created successfully!')
      navigate(form.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-btn mx-auto mb-4">
            <Stethoscope size={24} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-800">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Join DoctorFinder today</p>
        </div>
        <div className="card p-8 shadow-card-lg">
          {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

          {/* Role toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            {(['patient', 'doctor'] as UserRole[]).map(role => (
              <button key={role} type="button" onClick={() => set('role', role)}
                className={clsx('flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all',
                  form.role === role ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:text-slate-700')}>
                {role === 'patient' ? '🤒 Patient' : '👨‍⚕️ Doctor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name" required placeholder="Dr. Priya Sharma"
              value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            <Field label="Email address" type="email" required
              value={form.email} onChange={e => set('email', e.target.value)} />
            <Field label="Phone number" type="tel" placeholder="+91 9876543210"
              value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required minLength={8}
                  className="input pr-10" placeholder="Min 8 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm font-semibold mt-2">
              {loading
                ? <Spinner size={18} className="text-white" />
                : `Create ${form.role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}