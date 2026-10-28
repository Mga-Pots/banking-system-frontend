import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../components/ui/Toast'
import { UserPlusIcon } from '../../components/ui/Icons'
import { FilterSelect, SearchInput } from '../../components/admin/AdminBits'
import UserTable from '../../components/admin/UserTable'
import UserDialogs from '../../components/admin/UserDialogs'
import { useAuth } from '../../context/AuthContext'
import { getUsers } from '../../api/admin'

const messageOf = (err) => err.response?.data?.message ?? err.message
const TABS = [
  ['all', 'All'],
  ['customer', 'Customers'],
  ['staff', 'Staff'],
  ['admin', 'Admins'],
]

// Everyone's identity and access. No balances, accounts, or transactions here.
export default function AdminUsers() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState({ status: 'loading', users: [], error: '' })
  const [tab, setTab] = useState('all')
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
  const q = search.trim().toLowerCase()
  const filtered = users
    .filter((u) => tab === 'all' || u.role === tab)
    .filter((u) => statusFilter === 'any' || u.status === statusFilter)
    .filter((u) => idFilter === 'any' || (u.role === 'customer' && (idFilter === 'verified') === u.isVerified))
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
        <Button onClick={() => setDialog({ type: 'staff' })}>
          <UserPlusIcon size={18} />
          Create staff
        </Button>
      </div>
      <p className="mb-6 text-sm text-muted">
        Identity and access only. Roles are fixed when an account is created: to remove access, disable or close it.
      </p>

      <Card>
        <div className="flex flex-col gap-3 pb-5 sm:flex-row">
          <SearchInput id="user-search" label="Search users" value={search} onChange={setSearch} placeholder="Search name, email, or contact number" />
          <FilterSelect id="status-filter" label="Status" value={statusFilter} onChange={setStatusFilter}>
            <option value="any">Status: Any</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
            <option value="disabled">Disabled</option>
            <option value="closed">Closed</option>
          </FilterSelect>
          <FilterSelect id="id-filter" label="ID check" value={idFilter} onChange={setIdFilter}>
            <option value="any">ID check: Any</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </FilterSelect>
        </div>
        {loading ? (
          <Skeleton className="h-72" />
        ) : (
          <UserTable key={tableKey} users={filtered} meId={me?._id} onPick={(type, user) => setDialog({ type, user })} />
        )}
      </Card>

      <UserDialogs dialog={dialog} onClose={() => setDialog(null)} done={done} />
    </>
  )
}
