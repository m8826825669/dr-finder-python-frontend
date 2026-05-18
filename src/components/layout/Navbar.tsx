import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui'
import {
  Bell, Menu, X, Stethoscope, ChevronDown,
  LogOut, User, LayoutDashboard,
} from 'lucide-react'
import clsx from 'clsx'

export default function Navbar() {
  const { user, logout }  = useAuth()
  const navigate          = useNavigate()
  const location          = useLocation()
  const [dropOpen,   setDropOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  const dashboardPath =
    user?.role === 'doctor' ? '/doctor/dashboard' :
    user?.role === 'admin'  ? '/admin' :
    '/patient/dashboard'

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-btn group-hover:scale-105 transition-transform">
              <Stethoscope size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-800">
              Doctor<span className="text-teal-600">Finder</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/search"
              className={clsx('btn-ghost text-sm', isActive('/search') && 'bg-teal-50 text-teal-700')}>
              Find Doctors
            </Link>
            <Link to="/specializations"
              className={clsx('btn-ghost text-sm', isActive('/specializations') && 'bg-teal-50 text-teal-700')}>
              Specializations
            </Link>
            {user && (
              <Link to={dashboardPath}
                className={clsx('btn-ghost text-sm',
                  (isActive('/patient') || isActive('/doctor') || isActive('/admin')) && 'bg-teal-50 text-teal-700')}>
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications bell */}
                <Link to="/notifications" className="btn-ghost p-2 rounded-xl">
                  <Bell size={18} />
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                    <Avatar name={user.full_name} size="sm" />
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-slate-700 leading-none">{user.full_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">{user.role?.toLowerCase()}</p>
                    </div>
                    <ChevronDown size={14} className={clsx('text-slate-400 transition-transform', dropOpen && 'rotate-180')} />
                  </button>

                  {dropOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-card-lg border border-slate-100 z-20 py-1 animate-slide-up">
                        <Link to={dashboardPath}
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                          <LayoutDashboard size={16} className="text-teal-600" /> Dashboard
                        </Link>
                        <Link to="/profile"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                          <User size={16} className="text-teal-600" /> Profile
                        </Link>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"    className="btn-ghost text-sm hidden sm:flex">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden btn-ghost p-2"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 pb-4 border-t border-slate-100 space-y-1 animate-fade-in">
            <Link to="/search"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              Find Doctors
            </Link>
            <Link to="/specializations"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              Specializations
            </Link>
            {user && (
              <Link to={dashboardPath}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                Dashboard
              </Link>
            )}
            {!user && (
              <>
                <Link to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                  Sign In
                </Link>
                <Link to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-teal-600 hover:bg-teal-50">
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}