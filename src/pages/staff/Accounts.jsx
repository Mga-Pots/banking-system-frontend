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
import AccountStatusModal from '../../components/staff/AccountStatusModal'
import CloseAccountModal from '../../components/staff/CloseAccountModal'
import { getAccounts, getCustomers } from '../../api/staff'
import { formatAccountNumber, maskAccountNumber } from '../../utils/formatAccountNumber'
import { initialsOf } from '../../utils/names'
import { LOADING, keepData, retrying, settle } from '../../utils/loadResults'

const PAGE_SIZE = 8

const TABS = [
  ['all', 'All'],
  ['active', 'Active'],
  ['frozen', 'Frozen'],
  ['closed', 'Closed'],
]

// Every bank account, with its owner and balance. Staff freeze active accounts
// (with a reason), reactivate frozen ones, and close accounts for good (which closes
// the customer's login too). Closed accounts can't change.
export default function StaffAccounts() {
  const { showToast } = useToast()
  // Customers only give the owners' names, so the list still shows without them.
  const [sections, setSections] = useState({ accounts: LOADING, customers: LOADING })
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [changing, setChanging] = useState(null) // the account being frozen or reactivated
  const [closing, setClosing] = useState(null) // the account being closed

  const load = useCallback(
    () =>
      settle([getAccounts(), getCustomers()]).then(([accounts, customers]) =>
        setSections((current) => ({
          accounts: keepData(current.accounts, accounts),
          customers: keepData(current.customers, customers),
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

  // Any filter change goes back to the first page
  const filterBy = (setter) => (value) => {
    setter(value)
    setPage(0)
  }

  const accounts = sections.accounts.data ?? []
  const customers = sections.customers.data ?? []
  const loading = sections.accounts.status === 'loading'
  const ownerOf = (account) => customers.find((c) => c._id === account.owner)
  const count = (status) => accounts.filter((a) => status === 'all' || a.status === status).length
  const query = search.trim().toLowerCase()
  const digits = query.replace(/\s/g, '')

  const filtered = accounts
    .filter((a) => tab === 'all' || a.status === tab)
    .filter((a) => {
      if (!query) return true
      const owner = ownerOf(a)
      return (
        a.accountNumber.includes(digits) ||
        (owner?.name ?? '').toLowerCase().includes(query) ||
        (owner?.email ?? '').toLowerCase().includes(query)
      )
    })

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const shown = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  if (!loading && !sections.accounts.data) {
    return <ErrorState title="We couldn’t load accounts" message={sections.accounts.error} onRetry={retry} />
  }

  return (
    <>
      <div role="group" aria-label="Show" className="mb-6 flex flex-wrap gap-2">
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

      <Card>
        <div className="pb-5">
          <label htmlFor="account-search" className="sr-only">
            Search accounts
          </label>
          <input
            id="account-search"
            type="search"
            value={search}
            onChange={(e) => filterBy(setSearch)(e.target.value)}
            placeholder="Search account number, owner name or email"
            className="h-12 w-full min-w-0 rounded-xl border-[1.5px] border-field-line bg-field px-4 text-[15px] text-text outline-none transition placeholder:text-placeholder focus:border-wallet focus:ring-4 focus:ring-wallet/20"
          />
        </div>

        {sections.customers.status === 'error' && !sections.customers.data && (
          <ErrorState
            compact
            title="Owner names didn’t load, so rows show “Unknown owner”."
            message={sections.customers.error}
            onRetry={retry}
            className="mb-5 rounded-xl border border-divider p-4"
          />
        )}

        {loading ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="overflow-x-auto">
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
                    <td colSpan={5} className="py-10 text-center text-muted">
                      {accounts.length === 0 ? 'No accounts yet.' : 'No accounts match these filters.'}
                    </td>
                  </tr>
                )}
                {shown.map((a) => {
                  const owner = ownerOf(a)
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
                              <p className="text-[15px] font-semibold text-muted">Unknown owner</p>
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
                        <div className="flex justify-end gap-2">
                          {a.status === 'active' && (
                            <Button variant="secondary" onClick={() => setChanging(a)}>
                              Freeze
                            </Button>
                          )}
                          {a.status === 'frozen' && <Button onClick={() => setChanging(a)}>Reactivate</Button>}
                          {a.status !== 'closed' && (
                            <Button variant="secondary" onClick={() => setClosing(a)}>
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

      {changing && (
        <AccountStatusModal
          account={changing}
          ownerName={ownerOf(changing)?.name}
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
          ownerName={ownerOf(closing)?.name}
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
