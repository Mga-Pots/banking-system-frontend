import { Fragment, useCallback, useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/customer/Pagination'
import { ShieldIcon } from '../../components/ui/Icons'
import { Avatar, FilterSelect, SearchInput, Tag } from '../../components/admin/AdminBits'
import { roleLabels } from '../../components/admin/roleLabels'
import { useAuth } from '../../context/AuthContext'
import { getAuditLogs, getUsers } from '../../api/admin'
import { ACTION_LABELS, TYPE_LABELS, describeLog } from '../../utils/auditText'
import { groupByDay, timeOf, withinDays } from '../../utils/dates'
import { LOADING, keepData, retrying, settle } from '../../utils/loadResults'

const PAGE_SIZE = 20

// Read-only record of every change by staff and admins. Nothing here can be edited.
// Users only give the names, so the log still shows without them.
export default function AdminAuditLog() {
  const { user: me } = useAuth()
  const [sections, setSections] = useState({ logs: LOADING, users: LOADING })
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('any')
  const [who, setWho] = useState('any')
  const [range, setRange] = useState('7')
  const [page, setPage] = useState(1)

  const load = useCallback(
    () =>
      settle([getAuditLogs(), getUsers()]).then(([logs, users]) =>
        setSections((current) => ({ logs: keepData(current.logs, logs), users: keepData(current.users, users) })),
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

  const filterBy = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const logs = sections.logs.data ?? []
  const loading = sections.logs.status === 'loading'
  const userById = Object.fromEntries((sections.users.data ?? []).map((u) => [u._id, u]))
  const actors = [...new Set(logs.map((l) => l.actor))].filter((id) => userById[id])
  const q = search.trim().toLowerCase()
  const rows = logs
    .map((log) => ({ log, text: describeLog(log, userById, me?._id) }))
    .filter(({ log }) => action === 'any' || log.action === action)
    .filter(({ log }) => who === 'any' || log.actor === who)
    .filter(({ log }) => range === 'all' || withinDays(log.createdAt, Number(range)))
    .filter(({ text }) => !q || `${text.actor} ${text.verb} ${text.target}`.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.log.createdAt) - new Date(a.log.createdAt))
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const groups = groupByDay(shown, (r) => r.log.createdAt)

  if (!loading && !sections.logs.data) {
    return <ErrorState title="We couldn’t load the audit log" message={sections.logs.error} onRetry={retry} />
  }

  return (
    <>
      <p className="mb-6 flex items-center gap-2.5 rounded-2xl bg-mint px-5 py-3.5 text-sm font-semibold text-ink">
        <ShieldIcon size={18} className="shrink-0" />
        Every change by staff and admins is recorded here. Entries can’t be edited or deleted.
      </p>

      <Card>
        <div className="flex flex-col gap-3 pb-5 lg:flex-row">
          <SearchInput id="audit-search" label="Search the audit log" value={search} onChange={filterBy(setSearch)} placeholder="Search by name or ID" />
          <FilterSelect id="action-filter" label="Action" value={action} onChange={filterBy(setAction)}>
            <option value="any">Action: All</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect id="who-filter" label="Who" value={who} onChange={filterBy(setWho)}>
            <option value="any">Who: Anyone</option>
            {actors.map((id) => (
              <option key={id} value={id}>
                {id === me?._id ? 'You' : userById[id].name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect id="range-filter" label="Date range" value={range} onChange={filterBy(setRange)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All time</option>
          </FilterSelect>
        </div>

        {sections.users.status === 'error' && !sections.users.data && (
          <ErrorState
            compact
            title="Names didn’t load, so entries show “Someone” and “a user”."
            message={sections.users.error}
            onRetry={retry}
            className="mb-5 rounded-xl border border-divider p-4"
          />
        )}

        {loading ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-t border-divider text-xs font-bold tracking-wider text-muted uppercase">
                  <th scope="col" className="w-[110px] py-3 pr-4 font-bold">When</th>
                  <th scope="col" className="w-[220px] py-3 pr-4 font-bold">Who</th>
                  <th scope="col" className="py-3 pr-4 font-bold">What happened</th>
                  <th scope="col" className="w-[120px] py-3 font-bold">Type</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 && (
                  <tr className="border-t border-divider">
                    <td colSpan={4} className="py-10 text-center text-muted">
                      No entries match these filters.
                    </td>
                  </tr>
                )}
                {groups.map(({ day, items }) => (
                  <Fragment key={day}>
                    <tr className="border-t border-divider">
                      <th colSpan={4} scope="colgroup" className="pt-4 pb-1.5 text-xs font-bold tracking-wider text-ink uppercase">
                        {day}
                      </th>
                    </tr>
                    {items.map(({ log, text }) => (
                      <tr key={log._id} className="border-t border-divider">
                        <td className="py-3 pr-4 text-sm text-muted">{timeOf(log.createdAt)}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={userById[log.actor]?.name ?? '?'} size="sm" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-text">{text.actor}</span>
                              <span className="block text-xs text-muted">{roleLabels[text.actorRole] ?? ''}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-[15px] text-label">
                          {text.verb} <span className="font-semibold text-text">{text.target}</span>
                        </td>
                        <td className="py-3">
                          <Tag>{TYPE_LABELS[log.targetType] ?? log.targetType}</Tag>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-5">
          <p className="text-sm text-muted">
            Showing {shown.length} of {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </p>
          {totalPages > 1 && <Pagination page={current} totalPages={totalPages} onChange={setPage} />}
        </div>
      </Card>
    </>
  )
}
