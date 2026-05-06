import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import { Stethoscope, Mail, Phone, MapPin } from 'lucide-react'

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <Stethoscope size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Doctor<span className="text-teal-400">Finder</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              Connecting patients with verified doctors for in-person and video
              consultations. Book appointments instantly.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {([
                ['Find Doctors',      '/search'],
                ['Specializations',   '/specializations'],
                ['Register as Doctor','/register'],
              ] as [string, string][]).map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="hover:text-teal-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} className="shrink-0" /> support@doctorfinder.in
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="shrink-0" /> +91 98765 43210
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="shrink-0" /> Delhi, India
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs">
          © 2026 DoctorFinder. Built with FastAPI + React + TypeScript.
        </div>
      </div>
    </footer>
  )
}

// ── Layout ─────────────────────────────────────────────────────────────────────
interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}