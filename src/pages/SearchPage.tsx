import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { doctorApi } from '../services/api'
import DoctorCard from '../components/doctor/DoctorCard'
import { Spinner, EmptyState, Pagination, DoctorCardSkeleton, Select } from '../components/ui'
import { Search, SlidersHorizontal, X, Stethoscope } from 'lucide-react'
import clsx from 'clsx'

const SORT_OPTIONS = [
  { value:'relevance',  label:'Most Relevant' },
  { value:'rating',     label:'Highest Rated' },
  { value:'fee_asc',    label:'Fee: Low to High' },
  { value:'fee_desc',   label:'Fee: High to Low' },
  { value:'experience', label:'Most Experienced' },
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters]   = useState(false)
  const [page, setPage] = useState(0)

  const [filters, setFilters] = useState({
    q:                 searchParams.get('q') || '',
    city:              searchParams.get('city') || '',
    specialization_id: searchParams.get('specialization_id') || '',
    min_fee:           '',
    max_fee:           '',
    min_rating:        '',
    min_experience:    '',
    gender:            '',
    available_for_video:  '',
    accepting_new_patients:'',
    is_verified:       '',
    sort_by:           'relevance',
  })

  const { data: specsData } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => doctorApi.getSpecializations().then(r => r.data.data ?? r.data),
  })

  const params = Object.fromEntries(
    Object.entries({ ...filters, page, page_size: 12 }).filter(([, v]) => v !== '' && v != null)
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['doctors-search', params],
    queryFn: () => doctorApi.search(params).then(r => r.data.data ?? r.data),
    keepPreviousData: true,
  })

  const doctors    = data?.results ?? []
  const total      = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(0) }

  const clearFilters = () => {
    setFilters({ q:'', city:'', specialization_id:'', min_fee:'', max_fee:'', min_rating:'', min_experience:'', gender:'', available_for_video:'', accepting_new_patients:'', is_verified:'', sort_by:'relevance' })
    setPage(0)
  }

  const activeFilterCount = Object.entries(filters)
    .filter(([k,v]) => v !== '' && k !== 'q' && k !== 'sort_by').length

  const specs = specsData ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Search Bar ─────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={filters.q}
            onChange={e => setFilter('q', e.target.value)}
            placeholder="Search by name, specialization, clinic…"
            className="input pl-11 py-3 text-base"
          />
        </div>
        <input value={filters.city}
          onChange={e => setFilter('city', e.target.value)}
          placeholder="City"
          className="input w-40 py-3"
        />
        <button onClick={() => setShowFilters(!showFilters)}
          className={clsx('btn-secondary gap-2 relative', showFilters && 'border-teal-400 text-teal-700 bg-teal-50')}>
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        <Select
          options={SORT_OPTIONS}
          value={filters.sort_by}
          onChange={e => setFilter('sort_by', e.target.value)}
          className="w-44 py-3"
        />
      </div>

      {/* ── Filter Panel ───────────────────────────────────────────── */}
      {showFilters && (
        <div className="card p-5 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">Filters</h3>
            <div className="flex gap-2">
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Specialization</label>
              <select className="input text-sm" value={filters.specialization_id}
                onChange={e => setFilter('specialization_id', e.target.value)}>
                <option value="">All</option>
                {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Min Rating</label>
              <select className="input text-sm" value={filters.min_rating}
                onChange={e => setFilter('min_rating', e.target.value)}>
                <option value="">Any</option>
                {[4.5,4,3.5,3].map(r => <option key={r} value={r}>{r}+ ★</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fee Range (₹)</label>
              <div className="flex gap-1">
                <input type="number" placeholder="Min" className="input text-sm w-1/2"
                  value={filters.min_fee} onChange={e => setFilter('min_fee', e.target.value)} />
                <input type="number" placeholder="Max" className="input text-sm w-1/2"
                  value={filters.max_fee} onChange={e => setFilter('max_fee', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Experience (yrs)</label>
              <input type="number" placeholder="Min years" className="input text-sm"
                value={filters.min_experience} onChange={e => setFilter('min_experience', e.target.value)} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input text-sm" value={filters.gender}
                onChange={e => setFilter('gender', e.target.value)}>
                <option value="">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Video Consult</label>
              <select className="input text-sm" value={filters.available_for_video}
                onChange={e => setFilter('available_for_video', e.target.value)}>
                <option value="">Any</option>
                <option value="true">Available</option>
                <option value="false">In-Person only</option>
              </select>
            </div>
            <div>
              <label className="label">Accepting Patients</label>
              <select className="input text-sm" value={filters.accepting_new_patients}
                onChange={e => setFilter('accepting_new_patients', e.target.value)}>
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="label">Verified Only</label>
              <select className="input text-sm" value={filters.is_verified}
                onChange={e => setFilter('is_verified', e.target.value)}>
                <option value="">Any</option>
                <option value="true">Verified</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Results header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {isLoading ? 'Searching…' : `${total.toLocaleString()} doctor${total !== 1 ? 's' : ''} found`}
        </p>
        {isFetching && !isLoading && <Spinner size={16} />}
      </div>

      {/* ── Results Grid ───────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <DoctorCardSkeleton key={i} />)}
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors found"
          desc="Try different keywords, remove some filters, or expand your search area."
          action={<button onClick={clearFilters} className="btn-secondary text-sm">Clear filters</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {doctors.map(doc => <DoctorCard key={doc.id} doctor={doc} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); window.scrollTo(0,0) }} />
    </div>
  )
}