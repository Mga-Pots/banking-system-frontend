import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState, { ServerMessage } from '../../components/ui/ErrorState'
import Weave from '../../components/ui/Weave'
import { ChevronDownIcon, KeyIcon, LockIcon, ShieldIcon, UserPlusIcon, UsersIcon } from '../../components/ui/Icons'
import { Avatar, StatCard, Tag } from '../../components/admin/AdminBits'
import { useAuth } from '../../context/AuthContext'
import { getAuditLogs, getNotificationLogs, getUsers } from '../../api/admin'
import { ACCESS_ACTIONS, TYPE_LABELS, describeLog } from '../../utils/auditText'
import { isToday, withinDays } from '../../utils/dates'
import { formatRelative } from '../../utils/formatDate'
import { peopleIndex } from '../../utils/people'
import { LOADING, combine, keepData, retrying, settle } from '../../utils/loadResults'

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

// Shown in place of a card's list when the data it needs didn't load.
function SectionError({ title, section, onRetry }) {
  return <ErrorState compact title={title} message={section.error} onRetry={onRetry} className="border-t border-divider pt-4" />
}

// Admin = IT and people. This overview only uses identity/access data, the audit log,
// and notification metadata: no balances, bank accounts, or transactions.
// Users, audit logs and notifications load separately, so one failing call only
// shows an error in the parts that need it.
export default function AdminDashboard() {
  const { user: me } = useAuth()
  const [sections, setSections] = useState({ users: LOADING, logs: LOADING, notifs: LOADING })

  const load = useCallback(
    () =>
      settle([getUsers(), getAuditLogs(), getNotificationLogs()]).then(([users, logs, notifs]) =>
        setSections((current) => ({
          users: keepData(current.users, users),
          logs: keepData(current.logs, logs),
          notifs: keepData(current.notifs, notifs),
        })),
      ),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const retry = () => {
    setSections(retrying)
    load()
  }

  // Nothing loaded at all: one page-sized error instead of several small ones.
  if (Object.values(sections).every((s) => s.status === 'error' && !s.data)) {
    return <ErrorState title="We couldn’t load the admin overview" message={sections.users.error} onRetry={retry} />
  }

  const usersLoading = sections.users.status === 'loading'
  const usersFailed = !usersLoading && !sections.users.data
  const logsLoading = sections.logs.status === 'loading'
  const logsFailed = !logsLoading && !sections.logs.data
  // Staff activity needs the users too: it's the logs whose actor is staff.
  const activity = combine(sections.logs, sections.users)

  const users = sections.users.data ?? []
  const logs = sections.logs.data ?? []
  const notifs = sections.notifs.data ?? []
  const notifsLoading = sections.notifs.status === 'loading'
  const notifsFailed = !notifsLoading && !sections.notifs.data
  const notifsToday = notifs.filter((n) => isToday(n.createdAt))
  const userById = peopleIndex(users, [...logs.map((l) => l.actorInfo), ...notifs.map((n) => n.recipientInfo)])
  const byRole = (r) => users.filter((u) => u.role === r)
  const staff = byRole('staff')
  const sorted = [...logs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const countLogs = (action, test) => logs.filter((l) => l.action === action && test(l.createdAt)).length

  const staffActivity = sorted.filter((l) => (userById[l.actor]?.role ?? l.actorRole) === 'staff').slice(0, 5)
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
            aria-busy={usersLoading}
            className="relative isolate grid gap-6 overflow-hidden rounded-[20px] bg-ink p-6 text-white md:grid-cols-[1fr_300px]"
          >
            <Weave className="text-white [mask-image:linear-gradient(to_left,black,transparent_80%)]" opacity={0.1} />
            <div className="relative flex flex-col justify-between gap-6">
              <div>
                <p className="text-[15px] text-white/80">People on sinop</p>
                {usersLoading ? (
                  <Skeleton className="mt-2 h-11 w-32 bg-white/10" />
                ) : usersFailed ? (
                  <div role="alert" className="mt-2">
                    <p className="font-brand text-[22px] leading-tight font-bold">We couldn’t load users</p>
                    <ServerMessage message={sections.users.error} color="text-white/80" className="mt-1 text-sm" />
                  </div>
                ) : (
                  <p className="mt-2 font-brand text-[44px] leading-none font-bold tabular-nums">
                    {users.length.toLocaleString('en-US')}
                  </p>
                )}
                {!usersFailed && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {[
                      plural(byRole('customer').length, 'customer'),
                      `${staff.length} staff`,
                      plural(byRole('admin').length, 'admin'),
                    ].map((t) => (
                      <li key={t} className="rounded-full bg-white/12 px-3 py-1 text-[13px] font-semibold">
                        {usersLoading ? '–' : t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="accent" size="lg" to="/admin/create-staff">
                  <UserPlusIcon size={18} />
                  Create staff
                </Button>
                <Button variant="ghost" size="lg" to="/admin/users">
                  <UsersIcon size={18} />
                  Manage staff
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
              {/* Each row: label, value, and whether its data is missing (loading or failed) */}
              {[
                ['New sign-ups', byRole('customer').filter((u) => isToday(u.createdAt)).length, !sections.users.data],
                ['Staff created', countLogs('staff.create', isToday), !sections.logs.data],
                ['Staff closed', countLogs('user.status_update', isToday), !sections.logs.data],
              ].map(([label, value, missing]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{label}</span>
                  <span className="font-brand text-[15px] font-semibold tabular-nums">{missing ? '–' : value}</span>
                </div>
              ))}
              {logsFailed && <p className="text-[13px] text-white/80">Audit log activity couldn’t load.</p>}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              label="Staff accounts"
              value={staff.length}
              hint={`${staff.filter((u) => u.status === 'active').length} active, ${staff.filter((u) => u.status === 'closed').length} closed`}
              loading={usersLoading}
              failed={usersFailed}
            />
            <StatCard
              label="New sign-ups"
              value={byRole('customer').filter((u) => withinDays(u.createdAt, 7)).length}
              hint="This week"
              loading={usersLoading}
              failed={usersFailed}
            />
            <StatCard
              label="Closed accounts"
              value={users.filter((u) => u.status === 'closed').length}
              hint="Can’t log in anymore"
              loading={usersLoading}
              failed={usersFailed}
            />
            <StatCard
              label="Staff closed"
              value={countLogs('user.status_update', (d) => withinDays(d, 7))}
              hint="This week"
              loading={logsLoading}
              failed={logsFailed}
            />
          </div>

          {/* Notification metadata (moved here from the Notification log page) */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              label="Notifications today"
              value={notifsToday.length}
              hint={`To ${plural(new Set(notifsToday.map((n) => n.recipient)).size, 'user')}`}
              loading={notifsLoading}
              failed={notifsFailed}
            />
            <StatCard
              label="Unread"
              value={notifs.filter((n) => !n.isRead).length}
              hint="Across all users"
              loading={notifsLoading}
              failed={notifsFailed}
            />
            <StatCard
              label="Security alerts"
              value={notifs.filter((n) => n.type === 'security').length}
              hint="Logins and access"
              loading={notifsLoading}
              failed={notifsFailed}
            />
            <StatCard
              label="Account alerts"
              value={notifs.filter((n) => n.type === 'account').length}
              hint="Verified, frozen, or closed"
              loading={notifsLoading}
              failed={notifsFailed}
            />
          </div>

          <Card>
            <CardHeader title="Staff activity" link="Audit log" to="/admin/audit-log" />
            {activity.status === 'loading' ? (
              <Skeleton className="h-40" />
            ) : !activity.data ? (
              <SectionError
                title={activity === sections.logs ? 'We couldn’t load the audit log' : 'We couldn’t load who did what'}
                section={activity}
                onRetry={retry}
              />
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
            {logsLoading ? (
              <Skeleton className="h-32" />
            ) : logsFailed ? (
              <SectionError title="We couldn’t load the audit log" section={sections.logs} onRetry={retry} />
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
            {sections.notifs.status === 'loading' ? (
              <Skeleton className="h-28" />
            ) : !sections.notifs.data ? (
              <SectionError title="We couldn’t load notifications" section={sections.notifs} onRetry={retry} />
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

    </>
  )
}
