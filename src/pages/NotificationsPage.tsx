import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { PageLoader, EmptyState } from '../components/ui'
import { fmt } from '../utils/helpers'
import type { Notification } from '../types'
import { Bell, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function NotificationsPage() {
  const { user } = useAuth()
  const qc       = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notifApi.getAll({ page: 0, page_size: 30 }).then(r => r.data.data ?? r.data),
    enabled:  !!user,
  })

  const { mutate: markOne } = useMutation({
    mutationFn: (id: number) => notifApi.markRead(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { mutate: markAll } = useMutation({
    mutationFn: notifApi.markAllRead,
    onSuccess:  () => {
      toast.success('All marked as read')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifs: Notification[] = data?.results ?? []
  const unread = notifs.filter(n => !n.is_read).length

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Bell size={22} /> Notifications
          </h1>
          {unread > 0 && (
            <p className="text-sm text-slate-500 mt-1">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button onClick={() => markAll()} className="btn-secondary text-sm gap-2">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {notifs.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          desc="You're all caught up!"
        />
      ) : (
        <div className="space-y-2 animate-fade-in">
          {notifs.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markOne(n.id)}
              className={clsx(
                'card p-4 transition-all hover:shadow-card-lg',
                !n.is_read
                  ? 'border-l-4 border-teal-500 bg-teal-50/30 cursor-pointer'
                  : 'opacity-70'
              )}>
              <div className="flex items-start gap-3">
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                )}
                <div className={clsx('flex-1', n.is_read && 'ml-5')}>
                  <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs text-slate-400">{fmt.datetime(n.created_at)}</p>
                    {n.notif_type && (
                      <span className="badge-slate text-xs">{n.notif_type}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}