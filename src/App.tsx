import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import { PageLoader, Spinner } from './components/ui'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { doctorApi } from './services/api'
import { getSpecIcon } from './utils/helpers'
import type { ReactNode } from 'react'

// Pages
import HomePage          from './pages/HomePage'
import SearchPage        from './pages/SearchPage'
import DoctorProfilePage from './pages/DoctorProfilePage'
import LoginPage         from './pages/auth/LoginPage'
import RegisterPage      from './pages/auth/RegisterPage'
import PatientDashboard  from './pages/dashboard/PatientDashboard'
import DoctorDashboard   from './pages/dashboard/DoctorDashboard'
import AdminDashboard    from './pages/dashboard/AdminDashboard'
import NotificationsPage from './pages/NotificationsPage'
import type { UserRole } from './types'

// ── Protected Route ────────────────────────────────────────────────────────────
interface ProtectedProps {
  children: ReactNode
  roles?:   UserRole[]
}
function Protected({ children, roles }: ProtectedProps) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

// ── Specializations Page ───────────────────────────────────────────────────────
function SpecializationsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['specializations'],
    queryFn:  () => doctorApi.getSpecializations().then(r => r.data.data ?? r.data ?? []),
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="page-header">
        <h1 className="section-title">All Specializations</h1>
        <p className="text-slate-500 text-sm mt-1">Find the right specialist for your condition</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 stagger">
          {(data ?? []).map(spec => (
            <button key={spec.id}
              onClick={() => navigate(`/search?specialization_id=${spec.id}&specialization_name=${encodeURIComponent(spec.name)}`)}
              className="card-hover p-5 flex flex-col items-center gap-3 text-center group">
              <span className="text-4xl group-hover:scale-110 transition-transform">
                {getSpecIcon(spec.name)}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700">{spec.name}</p>
                {spec.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{spec.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── All Routes ─────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/"                element={<HomePage />} />
        <Route path="/search"          element={<SearchPage />} />
        <Route path="/doctors/:id"     element={<DoctorProfilePage />} />
        <Route path="/specializations" element={<SpecializationsPage />} />
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />

        <Route path="/notifications"
          element={<Protected><NotificationsPage /></Protected>} />

        <Route path="/patient/dashboard"
          element={<Protected roles={['patient']}><PatientDashboard /></Protected>} />

        <Route path="/doctor/dashboard"
          element={<Protected roles={['doctor']}><DoctorDashboard /></Protected>} />

        <Route path="/admin"
          element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
        <Route path="/admin/*"
          element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />

        <Route path="*" element={
          <div className="text-center py-24">
            <p className="font-display text-6xl font-bold text-slate-200 mb-4">404</p>
            <p className="text-slate-500 mb-6">Page not found</p>
            <a href="/" className="btn-primary inline-flex">Go Home</a>
          </div>
        } />
      </Routes>
    </Layout>
  )
}

// ── App — BrowserRouter lives HERE so it can never be missing ─────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}