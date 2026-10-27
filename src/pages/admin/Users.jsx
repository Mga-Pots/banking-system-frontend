import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { ChevronDownIcon, UserPlusIcon } from '../../components/ui/Icons'
import { IdCheck, UserStatus } from '../../components/admin/UserBadges'
import { roleLabels } from '../../components/admin/roleLabels'
import ManageMenu from '../../components/admin/ManageMenu'
import CreateStaffModal from '../../components/admin/CreateStaffModal'
import VerifyCustomerModal from '../../components/admin/VerifyCustomerModal'
import ChangeRoleModal from '../../components/admin/ChangeRoleModal'
import UserStatusModal from '../../components/admin/UserStatusModal'
import { useAuth } from '../../context/AuthContext'
import { getAccounts, getUsers } from '../../api/admin'
import { initialsOf } from '../../utils/names'

const PAGE_SIZE = 8
const messageOf = (err) => err.response?.data?.message ?? err.message
const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const TABS = [
  ['all', 'All'],
  ['customer', 'Customers'],
  ['staff', 'Staff'],
  ['admin', 'Admins'],
]

const statusMessages = {
  disabled: (name) => `${name}’s account is disabled.`,
  active: (name) => `${name}’s account is back on.`,
  closed: (name) => `${name}’s account is closed permanently.`,
}

// A compact dropdown for the filter bar (its label is for screen readers only).
function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <div className="relative sm:w-48">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full cursor-pointer appearance-none rounded-xl border-[1.5px] border-field-line bg-field pr-11 pl-4 text-[15px] text-text outline-none transition focus:border-wallet focus:ring-4 focus:ring-wallet/20"
      >
        {children}
      </select>
      <ChevronDownIcon size={18} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink" />
    </div>
  )
}

