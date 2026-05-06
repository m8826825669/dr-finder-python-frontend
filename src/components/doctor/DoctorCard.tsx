import { Link } from 'react-router-dom'
import { MapPin, Clock, Video, CheckCircle } from 'lucide-react'
import { Avatar, StarRating } from '../ui'
import { fmt } from '../../utils/helpers'
import type { DoctorSummary } from '../../types'
import clsx from 'clsx'

interface DoctorCardProps {
  doctor: DoctorSummary
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const {
    id, full_name, specialization, experience_years,
    consultation_fee, avg_rating, total_reviews,
    city, clinic_name, avatar_url, is_verified,
    available_for_video, accepting_new_patients,
  } = doctor

  return (
    <Link to={`/doctors/${id}`} className="card-hover block p-5 group">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar
            name={full_name}
            src={avatar_url}
            size="lg"
            className="group-hover:ring-teal-300 transition-all"
          />
          {is_verified && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center ring-2 ring-white">
              <CheckCircle size={11} className="text-white fill-white" />
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display font-semibold text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-1">
                Dr. {full_name}
              </h3>
              <p className="text-xs text-teal-600 font-medium mt-0.5">{specialization}</p>
            </div>
            <span className="font-bold text-slate-800 text-sm shrink-0">
              {fmt.currency(consultation_fee)}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StarRating rating={avg_rating} count={total_reviews} size={13} />
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={11} /> {experience_years} yrs exp
            </span>
          </div>

          {(city || clinic_name) && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 line-clamp-1">
              <MapPin size={11} className="shrink-0" />
              {[clinic_name, city].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50 flex-wrap">
        {available_for_video && (
          <span className="badge-teal flex items-center gap-1">
            <Video size={10} /> Video consult
          </span>
        )}
        {accepting_new_patients ? (
          <span className="badge-green">Accepting patients</span>
        ) : (
          <span className="badge-red">Not accepting</span>
        )}
        {is_verified && <span className="badge-blue">Verified</span>}
      </div>
    </Link>
  )
}