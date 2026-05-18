import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorApi } from '../../services/api'
import { Spinner } from '../../components/ui'
import { apiError } from '../../utils/helpers'
import type { DoctorDetail, Specialization, Qualification, Gender } from '../../types'
import {
  CheckCircle2, ChevronRight, ChevronLeft, User, Building2,
  GraduationCap, Plus, X, ShieldCheck, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ── Wizard step type ──────────────────────────────────────────────────────────
type StepKey = 'basics' | 'clinic' | 'credentials'

interface Step {
  key:   StepKey
  num:   number
  title: string
  desc:  string
  icon:  typeof User
}

const STEPS: Step[] = [
  { key: 'basics',      num: 1, title: 'Basics',      desc: 'About you',         icon: User          },
  { key: 'clinic',      num: 2, title: 'Clinic',      desc: 'Practice details',  icon: Building2     },
  { key: 'credentials', num: 3, title: 'Credentials', desc: 'Qualifications',    icon: GraduationCap },
]

// ── Form state shape ──────────────────────────────────────────────────────────
interface FormState {
  // Step 1: basics
  specialization_id:   number | ''
  gender:              Gender | ''
  experience_years:    number | ''
  bio:                 string
  languages:           string[]
  // Step 2: clinic
  clinic_name:         string
  clinic_address:      string
  city:                string
  state:               string
  pincode:             string
  consultation_fee:    number | ''
  video_fee:           number | ''
  available_for_video: boolean
  available_for_home:  boolean
  // Step 3: credentials
  registration_number: string
  qualifications:      Qualification[]
}

const INITIAL_FORM: FormState = {
  specialization_id:   '',
  gender:              '',
  experience_years:    '',
  bio:                 '',
  languages:           [],
  clinic_name:         '',
  clinic_address:      '',
  city:                '',
  state:               '',
  pincode:             '',
  consultation_fee:    '',
  video_fee:           '',
  available_for_video: false,
  available_for_home:  false,
  registration_number: '',
  qualifications:      [{ degree: '', university: '', year: undefined as unknown as number }],
}

const COMMON_LANGUAGES = [
  'English', 'Hindi', 'Punjabi', 'Marathi', 'Gujarati',
  'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Malayalam', 'Urdu',
]

// ── Per-step validation ──────────────────────────────────────────────────────
function validateStep(step: StepKey, f: FormState): string | null {
  if (step === 'basics') {
    if (!f.specialization_id)         return 'Please choose your specialization'
    if (f.experience_years === '' || Number(f.experience_years) < 0)
      return 'Years of experience required'
    return null
  }
  if (step === 'clinic') {
    if (!f.consultation_fee || Number(f.consultation_fee) <= 0)
      return 'Consultation fee must be greater than 0'
    return null
  }
  if (step === 'credentials') {
    if (!f.registration_number.trim())
      return 'Medical registration number required'
    if (!f.qualifications.length ||
        !f.qualifications.some(q => q.degree.trim()))
      return 'Add at least one qualification'
    return null
  }
  return null
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN WIZARD COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
interface DoctorProfileWizardProps {
  existingProfile?: DoctorDetail | null   // undefined / null → create mode, populated → edit mode
  onComplete:        () => void           // called after successful save
  onCancel?:         () => void           // optional: only shown in edit mode
}
export default function DoctorProfileWizard({
  existingProfile, onComplete, onCancel,
}: DoctorProfileWizardProps) {
  const qc = useQueryClient()
  const isEditMode = !!existingProfile

  const [stepIdx, setStepIdx] = useState(0)
  const [form, setForm]       = useState<FormState>(INITIAL_FORM)
  const [error, setError]     = useState<string | null>(null)

  const currentStep = STEPS[stepIdx]

  // Hydrate from existing profile in edit mode
  useEffect(() => {
    if (!existingProfile) return
    setForm({
      specialization_id:   existingProfile.specialization_id ?? '',
      gender:              (existingProfile.gender ?? '') as Gender | '',
      experience_years:    existingProfile.experience_years ?? '',
      bio:                 existingProfile.bio ?? '',
      languages:           existingProfile.languages ?? [],
      clinic_name:         existingProfile.clinic_name ?? '',
      clinic_address:      existingProfile.clinic_address ?? '',
      city:                existingProfile.city ?? '',
      state:               existingProfile.state ?? '',
      pincode:             existingProfile.pincode ?? '',
      consultation_fee:    existingProfile.consultation_fee ?? '',
      video_fee:           (existingProfile as any).video_fee ?? '',
      available_for_video: existingProfile.available_for_video ?? false,
      available_for_home:  (existingProfile as any).available_for_home ?? false,
      registration_number: existingProfile.registration_number ?? '',
      qualifications:      (existingProfile.qualifications && existingProfile.qualifications.length)
        ? existingProfile.qualifications
        : INITIAL_FORM.qualifications,
    })
  }, [existingProfile])

  // Specializations lookup
  const { data: specsData, isLoading: specsLoading } = useQuery({
    queryKey: ['specializations'],
    queryFn:  () => doctorApi.getSpecializations()
      .then(r => (r.data.data ?? r.data ?? []) as Specialization[]),
  })
  const specs: Specialization[] = specsData ?? []

  // Submission
  const { mutate: submit, isPending: saving } = useMutation({
    mutationFn: () => {
      // Build payload — strip empties + coerce types
      const cleanQuals = form.qualifications
        .filter(q => q.degree?.trim())
        .map(q => ({
          degree:     q.degree.trim(),
          university: q.university?.trim() || undefined,
          year:       q.year ? Number(q.year) : undefined,
        }))

      const payload: any = {
        // Common
        bio:                 form.bio.trim() || undefined,
        languages:           form.languages,
        experience_years:    Number(form.experience_years) || 0,
        qualifications:      cleanQuals,
        consultation_fee:    Number(form.consultation_fee),
        video_fee:           form.video_fee !== '' ? Number(form.video_fee) : undefined,
        clinic_name:         form.clinic_name.trim() || undefined,
        clinic_address:      form.clinic_address.trim() || undefined,
        city:                form.city.trim() || undefined,
        state:               form.state.trim() || undefined,
        pincode:             form.pincode.trim() || undefined,
        available_for_video: form.available_for_video,
        available_for_home:  form.available_for_home,
      }

      if (!isEditMode) {
        // Create-only fields (backend rejects these on PUT)
        payload.specialization_id   = Number(form.specialization_id)
        payload.registration_number = form.registration_number.trim()
        if (form.gender) payload.gender = form.gender
        return doctorApi.createProfile(payload)
      }
      return doctorApi.updateProfile(payload)
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Profile updated' : 'Profile created — pending verification')
      qc.invalidateQueries({ queryKey: ['my-doctor-profile'] })
      qc.invalidateQueries({ queryKey: ['admin-pending-doctors'] })
      onComplete()
    },
    onError: e => toast.error(apiError(e)),
  })

  // ── Navigation handlers ─────────────────────────────────────────────────────
  const next = () => {
    const err = validateStep(currentStep.key, form)
    if (err) { setError(err); return }
    setError(null)
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1)
  }
  const back = () => {
    setError(null)
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }
  const finish = () => {
    const err = validateStep(currentStep.key, form)
    if (err) { setError(err); return }
    setError(null)
    submit()
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const toggleLanguage = (lang: string) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }))
  }

  const updateQual = (idx: number, patch: Partial<Qualification>) => {
    setForm(f => ({
      ...f,
      qualifications: f.qualifications.map((q, i) => i === idx ? { ...q, ...patch } : q),
    }))
  }
  const addQual = () => {
    setForm(f => ({
      ...f,
      qualifications: [...f.qualifications, { degree: '', university: '', year: undefined as unknown as number }],
    }))
  }
  const removeQual = (idx: number) => {
    setForm(f => ({
      ...f,
      qualifications: f.qualifications.length > 1
        ? f.qualifications.filter((_, i) => i !== idx)
        : f.qualifications,
    }))
  }

  return (
    <div className="card overflow-hidden">
      {/* Stepper */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-slate-100 p-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {STEPS.map((s, i) => {
            const done = i < stepIdx
            const active = i === stepIdx
            const Icon = s.icon
            return (
              <div key={s.key} className="flex items-center gap-2 sm:gap-4 flex-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={clsx(
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                    done   && 'bg-green-500 text-white shadow-btn',
                    active && 'bg-teal-600 text-white shadow-btn ring-4 ring-teal-100',
                    !done && !active && 'bg-white border border-slate-200 text-slate-400',
                  )}>
                    {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>
                  <div className="hidden sm:block">
                    <p className={clsx(
                      'text-xs font-semibold',
                      (done || active) ? 'text-slate-800' : 'text-slate-400'
                    )}>Step {s.num}</p>
                    <p className={clsx(
                      'text-sm font-display font-bold',
                      done   ? 'text-green-700' :
                      active ? 'text-teal-700'  :
                               'text-slate-400'
                    )}>{s.title}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={clsx(
                    'flex-1 h-0.5 transition-colors',
                    done ? 'bg-green-400' : 'bg-slate-200'
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step body */}
      <div className="p-6 sm:p-8 min-h-[400px]">
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold text-slate-800">{currentStep.title}</h2>
          <p className="text-sm text-slate-500 mt-1">{currentStep.desc}</p>
        </div>

        {/* ──── STEP 1: BASICS ──── */}
        {currentStep.key === 'basics' && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="label">Specialization *</label>
              {specsLoading ? (
                <div className="input flex items-center"><Spinner size={14} /> Loading…</div>
              ) : (
                <select
                  value={form.specialization_id}
                  onChange={e => setField('specialization_id', e.target.value ? Number(e.target.value) : '')}
                  disabled={isEditMode}
                  className={clsx('input text-sm', isEditMode && 'opacity-60 cursor-not-allowed')}>
                  <option value="">— Select specialization —</option>
                  {specs.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
              {isEditMode && (
                <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Specialization can't be changed after creation
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Gender</label>
                <select
                  value={form.gender}
                  onChange={e => setField('gender', e.target.value as Gender | '')}
                  className="input text-sm">
                  <option value="">— Prefer not to say —</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Years of experience *</label>
                <input
                  type="number"
                  min={0}
                  value={form.experience_years}
                  onChange={e => setField('experience_years', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 10"
                  className="input text-sm" />
              </div>
            </div>

            <div>
              <label className="label">About / Bio</label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={e => setField('bio', e.target.value)}
                placeholder="Briefly introduce yourself, your areas of focus, and your approach to patient care."
                className="input text-sm" />
              <p className="text-[10px] text-slate-400 mt-1">
                {form.bio.length} characters — patients see this on your public profile
              </p>
            </div>

            <div>
              <label className="label">Languages spoken</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_LANGUAGES.map(lang => {
                  const selected = form.languages.includes(lang)
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                        selected
                          ? 'bg-teal-600 text-white shadow-btn'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
                      )}>
                      {lang}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ──── STEP 2: CLINIC ──── */}
        {currentStep.key === 'clinic' && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="label">Clinic / Practice name</label>
              <input
                value={form.clinic_name}
                onChange={e => setField('clinic_name', e.target.value)}
                placeholder="e.g. HeartCare Clinic, CP"
                className="input text-sm" />
            </div>

            <div>
              <label className="label">Address</label>
              <textarea
                rows={2}
                value={form.clinic_address}
                onChange={e => setField('clinic_address', e.target.value)}
                placeholder="Street address"
                className="input text-sm" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">City</label>
                <input
                  value={form.city}
                  onChange={e => setField('city', e.target.value)}
                  placeholder="Mumbai"
                  className="input text-sm" />
              </div>
              <div>
                <label className="label">State</label>
                <input
                  value={form.state}
                  onChange={e => setField('state', e.target.value)}
                  placeholder="Maharashtra"
                  className="input text-sm" />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input
                  value={form.pincode}
                  onChange={e => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="400001"
                  className="input text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Consultation fee (₹) *</label>
                <input
                  type="number"
                  min={1}
                  value={form.consultation_fee}
                  onChange={e => setField('consultation_fee', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="500"
                  className="input text-sm" />
              </div>
              <div>
                <label className="label">Video consultation fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.video_fee}
                  onChange={e => setField('video_fee', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="400 (optional)"
                  className="input text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.available_for_video}
                  onChange={e => setField('available_for_video', e.target.checked)}
                  className="w-4 h-4 accent-teal-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Available for video consultations</p>
                  <p className="text-xs text-slate-500">Patients can book remote video appointments</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.available_for_home}
                  onChange={e => setField('available_for_home', e.target.checked)}
                  className="w-4 h-4 accent-teal-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Available for home visits</p>
                  <p className="text-xs text-slate-500">You'll travel to patients' homes for consultations</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ──── STEP 3: CREDENTIALS ──── */}
        {currentStep.key === 'credentials' && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="label">Medical Registration Number *</label>
              <input
                value={form.registration_number}
                onChange={e => setField('registration_number', e.target.value)}
                disabled={isEditMode}
                placeholder="e.g. DMC/R/12345"
                className={clsx('input text-sm', isEditMode && 'opacity-60 cursor-not-allowed')} />
              <p className="text-[10px] text-slate-500 mt-1">
                Your state medical council registration. Required for verification.
              </p>
              {isEditMode && (
                <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Contact support to update registration number
                </p>
              )}
            </div>

            <div>
              <label className="label">Qualifications *</label>
              <div className="space-y-2">
                {form.qualifications.map((q, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                      <div className="col-span-2 sm:col-span-4">
                        <label className="label">Degree</label>
                        <input
                          value={q.degree}
                          onChange={e => updateQual(i, { degree: e.target.value })}
                          placeholder="MBBS"
                          className="input text-sm" />
                      </div>
                      <div className="col-span-2 sm:col-span-5">
                        <label className="label">University</label>
                        <input
                          value={q.university ?? ''}
                          onChange={e => updateQual(i, { university: e.target.value })}
                          placeholder="AIIMS Delhi"
                          className="input text-sm" />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="label">Year</label>
                        <input
                          type="number"
                          min={1950}
                          max={new Date().getFullYear()}
                          value={q.year ?? ''}
                          onChange={e => updateQual(i, { year: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="2015"
                          className="input text-sm" />
                      </div>
                      <div className="col-span-1 sm:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeQual(i)}
                          disabled={form.qualifications.length <= 1}
                          className="w-full p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
                          <X size={14} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addQual}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-700 hover:bg-teal-50 border border-teal-200 border-dashed">
                <Plus size={12} /> Add another qualification
              </button>
            </div>

            {/* Verification notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold">What happens next?</p>
                <p className="mt-1">
                  After you save, your profile will be reviewed by our admin team.
                  Verified doctors appear in patient search results. This usually takes 1–2 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mt-5 flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-100 bg-slate-50/60">
        <div>
          {stepIdx > 0 && (
            <button onClick={back} className="btn-ghost text-sm">
              <ChevronLeft size={14} /> Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button onClick={onCancel} className="btn-ghost text-sm">Cancel</button>
          )}
          {stepIdx < STEPS.length - 1 ? (
            <button onClick={next} className="btn-primary text-sm">
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="btn-primary text-sm">
              {saving ? <Spinner size={14} className="text-white" /> : <CheckCircle2 size={14} />}
              {isEditMode ? 'Save Changes' : 'Submit for Verification'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}