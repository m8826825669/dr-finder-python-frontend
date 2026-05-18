import axios, { AxiosResponse } from 'axios'
import type {
  RegisterRequest, LoginRequest, TokenResponse, ChangePasswordRequest,
  User, ApiResponse, PageResponse,
  Specialization, SpecializationRequest,
  DoctorSummary, DoctorDetail, DoctorProfileRequest, DoctorSearchParams,
  Availability, AvailabilityRequest, TimeSlot, GenerateSlotsRequest,
  Appointment, AppointmentRequest, AppointmentUpdateRequest, CancelRequest,
  Review, ReviewRequest,
  Notification,
  AdminStats,
} from '../types'

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async (err) => {
    const original = err.config as typeof err.config & { _retry?: boolean }
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post<ApiResponse<TokenResponse>>(
            '/api/v1/auth/refresh',
            { refresh_token: refresh }
          )
          const token = data.data?.access_token ?? (data as unknown as TokenResponse).access_token
          localStorage.setItem('access_token', token)
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

// ─── Utility to unwrap API response ──────────────────────────────────────────
function unwrap<T>(res: AxiosResponse<ApiResponse<T> | T>): T {
  const d = res.data as ApiResponse<T>
  return d.data ?? (res.data as T)
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register:       (body: RegisterRequest)       => api.post<ApiResponse<User>>('/auth/register', body),
  login:          (body: LoginRequest)          => api.post<ApiResponse<TokenResponse>>('/auth/login', body),
  refresh:        (refresh_token: string)       => api.post<ApiResponse<TokenResponse>>('/auth/refresh', { refresh_token }),
  me:             ()                            => api.get<ApiResponse<User>>('/auth/me'),
  changePassword: (body: ChangePasswordRequest) => api.post<ApiResponse<null>>('/auth/change-password', body),
}

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const doctorApi = {
  search: (params: DoctorSearchParams) =>
    api.get<ApiResponse<PageResponse<DoctorSummary>>>('/doctors/search', { params }),

  getById: (id: number | string) =>
    api.get<ApiResponse<DoctorDetail>>(`/doctors/${id}`),

  createProfile: (body: DoctorProfileRequest) =>
    api.post<ApiResponse<DoctorDetail>>('/doctors/profile', body),

  updateProfile: (body: Partial<DoctorProfileRequest>) =>
    api.put<ApiResponse<DoctorDetail>>('/doctors/profile', body),

  getMyProfile: () =>
    api.get<ApiResponse<DoctorDetail | null>>('/doctors/profile/me'),

  getReviews: (id: number | string, params?: { page?: number; page_size?: number }) =>
    api.get<ApiResponse<PageResponse<Review>>>(`/doctors/${id}/reviews`, { params }),

  getSpecializations: () =>
    api.get<ApiResponse<Specialization[]>>('/doctors/specializations'),

  createSpecialization: (body: SpecializationRequest) =>
    api.post<ApiResponse<Specialization>>('/doctors/specializations', body),

  getAvailability: (id: number | string) =>
    api.get<ApiResponse<Availability[]>>(`/doctors/${id}/availability`),

  addAvailability: (id: number | string, body: AvailabilityRequest) =>
    api.post<ApiResponse<Availability>>(`/doctors/${id}/availability`, body),

  deleteAvailability: (doctorId: number | string, availId: number | string) =>
    api.delete<ApiResponse<null>>(`/doctors/${doctorId}/availability/${availId}`),

  getSlots: (id: number | string, date: string) =>
    api.get<ApiResponse<TimeSlot[]>>(`/doctors/${id}/slots`, { params: { slot_date: date } }),

  getSlotsRange: (id: number | string, from_date: string, to_date: string) =>
    api.get<ApiResponse<TimeSlot[]>>(`/doctors/${id}/slots/range`, { params: { from_date, to_date } }),

  generateSlots: (id: number | string, body: GenerateSlotsRequest) =>
    api.post<ApiResponse<string>>(`/doctors/${id}/slots/generate`, body),
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentApi = {
  book: (body: AppointmentRequest) =>
    api.post<ApiResponse<Appointment>>('/appointments', body),

  getMyAppointments: (params?: { status?: string; page?: number; page_size?: number }) =>
    api.get<ApiResponse<PageResponse<Appointment>>>('/appointments/my', { params }),

  getDoctorAppointments: (params?: { status?: string; page?: number; page_size?: number }) =>
    api.get<ApiResponse<PageResponse<Appointment>>>('/appointments/doctor', { params }),

  getById: (id: number | string) =>
    api.get<ApiResponse<Appointment>>(`/appointments/${id}`),

  update: (id: number | string, body: AppointmentUpdateRequest) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}`, body),

  confirm: (id: number | string) =>
    api.post<ApiResponse<null>>(`/appointments/${id}/confirm`),

  cancel: (id: number | string, body: CancelRequest) =>
    api.post<ApiResponse<null>>(`/appointments/${id}/cancel`, body),

  complete: (id: number | string) =>
    api.post<ApiResponse<null>>(`/appointments/${id}/complete`),

  review: (id: number | string, body: ReviewRequest) =>
    api.post<ApiResponse<Review>>(`/appointments/${id}/review`, body),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifApi = {
  getAll: (params?: { unread_only?: boolean; page?: number; page_size?: number }) =>
    api.get<ApiResponse<PageResponse<Notification>>>('/notifications', { params }),

  markRead:   (id: number | string) => api.post<ApiResponse<null>>(`/notifications/${id}/read`),
  markAllRead: ()                   => api.post<ApiResponse<null>>('/notifications/read-all'),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats:        ()                               => api.get<ApiResponse<AdminStats>>('/admin/stats'),
  verifyDoctor: (id: number | string)            => api.post<ApiResponse<null>>(`/admin/doctors/${id}/verify`),
  featureDoctor:(id: number | string, featured: boolean) =>
    api.post<ApiResponse<null>>(`/admin/doctors/${id}/feature`, null, { params: { featured } }),
}

export default api