import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Field, ErrorBanner, Spinner } from '../../components/ui'
import { Stethoscope, Eye, EyeOff } from 'lucide-react'
import { apiError } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate(
        user.role === 'doctor' ? '/doctor/dashboard' :
        user.role === 'admin'  ? '/patient/dashboard' :
        '/patient/dashboard'
      )
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-btn mx-auto mb-4">
            <Stethoscope size={24} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-800">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your DoctorFinder account</p>
        </div>
        <div className="card p-8 shadow-card-lg">
          {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email address" type="email" required autoComplete="email"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required
                  className="input pr-10"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm font-semibold">
              {loading ? <Spinner size={18} className="text-white" /> : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}