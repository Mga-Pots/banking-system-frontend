import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../components/ui/Toast'
import AccountStatus from '../../components/customer/AccountStatus'
import { IdCheck, UserStatus } from '../../components/admin/UserBadges'
import FilterSelect from '../../components/staff/FilterSelect'
import VerifyCustomerModal from '../../components/staff/VerifyCustomerModal'
import { getCustomers } from '../../api/staff'
import { formatAccountNumber } from '../../utils/formatAccountNumber'
import { initialsOf } from '../../utils/names'

const PAGE_SIZE = 8
const messageOf = (err) => err.response?.data?.message ?? err.message

// Customers can be verified once their ID is checked, while their account is active.
const canVerify = (c) => !c.isVerified && c.status === 'active'

// Every customer, with their bank account. No balances here: those are on the
// customer's own page (see "Data visibility" in docs/least-privilege-guide.md).
export default function StaffCustomers() {
  const { showToast } = useToast()
  const [data, setData] = useState({ status: 'loading', customers: [], error: '' })
  const [search, setSearch] = useState('')
  const [idFilter, setIdFilter] = useState('any')
  const [page, setPage] = useState(0)
  const [verifying, setVerifying] = useState(null) // the customer being verified

  const load = useCallback(async () => {
    try {
      const res = await getCustomers()
      setData({ status: 'ready', customers: res.data, error: '' })
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

  const { customers } = data
  const loading = data.status === 'loading'
  const query = search.trim().toLowerCase()

  const filtered = customers
    .filter((c) => idFilter === 'any' || (idFilter === 'verified' ? c.isVerified : !c.isVerified))
    .filter(
      (c) =>
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.contactNumber ?? '').includes(query) ||
        (c.account?.accountNumber ?? '').includes(query.replace(/\s/g, '')),
    )

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const shown = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  if (data.status === 'error' && customers.length === 0) {
    return <ErrorState title="We couldn’t load customers" message={data.error} onRetry={load} />
  }

  return (
    <>
      <Card>
        <div className="flex flex-col gap-3 pb-5 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="customer-search" className="sr-only">
              Search customers
            </label>
            <input
              id="customer-search"
              type="search"
              value={search}
              onChange={(e) => filterBy(setSearch)(e.target.value)}
              placeholder="Search name, email, mobile or account number"
              className="h-12 w-full min-w-0 rounded-xl border-[1.5px] border-field-line bg-field px-4 text-[15px] text-text outline-none transition placeholder:text-placeholder focus:border-wallet focus:ring-4 focus:ring-wallet/20"
            />
          </div>
          <FilterSelect id="id-filter" label="ID check" value={idFilter} onChange={filterBy(setIdFilter)}>
            <option value="any">ID check: All</option>
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
          </FilterSelect>
        </div>

        {loading ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-t border-divider text-xs font-bold tracking-wider text-muted uppercase">
                  <th scope="col" className="py-3 pr-4 font-bold">Customer</th>
                  <th scope="col" className="w-[140px] py-3 pr-4 font-bold">Mobile</th>
                  <th scope="col" className="w-[120px] py-3 pr-4 font-bold">Status</th>
                  <th scope="col" className="w-[120px] py-3 pr-4 font-bold">ID check</th>
                  <th scope="col" className="w-[190px] py-3 pr-4 font-bold">Account</th>
                  <th scope="col" className="w-[110px] py-3 font-bold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr className="border-t border-divider">
                    <td colSpan={6} className="py-10 text-center text-muted">
                      {customers.length === 0 ? 'No customers yet.' : 'No customers match these filters.'}
                    </td>
                  </tr>
                )}
                {shown.map((c) => (
                  <tr key={c._id} className="border-t border-divider">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-ink"
                        >
                          {initialsOf(c.name)}
                        </span>
                        <div className="min-w-0">
                          <Link
                            to={`/staff/customers/${c._id}`}
                            className="block truncate text-[15px] font-semibold text-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
                          >
                            {c.name}
                          </Link>
                          <p className="truncate text-sm text-muted">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-sm text-label tabular-nums">{c.contactNumber || 'Not given'}</td>
                    <td className="py-3.5 pr-4">
                      <UserStatus status={c.status} />
                    </td>
                    <td className="py-3.5 pr-4">
                      {/* IdCheck only shows a badge for customers; staff responses leave out the role */}
                      <IdCheck user={{ ...c, role: 'customer' }} />
                    </td>
                    <td className="py-3.5 pr-4">
                      {c.account ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-sm font-semibold text-text tabular-nums">
                            {formatAccountNumber(c.account.accountNumber)}
                          </span>
                          <AccountStatus status={c.account.status} />
                        </div>
                      ) : (
                        <span className="text-sm text-muted">No account</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="flex justify-end">
                        {canVerify(c) ? (
                          <Button variant="positive" onClick={() => setVerifying(c)}>
                            Verify
                          </Button>
                        ) : (
                          <Button variant="secondary" to={`/staff/customers/${c._id}`}>
                            View
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      {verifying && (
        <VerifyCustomerModal
          customer={verifying}
          onClose={() => setVerifying(null)}
          onVerified={(c) => {
            setVerifying(null)
            showToast(`${c.name} is now verified.`)
            load()
          }}
        />
      )}
    </>
  )
}
