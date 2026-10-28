import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import Weave from '../../components/ui/Weave'
import { useToast } from '../../components/ui/Toast'
import { ChevronDownIcon, KeyIcon, LockIcon, ShieldIcon, UserPlusIcon } from '../../components/ui/Icons'
import { Avatar, StatCard, Tag } from '../../components/admin/AdminBits'
import CreateStaffModal from '../../components/admin/CreateStaffModal'
import { useAuth } from '../../context/AuthContext'
import { getAuditLogs, getNotificationLogs, getUsers } from '../../api/admin'
import { ACCESS_ACTIONS, TYPE_LABELS, describeLog } from '../../utils/auditText'
import { isToday, withinDays } from '../../utils/dates'
import { formatRelative } from '../../utils/formatDate'

const messageOf = (err) => err.response?.data?.message ?? err.message
const accessIcons = { 'staff.create': UserPlusIcon, 'user.password_reset': KeyIcon, 'user.status_update': LockIcon }
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function CardHeader({ title, link, to }) {
  return (
    <div className="flex items-center justify-between gap-4 pb-2">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      <Link
        to={to}
        className="-my-3 inline-flex items-center gap-1 py-3 text-sm font-bold text-wallet hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
      >
        {link}
        <ChevronDownIcon size={16} className="-rotate-90" />
      </Link>
    </div>
  )
}

