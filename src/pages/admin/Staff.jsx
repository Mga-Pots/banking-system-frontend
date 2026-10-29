import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../components/ui/Toast'
import { UserPlusIcon } from '../../components/ui/Icons'
import { FilterSelect, SearchInput, StatCard } from '../../components/admin/AdminBits'
import UserTable from '../../components/admin/UserTable'
import UserDialogs from '../../components/admin/UserDialogs'
import { useAuth } from '../../context/AuthContext'
import { getUsers } from '../../api/admin'
import { withinDays } from '../../utils/dates'

const messageOf = (err) => err.response?.data?.message ?? err.message

// Staff and admin accounts. Admin creates staff here; access is removed by
// disabling or closing (roles never change).
export default function AdminStaff() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState({ status: 'loading', users: [], error: '' })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('any')
  const [dialog, setDialog] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await getUsers()
      setData({ status: 'ready', users: res.data.filter((u) => u.role !== 'customer'), error: '' })
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
  const staff = users.filter((u) => u.role === 'staff')
  const activeStaff = staff.filter((u) => u.status === 'active').length
  const admins = users.filter((u) => u.role === 'admin').length
  const thisMonth = staff.filter((u) => withinDays(u.createdAt, 30))
  const q = search.trim().toLowerCase()
  const filtered = users
    .filter((u) => roleFilter === 'any' || u.role === roleFilter)
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (data.status === 'error' && users.length === 0) {
    return <ErrorState title="We couldn’t load staff" message={data.error} onRetry={load} />
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setDialog({ type: 'staff' })}>
          <UserPlusIcon size={18} />
          Create staff
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Staff" value={staff.length} hint={`${activeStaff} active, ${staff.length - activeStaff} closed`} loading={loading} />
        <StatCard label="Admins" value={admins} hint="Created by the seed script" loading={loading} />
        <StatCard
          label="Added this month"
          value={thisMonth.length}
          hint={thisMonth.length ? thisMonth.map((u) => u.name).slice(0, 2).join(', ') : 'No new staff'}
          loading={loading}
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 pb-5 sm:flex-row">
          <SearchInput id="staff-search" label="Search staff" value={search} onChange={setSearch} placeholder="Search staff by name or email" />
          <FilterSelect id="role-filter" label="Role" value={roleFilter} onChange={setRoleFilter}>
            <option value="any">Staff and admins</option>
            <option value="staff">Staff only</option>
            <option value="admin">Admins only</option>
          </FilterSelect>
        </div>
        {loading ? (
          <Skeleton className="h-60" />
        ) : (
          <UserTable
            key={`${q}|${roleFilter}`}
            users={filtered}
            meId={me?._id}
            showIdCheck={false}
            empty="No staff match these filters."
            onPick={(type, user) => setDialog({ type, user })}
          />
        )}
      </Card>

      <UserDialogs dialog={dialog} onClose={() => setDialog(null)} done={done} />
    </>
  )
}
