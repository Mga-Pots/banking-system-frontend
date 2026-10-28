import { useState } from 'react'
import Pagination from '../customer/Pagination'
import ManageMenu from './ManageMenu'
import { Avatar } from './AdminBits'
import { IdCheck, UserStatus } from './UserBadges'
import { roleLabels } from './roleLabels'

const PAGE_SIZE = 8
const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// Identity and access only: name, email, role, status, ID check, joined.
// No balances or account numbers. `onPick(action, user)` opens a dialog.
// `showIdCheck` is off on the Staff page (staff don't need an ID check).
export default function UserTable({ users, meId, onPick, showIdCheck = true, empty = 'No users match these filters.' }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const shown = users.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-t border-divider text-xs font-bold tracking-wider text-muted uppercase">
              <th scope="col" className="py-3 pr-4 font-bold">Name</th>
              <th scope="col" className="w-[110px] py-3 pr-4 font-bold">Role</th>
              <th scope="col" className="w-[130px] py-3 pr-4 font-bold">Status</th>
              {showIdCheck && <th scope="col" className="w-[130px] py-3 pr-4 font-bold">ID check</th>}
              <th scope="col" className="w-[130px] py-3 pr-4 font-bold">Joined</th>
              <th scope="col" className="w-[130px] py-3 font-bold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr className="border-t border-divider">
                <td colSpan={6} className="py-10 text-center text-muted">
                  {empty}
                </td>
              </tr>
            )}
            {shown.map((u) => {
              const isMe = u._id === meId
              // Admins can't manage themselves or other admins, and closed accounts are final.
              const canManage = !isMe && u.role !== 'admin' && u.status !== 'closed'
              return (
                <tr key={u._id} className="border-t border-divider">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
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
                  {showIdCheck && (
                    <td className="py-3.5 pr-4">
                      <IdCheck user={u} />
                    </td>
                  )}
                  <td className="py-3.5 pr-4 text-sm text-muted">{shortDate(u.createdAt)}</td>
                  <td className="py-3.5">
                    <div className="flex justify-end">
                      {canManage && <ManageMenu user={u} onPick={(action) => onPick(action, u)} />}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-5">
        <p className="text-sm text-muted">
          {users.length === 0
            ? 'Showing 0'
            : `Showing ${(current - 1) * PAGE_SIZE + 1}–${(current - 1) * PAGE_SIZE + shown.length} of ${users.length}`}
        </p>
        {totalPages > 1 && <Pagination page={current} totalPages={totalPages} onChange={setPage} />}
      </div>
    </>
  )
}