export default function AdminUsers() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState({ status: 'loading', users: [], accounts: [], error: '' })
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('any')
  const [idFilter, setIdFilter] = useState('any')
  const [page, setPage] = useState(0)
  const [dialog, setDialog] = useState(null) // { type, user }

  const load = useCallback(async () => {
    try {
      const [users, accounts] = await Promise.all([getUsers(), getAccounts()])
      setData({ status: 'ready', users: users.data, accounts: accounts.data, error: '' })
    } catch (err) {
      setData((current) => ({ ...current, status: 'error', error: messageOf(err) }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Any filter change goes back to the first page
  const filterBy = (setter) => (value) => {
    setter(value)
    setPage(0)
  }

  const done = (message) => {
    setDialog(null)
    showToast(message)
    load()
  }

  const { users, accounts } = data
  const loading = data.status === 'loading'
  const count = (role) => users.filter((u) => role === 'all' || u.role === role).length
  const query = search.trim().toLowerCase()

  const filtered = users
    .filter((u) => tab === 'all' || u.role === tab)
    .filter((u) => statusFilter === 'any' || u.status === statusFilter)
    .filter((u) => {
      if (idFilter === 'any') return true
      if (u.role !== 'customer') return false
      return idFilter === 'verified' ? u.isVerified : !u.isVerified
    })
    .filter(
      (u) =>
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.contactNumber ?? '').includes(query),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const shown = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  if (data.status === 'error' && users.length === 0) {
    return (
      <Card role="alert">
        <h2 className="text-xl font-bold text-text">We couldn’t load users</h2>
        <p className="mt-1 mb-4 text-muted">{data.error}</p>
        <Button onClick={load}>Try again</Button>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
          {TABS.map(([value, label]) => {
            const on = tab === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => filterBy(setTab)(value)}
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

      <Card>
        <div className="flex flex-col gap-3 pb-5 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="user-search" className="sr-only">
              Search users
            </label>
            <input
              id="user-search"
              type="search"
              value={search}
              onChange={(e) => filterBy(setSearch)(e.target.value)}
              placeholder="Search name, email, or contact number"
              className="h-12 w-full min-w-0 rounded-xl border-[1.5px] border-field-line bg-field px-4 text-[15px] text-text outline-none transition placeholder:text-placeholder focus:border-wallet focus:ring-4 focus:ring-wallet/20"
            />
          </div>
          <FilterSelect id="status-filter" label="Status" value={statusFilter} onChange={filterBy(setStatusFilter)}>
            <option value="any">Status: Any</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
            <option value="disabled">Disabled</option>
            <option value="closed">Closed</option>
          </FilterSelect>
          <FilterSelect id="id-filter" label="ID check" value={idFilter} onChange={filterBy(setIdFilter)}>
            <option value="any">ID check: Any</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </FilterSelect>
        </div>

        {loading ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-t border-divider text-xs font-bold tracking-wider text-muted uppercase">
                  <th scope="col" className="py-3 pr-4 font-bold">Name</th>
                  <th scope="col" className="w-[120px] py-3 pr-4 font-bold">Role</th>
                  <th scope="col" className="w-[140px] py-3 pr-4 font-bold">Status</th>
                  <th scope="col" className="w-[140px] py-3 pr-4 font-bold">ID check</th>
                  <th scope="col" className="w-[130px] py-3 pr-4 font-bold">Joined</th>
                  <th scope="col" className="w-[140px] py-3 font-bold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr className="border-t border-divider">
                    <td colSpan={6} className="py-10 text-center text-muted">
                      No users match these filters.
                    </td>
                  </tr>
                )}
                {shown.map((u) => {
                  const isMe = u._id === me?._id
                  const needsVerify = u.role === 'customer' && !u.isVerified && u.status === 'active'
                  return (
                    <tr key={u._id} className="border-t border-divider">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-ink"
                          >
                            {initialsOf(u.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-text">
                              {u.name}
                              {isMe && <span className="font-normal text-muted"> (you)</span>}
                            </p>
                            <p className="truncate text-sm text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-sm font-semibold text-label">{roleLabels[u.role] ?? u.role}</td>
                      <td className="py-3.5 pr-4">
                        <UserStatus status={u.status} />
                      </td>
                      <td className="py-3.5 pr-4">
                        <IdCheck user={u} />
                      </td>
                      <td className="py-3.5 pr-4 text-sm text-muted">{shortDate(u.createdAt)}</td>
                      <td className="py-3.5">
                        <div className="flex justify-end">
                          {isMe || u.status === 'closed' ? null : needsVerify ? (
                            <Button variant="secondary" onClick={() => setDialog({ type: 'verify', user: u })}>
                              Verify
                            </Button>
                          ) : (
                            <ManageMenu user={u} onPick={(action) => setDialog({ type: action, user: u })} />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-5">
          <p className="text-sm text-muted">
            {filtered.length === 0
              ? 'Showing 0'
              : `Showing ${current * PAGE_SIZE + 1}–${current * PAGE_SIZE + shown.length} of ${filtered.length}`}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      {dialog?.type === 'staff' && (
        <CreateStaffModal
          onClose={() => setDialog(null)}
          onCreated={(staff) => done(`Staff account created for ${staff.name}.`)}
        />
      )}
      {dialog?.type === 'verify' && (
        <VerifyCustomerModal
          customer={dialog.user}
          account={accounts.find((a) => a.owner === dialog.user._id)}
          onClose={() => setDialog(null)}
          onVerified={(c) => done(`${c.name} is now verified.`)}
        />
      )}
      {dialog?.type === 'role' && (
        <ChangeRoleModal
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSaved={(u, role) => done(`${u.name} is now ${roleLabels[role] === 'Admin' ? 'an' : 'a'} ${roleLabels[role].toLowerCase()}.`)}
        />
      )}
      {['disable', 'enable', 'close'].includes(dialog?.type) && (
        <UserStatusModal
          user={dialog.user}
          action={dialog.type}
          onClose={() => setDialog(null)}
          onSaved={(u, status) => done(statusMessages[status](u.name))}
        />
      )}
    </>
  )
}
