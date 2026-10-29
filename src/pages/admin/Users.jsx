import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../components/ui/Toast'
import { FilterSelect, SearchInput, StatCard } from '../../components/admin/AdminBits'
import UserTable from '../../components/admin/UserTable'
import UserDialogs from '../../components/admin/UserDialogs'
import { useAuth } from '../../context/AuthContext'
import { getUsers } from '../../api/admin'
import { withinDays } from '../../utils/dates'

const messageOf = (err) => err.response?.data?.message ?? err.message
// Staff comes first and is the default: it's the only tab where admins manage anyone.
const TABS = [
  ['staff', 'Staff'],
  ['admin', 'Admins'],
  ['customer', 'Customers'],
  ['all', 'All'],
]

// Everyone's identity and access. No balances, accounts, or transactions here.
// The Staff tab has the staff summary and Manage (close a staff account).
// Creating staff is its own page (sidebar: Create staff).
export default function AdminUsers() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState({ status: 'loading', users: [], error: '' })
  const [tab, setTab] = useState('staff')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('any')
  const [idFilter, setIdFilter] = useState('any')
  const [dialog, setDialog] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await getUsers()
      setData({ status: 'ready', users: res.data, error: '' })
    } catch (err) {
      setData((d) => ({ ...d, status: 'error', error: messageOf(err) }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const done = (message) => {
    setDialog(null)
    showToast(message)
    load()
  }

  const { users } = data
  const loading = data.status === 'loading'
  const count = (role) => users.filter((u) => role === 'all' || u.role === role).length
  const onStaff = tab === 'staff'
  const showIdCheck = tab === 'customer' || tab === 'all' // staff and admins don't need one
  const staff = users.filter((u) => u.role === 'staff')
  const activeStaff = staff.filter((u) => u.status === 'active').length
  const newStaff = staff.filter((u) => withinDays(u.createdAt, 30))
  const q = search.trim().toLowerCase()
  const filtered = users
    .filter((u) => tab === 'all' || u.role === tab)
    .filter((u) => statusFilter === 'any' || u.status === statusFilter)
    .filter((u) => !showIdCheck || idFilter === 'any' || (u.role === 'customer' && (idFilter === 'verified') === u.isVerified))
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.contactNumber ?? '').includes(q))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  // Changing a filter shows a fresh table from page 1
  const tableKey = [tab, q, statusFilter, idFilter].join('|')

  if (data.status === 'error' && users.length === 0) {
    return <ErrorState title="We couldn’t load users" message={data.error} onRetry={load} />
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
          {TABS.map(([value, label]) => {
            const on = tab === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => setTab(value)}
                className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-[18px] text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet ${
                  on ? 'bg-ink text-white' : 'border-[1.5px] border-field-line bg-white text-ink hover:bg-field'
                }`}
              >
                {label}
                <span className={`text-[13px] font-semibold ${on ? 'text-white/75' : 'text-muted'}`}>
                  {loading ? '–' : count(value)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <p className="mb-6 text-sm text-muted">
        Identity and access only. Admins manage staff accounts; customers are handled by staff.
      </p>

      {onStaff && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Staff" value={staff.length} hint={`${activeStaff} active, ${staff.length - activeStaff} closed`} loading={loading} />
          <StatCard label="Admins" value={count('admin')} hint="Created by the seed script" loading={loading} />
          <StatCard
            label="Added this month"
            value={newStaff.length}
            hint={newStaff.length ? newStaff.map((u) => u.name).slice(0, 2).join(', ') : 'No new staff'}
            loading={loading}
          />
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 pb-5 sm:flex-row">
          <SearchInput id="user-search" label="Search users" value={search} onChange={setSearch} placeholder="Search name, email, or contact number" />
          <FilterSelect id="status-filter" label="Status" value={statusFilter} onChange={setStatusFilter}>
            <option value="any">Status: All</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
            <option value="closed">Closed</option>
          </FilterSelect>
          {showIdCheck && (
            <FilterSelect id="id-filter" label="ID check" value={idFilter} onChange={setIdFilter}>
              <option value="any">ID check: All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </FilterSelect>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-72" />
        ) : (
          <UserTable
            key={tableKey}
            users={filtered}
            meId={me?._id}
            manage={onStaff}
            showIdCheck={showIdCheck}
            onPick={(type, user) => setDialog({ type, user })}
          />
        )}
      </Card>

      <UserDialogs dialog={dialog} onClose={() => setDialog(null)} done={done} />
    </>
  )
}
