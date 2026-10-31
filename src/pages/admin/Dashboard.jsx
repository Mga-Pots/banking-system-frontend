import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { ChevronDownIcon, KeyIcon, LockIcon, ShieldIcon, UserPlusIcon } from '../../components/ui/Icons'
import { Avatar, Tag } from '../../components/admin/AdminBits'
import { useAuth } from '../../context/AuthContext'
import { getAuditLogs, getNotificationLogs, getUsers } from '../../api/admin'
import { ACCESS_ACTIONS, TYPE_LABELS, describeLog } from '../../utils/auditText'
import { withinDays } from '../../utils/dates'
import { formatRelative } from '../../utils/formatDate'
import { peopleIndex } from '../../utils/people'
import { LOADING, combine, keepData, retrying, settle } from '../../utils/loadResults'

const accessIcons = { 'staff.create': UserPlusIcon, 'user.password_reset': KeyIcon, 'user.status_update': LockIcon }

// Same as the staff overview: title on the left, "See all" on the right.
// `label` names the destination for screen readers, since every link reads "See all".
function CardHeader({ title, label, to }) {
  return (
    <div className="flex items-center justify-between gap-4 pb-2">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      <Link
        to={to}
        aria-label={label}
        className="-my-3 inline-flex shrink-0 items-center gap-1 py-3 text-sm font-bold text-wallet hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
      >
        See all
        <ChevronDownIcon size={16} className="-rotate-90" />
      </Link>
    </div>
  )
}

// One figure in the summary card, like the staff overview. On phones the count sits
// to the right of the label; from `sm` the three figures stand side by side.
function SummaryItem({ label, value, hint, loading, failed }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-1 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
      <dt className="col-start-1 row-start-1 text-xs font-bold tracking-wider text-muted uppercase">{label}</dt>
      <dd className="col-start-2 row-span-2 row-start-1 sm:col-start-1 sm:row-span-1 sm:row-start-2">
        {loading ? (
          <Skeleton className="h-7 w-10" />
        ) : (
          <span className="font-brand text-xl font-semibold text-ink tabular-nums">{failed ? '–' : value}</span>
        )}
      </dd>
      <dd className="col-start-1 row-start-2 text-sm text-muted sm:row-start-3">{failed ? 'Couldn’t load' : hint}</dd>
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
  const userById = peopleIndex(users, [...logs.map((l) => l.actorInfo), ...notifs.map((n) => n.recipientInfo)])
  const byRole = (r) => users.filter((u) => u.role === r)
  const staff = byRole('staff')
  const sorted = [...logs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const staffActivity = sorted.filter((l) => (userById[l.actor]?.role ?? l.actorRole) === 'staff').slice(0, 5)
  const accessChanges = sorted.filter((l) => ACCESS_ACTIONS.includes(l.action)).slice(0, 4)
  const securityAlerts = [...notifs]
    .filter((n) => n.type === 'security')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)

  const customers = byRole('customer')
  const activeStaff = staff.filter((u) => u.status === 'active').length
  const alertsThisWeek = notifs.filter((n) => n.type === 'security' && withinDays(n.createdAt, 7))

  return (
    <>
      <h1 className="sr-only">Admin overview</h1>

      {/* One summary card, like the staff overview: the counts sum up the lists below */}
      <Card className="mb-6">
        <dl className="divide-y divide-divider sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-[1fr_1fr_295px]">
          <SummaryItem
            label="Staff"
            value={staff.length}
            hint={`${activeStaff} active · ${staff.length - activeStaff} closed`}
            loading={usersLoading}
            failed={usersFailed}
          />
          <SummaryItem
            label="Customers"
            value={customers.length}
            hint={`${customers.filter((u) => withinDays(u.createdAt, 7)).length} new this week`}
            loading={usersLoading}
            failed={usersFailed}
          />
          <SummaryItem
            label="Security alerts"
            value={alertsThisWeek.length}
            hint="Sent this week"
            loading={notifsLoading}
            failed={notifsFailed}
          />
        </dl>
      </Card>

      {/* Same columns as the customer and staff overviews */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Staff activity" label="See the whole audit log" to="/admin/audit-log" />
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
            <CardHeader title="Access changes" label="See all access changes in the audit log" to="/admin/audit-log" />
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
            <CardHeader title="Security alerts" label="See the notification log" to="/admin/notification-log" />
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