// Admin = IT and people. This overview only uses identity/access data, the audit log,
// and notification metadata: no balances, bank accounts, or transactions.
export default function AdminDashboard() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState({ status: 'loading', users: [], logs: [], notifs: [], error: '' })
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const [users, logs, notifs] = await Promise.all([getUsers(), getAuditLogs(), getNotificationLogs()])
      setData({ status: 'ready', users: users.data, logs: logs.data, notifs: notifs.data, error: '' })
    } catch (err) {
      setData((d) => ({ ...d, status: 'error', error: messageOf(err) }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (data.status === 'error' && data.users.length === 0) {
    return (
      <Card role="alert">
        <h1 className="text-xl font-bold text-text">We couldn’t load the admin overview</h1>
        <p className="mt-1 mb-4 text-muted">{data.error}</p>
        <Button onClick={load}>Try again</Button>
      </Card>
    )
  }

  const loading = data.status === 'loading'
  const { users, logs, notifs } = data
  const userById = Object.fromEntries(users.map((u) => [u._id, u]))
  const byRole = (r) => users.filter((u) => u.role === r)
  const staff = byRole('staff')
  const sorted = [...logs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const countLogs = (action, test) => logs.filter((l) => l.action === action && test(l.createdAt)).length

  const staffActivity = sorted.filter((l) => userById[l.actor]?.role === 'staff').slice(0, 5)
  const accessChanges = sorted.filter((l) => ACCESS_ACTIONS.includes(l.action)).slice(0, 4)
  const securityAlerts = [...notifs]
    .filter((n) => n.type === 'security')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)

  return (
    <>
      <h1 className="sr-only">Admin overview</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Deep-green banner, same as the customer one, but about people, not money */}
          <section
            aria-label="People on sinop"
            aria-busy={loading}
            className="relative isolate grid gap-6 overflow-hidden rounded-[20px] bg-ink p-6 text-white md:grid-cols-[1fr_300px]"
          >
            <Weave className="text-white [mask-image:linear-gradient(to_left,black,transparent_80%)]" opacity={0.1} />
            <div className="relative flex flex-col justify-between gap-6">
              <div>
                <p className="text-[15px] text-white/80">People on sinop</p>
                {loading ? (
                  <Skeleton className="mt-2 h-11 w-32 bg-white/10" />
                ) : (
                  <p className="mt-2 font-brand text-[44px] leading-none font-bold tabular-nums">
                    {users.length.toLocaleString('en-US')}
                  </p>
                )}
                <ul className="mt-3 flex flex-wrap gap-2">
                  {[
                    plural(byRole('customer').length, 'customer'),
                    `${staff.length} staff`,
                    plural(byRole('admin').length, 'admin'),
                  ].map((t) => (
                    <li key={t} className="rounded-full bg-white/12 px-3 py-1 text-[13px] font-semibold">
                      {loading ? '–' : t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="accent" size="lg" onClick={() => setCreating(true)}>
                  <UserPlusIcon size={18} />
                  Create staff
                </Button>
                <Button variant="ghost" size="lg" to="/admin/users">
                  <KeyIcon size={18} />
                  Reset a password
                </Button>
              </div>
            </div>

            <div className="relative flex flex-col gap-3.5 rounded-2xl border border-white/15 bg-linear-to-br from-white/15 to-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="font-brand text-xl font-bold">Today</span>
                <span className="rounded-full border border-accent px-3 py-1 text-xs font-bold tracking-wider text-accent uppercase">
                  Live
                </span>
              </div>
              {[
                ['New sign-ups', byRole('customer').filter((u) => isToday(u.createdAt)).length],
                ['Password resets', countLogs('user.password_reset', isToday)],
                ['Staff created', countLogs('staff.create', isToday)],
                ['Access changes', countLogs('user.status_update', isToday)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{label}</span>
                  <span className="font-brand text-[15px] font-semibold tabular-nums">{loading ? '–' : value}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              label="Staff accounts"
              value={staff.length}
              hint={`${staff.filter((u) => u.status === 'active').length} active, ${staff.filter((u) => u.status !== 'active').length} off`}
              loading={loading}
            />
            <StatCard
              label="New sign-ups"
              value={byRole('customer').filter((u) => withinDays(u.createdAt, 7)).length}
              hint="This week"
              loading={loading}
            />
            <StatCard
              label="Can’t log in"
              value={users.filter((u) => u.status === 'disabled' || u.status === 'closed').length}
              hint="Disabled or closed"
              loading={loading}
            />
            <StatCard
              label="Password resets"
              value={countLogs('user.password_reset', (d) => withinDays(d, 7))}
              hint="This week"
              loading={loading}
            />
          </div>

          <Card>
            <CardHeader title="Staff activity" link="Audit log" to="/admin/audit-log" />
            <p className="-mt-1 pb-3 text-sm text-muted">What staff did lately. You can review it here but can’t change it.</p>
            {loading ? (
              <Skeleton className="h-40" />
            ) : staffActivity.length === 0 ? (
              <p className="border-t border-divider pt-4 text-muted">No staff activity yet.</p>
            ) : (
              <ul>
                {staffActivity.map((log) => {
                  const t = describeLog(log, userById, me?._id)
                  return (
                    <li key={log._id} className="flex items-center gap-3.5 border-t border-divider py-3">
                      <Avatar name={userById[log.actor]?.name ?? '?'} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] text-label">
                          <span className="font-semibold text-text">{t.actor}</span> {t.verb}{' '}
                          <span className="font-semibold text-text">{t.target}</span>
                        </p>
                        <p className="text-[13px] text-muted">Staff · {formatRelative(log.createdAt)}</p>
                      </div>
                      <Tag>{TYPE_LABELS[log.targetType] ?? log.targetType}</Tag>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Access changes" link="All" to="/admin/audit-log" />
            {loading ? (
              <Skeleton className="h-32" />
            ) : accessChanges.length === 0 ? (
              <p className="border-t border-divider pt-4 text-muted">No access changes yet.</p>
            ) : (
              <ul>
                {accessChanges.map((log) => {
                  const t = describeLog(log, userById, me?._id)
                  const Icon = accessIcons[log.action] ?? ShieldIcon
                  return (
                    <li key={log._id} className="flex gap-3 border-t border-divider py-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text">
                          {t.actor} {t.verb} {t.target}
                        </p>
                        <p className="text-[13px] text-muted">{formatRelative(log.createdAt)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Security alerts sent" link="Log" to="/admin/notification-log" />
            <p className="-mt-1 pb-3 text-[13px] text-muted">Message text is hidden from admins.</p>
            {loading ? (
              <Skeleton className="h-28" />
            ) : securityAlerts.length === 0 ? (
              <p className="border-t border-divider pt-4 text-muted">No security alerts yet.</p>
            ) : (
              <ul>
                {securityAlerts.map((n) => (
                  <li key={n._id} className="border-t border-divider py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-text">
                        To {userById[n.recipient]?.name ?? 'a user'}
                      </p>
                      <p className="shrink-0 text-[13px] text-muted">{formatRelative(n.createdAt)}</p>
                    </div>
                    <p className="text-sm text-muted">Security · {n.isRead ? 'Read' : 'Unread'}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {creating && (
        <CreateStaffModal
          onClose={() => setCreating(false)}
          onCreated={(s) => {
            setCreating(false)
            showToast(`Staff account created for ${s.name}.`)
            load()
          }}
        />
      )}
    </>
  )
}
