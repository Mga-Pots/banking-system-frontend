import { Fragment, useCallback, useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import Pagination from '../../components/customer/Pagination'
import { Avatar, FilterSelect, SearchInput, StatCard, Tag } from '../../components/admin/AdminBits'
import { getNotificationLogs, getUsers } from '../../api/admin'
import { groupByDay, isToday, timeOf, withinDays } from '../../utils/dates'

const PAGE_SIZE = 20
const messageOf = (err) => err.response?.data?.message ?? err.message
const TYPES = { transaction: 'Transaction', account: 'Account', security: 'Security', system: 'System' }

// Who got which kind of notification, and when. Metadata only: the message text
// can contain amounts, so admins never get it.
export default function AdminNotificationLog() {
  const [data, setData] = useState({ status: 'loading', items: [], users: [], error: '' })
  const [search, setSearch] = useState('')
  const [type, setType] = useState('any')
  const [read, setRead] = useState('any')
  const [range, setRange] = useState('7')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    try {
      const [items, users] = await Promise.all([getNotificationLogs(), getUsers()])
      setData({ status: 'ready', items: items.data, users: users.data, error: '' })
    } catch (err) {
      setData((d) => ({ ...d, status: 'error', error: messageOf(err) }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filterBy = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const loading = data.status === 'loading'
  const userById = Object.fromEntries(data.users.map((u) => [u._id, u]))
  const q = search.trim().toLowerCase()
  const rows = data.items
    .filter((n) => type === 'any' || n.type === type)
    .filter((n) => read === 'any' || (read === 'read') === n.isRead)
    .filter((n) => range === 'all' || withinDays(n.createdAt, Number(range)))
    .filter((n) => {
      const u = userById[n.recipient]
      return !q || (u && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const groups = groupByDay(shown)
  const today = data.items.filter((n) => isToday(n.createdAt))

  if (data.status === 'error' && data.items.length === 0) {
    return (
      <Card role="alert">
        <h2 className="text-xl font-bold text-text">We couldn’t load the notification log</h2>
        <p className="mt-1 mb-4 text-muted">{data.error}</p>
        <Button onClick={load}>Try again</Button>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Sent today" value={today.length} hint={`To ${new Set(today.map((n) => n.recipient)).size} users`} loading={loading} />
        <StatCard label="Unread" value={data.items.filter((n) => !n.isRead).length} hint="Across all users" loading={loading} />
        <StatCard label="Security alerts" value={data.items.filter((n) => n.type === 'security').length} hint="Logins and password resets" loading={loading} />
        <StatCard label="Account alerts" value={data.items.filter((n) => n.type === 'account').length} hint="Verified, frozen, or closed" loading={loading} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 pb-3 lg:flex-row">
          <SearchInput id="notif-search" label="Search recipient" value={search} onChange={filterBy(setSearch)} placeholder="Search recipient" />
          <FilterSelect id="type-filter" label="Type" value={type} onChange={filterBy(setType)}>
            <option value="any">Type: Any</option>
            {Object.entries(TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect id="read-filter" label="Read" value={read} onChange={filterBy(setRead)}>
            <option value="any">Read: Any</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </FilterSelect>
          <FilterSelect id="range-filter" label="Date range" value={range} onChange={filterBy(setRange)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All time</option>
          </FilterSelect>
        </div>
        <p className="pb-4 text-sm text-muted">
          Message text is hidden because it can contain amounts. You see who got what kind of notice, and when.
        </p>

        {loading ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-t border-divider text-xs font-bold tracking-wider text-muted uppercase">
                  <th scope="col" className="w-[110px] py-3 pr-4 font-bold">When</th>
                  <th scope="col" className="py-3 pr-4 font-bold">Recipient</th>
                  <th scope="col" className="w-[150px] py-3 pr-4 font-bold">Type</th>
                  <th scope="col" className="w-[110px] py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 && (
                  <tr className="border-t border-divider">
                    <td colSpan={4} className="py-10 text-center text-muted">
                      No notifications match these filters.
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
                    {items.map((n) => {
                      const u = userById[n.recipient]
                      return (
                        <tr key={n._id} className="border-t border-divider">
                          <td className="py-3 pr-4 text-sm text-muted">{timeOf(n.createdAt)}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u?.name ?? '?'} size="sm" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-text">{u?.name ?? 'Unknown user'}</span>
                                <span className="block truncate text-xs text-muted">{u?.email}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Tag tone={n.type}>{TYPES[n.type] ?? n.type}</Tag>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 text-sm ${n.isRead ? 'text-muted' : 'font-semibold text-wallet'}`}>
                              <span aria-hidden="true" className={`size-2 rounded-full ${n.isRead ? 'bg-divider' : 'bg-wallet'}`} />
                              {n.isRead ? 'Read' : 'Unread'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-5">
          <p className="text-sm text-muted">
            Showing {shown.length} of {rows.length} {rows.length === 1 ? 'notification' : 'notifications'}
          </p>
          {totalPages > 1 && <Pagination page={current} totalPages={totalPages} onChange={setPage} />}
        </div>
      </Card>
    </>
  )
}
