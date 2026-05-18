// ─── Enums (string literal unions matching backend) ───────────────────

export type UserRole = 'patient' | 'doctor' | 'admin'

export type ConsultationType = 'in_person' | 'video' | 'phone'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'

export type Gender = 'male' | 'female' | 'other'

// ─── Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: number
  email: string
  phone?: string | null
  full_name: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface RegisterRequest {
  email: string
  phone?: string
  full_name: string
  password: string
  role: UserRole
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

// ─── Specialization ───────────────────────────────────────────────────

export interface Specialization {
  id: number
  name: string
  description?: string | null
  icon_url?: string | null
}

// ─── Doctor ───────────────────────────────────────────────────────────

export interface Qualification {
  degree: string
  university?: string
  year?: number
}

export interface DoctorSummary {
  id: number
  full_name: string
  specialization?: string
  specialization_id?: number
  experience_years: number
  consultation_fee: number
  avg_rating: number
  total_reviews: number
  city?: string
  is_verified: boolean
  available_for_video?: boolean
  profile_photo_url?: string | null
  clinic_name?: string | null
}

export interface DoctorDetail extends DoctorSummary {
  bio?: string | null
  qualifications?: Qualification[]
  languages?: string[]
  clinic_address?: string | null
  gender?: Gender
  registration_number?: string
  about?: string | null
}

// ─── Availability & Slots ─────────────────────────────────────────────

export interface AvailabilityRequest {
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  consultation_type: ConsultationType
}

export interface TimeSlot {
  id: number
  doctor_id: number
  slot_date: string
  start_time: string
  end_time: string
  is_booked: boolean
  consultation_type: ConsultationType
}

// ─── Appointments & Reviews ───────────────────────────────────────────

export interface Appointment {
  id: number
  patient_id: number
  doctor_id: number
  time_slot_id: number
  status: AppointmentStatus
  consultation_type: ConsultationType
  symptoms?: string
  diagnosis?: string | null
  prescription?: string | null
  follow_up_date?: string | null
  appointment_date: string
  start_time: string
  end_time: string
  doctor_name?: string
  patient_name?: string
  created_at: string
}

export interface ReviewRequest {
  rating: number
  comment?: string
  is_anonymous?: boolean
}

// ─── Notifications ────────────────────────────────────────────────────

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
  type?: string
  link?: string
}

// ─── UI helpers ───────────────────────────────────────────────────────

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'

export interface SelectOption {
  value: string | number
  label: string
}

// ─── Admin ────────────────────────────────────────────────────────────
// Flexible shape — backend field names verified post-deploy. Page uses
// defensive lookup so unknown fields don't break rendering.
export interface AdminStats {
  total_doctors?: number
  total_patients?: number
  total_appointments?: number
  verified_doctors?: number
  pending_verification?: number
  total_revenue?: number
  total_reviews?: number
  avg_rating?: number
  [key: string]: number | string | undefined
}

// ─── Doctor Profile Create/Update payload ─────────────────────────────
export interface DoctorProfileRequest {
  specialization_id?:   number
  registration_number?: string
  gender?:              Gender
  bio?:                 string
  languages?:           string[]
  experience_years?:    number
  qualifications?:      Qualification[]
  consultation_fee?:    number
  video_fee?:           number | null
  follow_up_fee?:       number | null
  clinic_name?:         string
  clinic_address?:      string
  city?:                string
  state?:               string
  pincode?:             string
  latitude?:            number
  longitude?:           number
  available_for_video?: boolean
  available_for_home?:  boolean
  accepting_new_patients?: boolean
}