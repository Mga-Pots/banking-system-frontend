import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Amount from '../../components/ui/Amount'
import Sensitive from '../../components/ui/Sensitive'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../components/ui/Toast'
import AccountStatus from '../../components/customer/AccountStatus'
import { FilterSelect, SearchInput } from '../../components/admin/AdminBits'
import AccountStatusModal from '../../components/staff/AccountStatusModal'
import CloseAccountModal from '../../components/staff/CloseAccountModal'
import { getAccounts } from '../../api/staff'
import { formatAccountNumber, maskAccountNumber } from '../../utils/formatAccountNumber'
import { initialsOf } from '../../utils/names'
import { LOADING, keepData, retrying, settle } from '../../utils/loadResults'

const PAGE_SIZE = 8

// Same filter bar as the admin pages and staff Transactions. Opens on Active.
const STATUS_OPTIONS = [
  ['all', 'Status: All'],
  ['active', 'Active'],
  ['frozen', 'Frozen'],
  ['closed', 'Closed'],
]

// Every bank account, with its owner and balance. Staff freeze active accounts
// (with a reason), reactivate frozen ones, and close accounts for good (which closes
// the customer's login too). Closed accounts can't change.
export default function StaffAccounts() {
  const { showToast } = useToast()
  const [sections, setSections] = useState({ accounts: LOADING })
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [changing, setChanging] = useState(null) // the account being frozen or reactivated
  const [closing, setClosing] = useState(null) // the account being closed

  const load = useCallback(
    () =>
      settle([getAccounts()]).then(([accounts]) =>
        setSections((current) => ({ accounts: keepData(current.accounts, accounts) })),
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

  // Any filter change goes back to the first page
  const filterBy = (setter) => (value) => {
    setter(value)
    setPage(0)
  }

  const isDefault = tab === 'active' && !search
  const clearFilters = () => {
    setTab('active')
    setSearch('')
    setPage(0)
  }

  const accounts = sections.accounts.data ?? []
  const loading = sections.accounts.status === 'loading'
  const query = search.trim().toLowerCase()
  const digits = query.replace(/\s/g, '')

  const filtered = accounts
    .filter((a) => tab === 'all' || a.status === tab)
    .filter((a) => {
      if (!query) return true
      const owner = a.owner
      return (
        a.accountNumber.includes(digits) ||
        (owner?.name ?? '').toLowerCase().includes(query) ||
        (owner?.email ?? '').toLowerCase().includes(query)
      )
    })

  // "4 accounts · Active · “juan”"
  const activeFilters = [
    tab !== 'all' && STATUS_OPTIONS.find(([v]) => v === tab)?.[1],
    query && `“${search.trim()}”`,
  ].filter(Boolean)

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const shown = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  if (!loading && !sections.accounts.data) {
    return <ErrorState title="We couldn’t load accounts" message={sections.accounts.error} onRetry={retry} />
  }

  return (
    <>
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchInput
            id="account-search"
            label="Search accounts"
            value={search}
            onChange={filterBy(setSearch)}
            placeholder="Search account number, owner name or email"
          />
          <FilterSelect id="status-filter" label="Status" value={tab} onChange={filterBy(setTab)}>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <p className="min-w-0 text-muted">
              <span className="font-bold text-text">
                {filtered.length} {filtered.length === 1 ? 'account' : 'accounts'}
              </span>
              {activeFilters.length > 0 && ` · ${activeFilters.join(' · ')}`}
            </p>
            {!isDefault && (
              <button
                type="button"
                onClick={clearFilters}
                className="-my-3 shrink-0 cursor-pointer py-3 font-bold text-wallet hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading ? (
          <Skeleton className="mt-4 h-72" />
        ) : (
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="border-t border-divider text-xs font-bold tracking-wider text-muted uppercase">
                  <th scope="col" className="py-3 pr-4 font-bold">Owner</th>
                  <th scope="col" className="w-[170px] py-3 pr-4 font-bold">Account number</th>
                  <th scope="col" className="w-[120px] py-3 pr-4 font-bold">Status</th>
                  <th scope="col" className="w-[160px] py-3 pr-4 text-right font-bold">Balance</th>
                  <th scope="col" className="w-[230px] py-3 font-bold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr className="border-t border-divider">
                    <td colSpan={5} className="py-12">
                      <div className="flex flex-col items-center gap-3 text-center">
                        {accounts.length === 0 ? (
                          <p className="text-[15px] font-semibold text-text">No accounts yet</p>
                        ) : (
                          <>
                            <p className="text-[15px] font-semibold text-text">No accounts match your filters</p>
                            <p className="max-w-xs text-sm text-muted">Try a different search, or clear the filters.</p>
                            {!isDefault && (
                              <Button variant="secondary" onClick={clearFilters}>
                                Clear filters
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {shown.map((a) => {
                  const owner = a.owner
                  return (
                    <tr key={a._id} className="border-t border-divider">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-ink"
                          >
                            {initialsOf(owner?.name)}
                          </span>
                          <div className="min-w-0">
                            {owner ? (
                              <Link
                                to={`/staff/customers/${owner._id}`}
                                className="block truncate text-[15px] font-semibold text-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
                              >
                                {owner.name}
                              </Link>
                            ) : (
                              <p className="text-[15px] font-semibold text-muted">Owner not found</p>
                            )}
                            {owner && <p className="truncate text-sm text-muted">{owner.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-sm font-semibold text-text tabular-nums">
                        <Sensitive mask={maskAccountNumber(a.accountNumber)}>{formatAccountNumber(a.accountNumber)}</Sensitive>
                      </td>
                      <td className="py-3.5 pr-4">
                        <AccountStatus status={a.status} />
                      </td>
                      <td className="py-3.5 pr-4 text-right text-[15px] font-semibold text-text">
                        <Amount centavos={a.balance} sensitive />
                      </td>
                      <td className="py-3.5">
                        {/* No owner means no customer to act for, so nothing here can be changed */}
                        <div className="flex justify-end gap-2" title={owner ? undefined : 'This account has no owner on record'}>
                          {a.status === 'active' && (
                            <Button variant="caution" disabled={!owner} onClick={() => setChanging(a)}>
                              Freeze
                            </Button>
                          )}
                          {a.status === 'frozen' && (
                            <Button disabled={!owner} onClick={() => setChanging(a)}>
                              Reactivate
                            </Button>
                          )}
                          {a.status !== 'closed' && (
                            <Button variant="danger" disabled={!owner} onClick={() => setClosing(a)}>
                              Close
                            </Button>
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
            Page {current + 1} of {pages}
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

      {changing && (
        <AccountStatusModal
          account={changing}
          ownerName={changing.owner?.name}
          onClose={() => setChanging(null)}
          onSaved={(a) => {
            setChanging(null)
            showToast(a.status === 'frozen' ? 'The account is frozen.' : 'The account is active again.')
            load()
          }}
        />
      )}
      {closing && (
        <CloseAccountModal
          account={closing}
          customerId={closing.owner?._id}
          ownerName={closing.owner?.name}
          onClose={() => setClosing(null)}
          onClosed={() => {
            setClosing(null)
            showToast('The account is closed.')
            load()
          }}
        />
      )}
    </>
  )
}
