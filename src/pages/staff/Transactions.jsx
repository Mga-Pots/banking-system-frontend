import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Amount from '../../components/ui/Amount'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import StatusBadge from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { usePrivacy } from '../../context/PrivacyContext'
import { FilterSelect, SearchInput } from '../../components/admin/AdminBits'
import ReviewTransactionModal from '../../components/staff/ReviewTransactionModal'
import { reviewedMessage } from '../../components/staff/reviewMessages'
import { getAccounts, getTransactions, reviewActionsFor } from '../../api/staff'
import { accountIdOf, accountNumberOf } from '../../utils/transactions'
import { formatAccountNumber, maskAccountNumber } from '../../utils/formatAccountNumber'
import { formatTransactionDate } from '../../utils/formatDate'
import { LOADING, keepData, retrying, settle } from '../../utils/loadResults'

const PAGE_SIZE = 10

// "Needs review" is what staff open the page for: transfers still pending or flagged.
const needsReview = (tx) => reviewActionsFor(tx).length > 0

// The filter bar matches the admin pages: one row of search and dropdowns, each
// dropdown's name in its "All" option. Type words match the table's Type column.
const TYPE_OPTIONS = [
  ['any', 'Type: All'],
  ['transfer', 'Transfer'],
  ['cash_in', 'Cash in'],
]

const STATUS_OPTIONS = [
  ['all', 'Status: All'],
  ['review', 'Needs review'],
  ['completed', 'Completed'],
  ['pending', 'Pending'],
  ['flagged', 'Flagged'],
  ['failed', 'Failed'],
  ['cancelled', 'Cancelled'],
]

const inStatus = (tx, s) => (s === 'review' ? needsReview(tx) : s === 'all' || tx.status === s)

// Every transaction, newest first. Staff approve, flag or cancel held transfers here.
export default function StaffTransactions() {
  const { showToast } = useToast()
  const { hidden } = usePrivacy()
  // Accounts only give the owners' names, so the list still shows without them.
  const [sections, setSections] = useState({ transactions: LOADING, accounts: LOADING })
  const [type, setType] = useState('any')
  const [status, setStatus] = useState('review')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [reviewing, setReviewing] = useState(null) // the transaction open in the dialog

  const load = useCallback(
    () =>
      settle([getTransactions(), getAccounts()]).then(([transactions, accounts]) =>
        setSections((current) => ({
          transactions: keepData(current.transactions, transactions),
          accounts: keepData(current.accounts, accounts),
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

  // Cash ins never need review, so that pair would always be empty: picking
  // Needs review while Cash in is on shows every type instead.
  const pickStatus = (value) => {
    if (value === 'review' && type === 'cash_in') setType('any')
    filterBy(setStatus)(value)
  }

  const isDefault = status === 'review' && type === 'any' && !search
  const clearFilters = () => {
    setType('any')
    setStatus('review')
    setSearch('')
    setPage(0)
  }

  const transactions = sections.transactions.data ?? []
  const accounts = sections.accounts.data ?? []
  const loading = sections.transactions.status === 'loading'

  // The owner's name for a transaction's account, found through the accounts list.
  const nameFor = (account) => {
    return accounts.find((a) => a._id === accountIdOf(account))?.owner?.name ?? null
  }
  const numberFor = (account) => {
    const number = accountNumberOf(account)
    if (!number) return null
    return hidden ? maskAccountNumber(number) : formatAccountNumber(number)
  }
  // "Juan Dela Cruz · 0012 3456 7890"
  const partyOf = (account) => [nameFor(account), numberFor(account)].filter(Boolean).join(' · ') || 'Unknown'

  const query = search.trim().toLowerCase()
  const digits = query.replace(/\s/g, '')

  const filtered = transactions
    .filter((tx) => inStatus(tx, status))
    .filter((tx) => type === 'any' || tx.transactionType === type)
    .filter((tx) => {
      if (!query) return true
      const sides = [tx.sourceAccount, tx.destinationAccount]
      return (
        tx.referenceNumber.toLowerCase().includes(query) ||
        sides.some((side) => (digits && (accountNumberOf(side) ?? '').includes(digits)) || (nameFor(side) ?? '').toLowerCase().includes(query))
      )
    })

  // "3 transactions · Transfer · Needs review · “juan”", like the customer History summary.
  // Needs review says what it means here, since the dropdown can't.
  const labelOf = (options, value) => options.find(([v]) => v === value)?.[1]
  const activeFilters = [
    type !== 'any' && labelOf(TYPE_OPTIONS, type),
    status === 'review' ? 'Needs review (waiting for approval or flagged)' : status !== 'all' && labelOf(STATUS_OPTIONS, status),
    query && `“${search.trim()}”`,
  ].filter(Boolean)

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const shown = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  if (!loading && !sections.transactions.data) {
    return <ErrorState title="We couldn’t load transactions" message={sections.transactions.error} onRetry={retry} />
  }

  return (
    <>
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchInput
            id="transaction-search"
            label="Search transactions"
            value={search}
            onChange={filterBy(setSearch)}
            placeholder="Search reference, account number or name"
          />
          <FilterSelect id="type-filter" label="Type" value={type} onChange={filterBy(setType)}>
            {TYPE_OPTIONS.map(([value, label]) => (
              // Cash ins never need review, so that pair could only ever be empty.
              <option key={value} value={value} disabled={value === 'cash_in' && status === 'review'}>
                {value === 'cash_in' && status === 'review' ? 'Cash in (never needs review)' : label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect id="status-filter" label="Status" value={status} onChange={pickStatus}>
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
                {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
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

        {sections.accounts.status === 'error' && !sections.accounts.data && (
          <ErrorState
            compact
            title="Customer names didn’t load, so rows show account numbers only."
            message={sections.accounts.error}
            onRetry={retry}
            className="mt-4 rounded-xl border border-divider p-4"
          />
        )}

        {loading ? (
          <Skeleton className="mt-4 h-72" />
        ) : (
          // `relative` keeps the header's screen-reader-only label inside this scroll box;
          // without it the label sits past the table's right edge and the whole page scrolls sideways.
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-t border-divider text-xs font-bold tracking-wider text-muted uppercase">
                  <th scope="col" className="w-[150px] py-3 pr-4 font-bold">Date</th>
                  <th scope="col" className="w-[90px] py-3 pr-4 font-bold">Type</th>
                  <th scope="col" className="py-3 pr-4 font-bold">From → To</th>
                  <th scope="col" className="w-[140px] py-3 pr-4 text-right font-bold">Amount</th>
                  <th scope="col" className="w-[120px] py-3 pr-4 font-bold">Status</th>
                  <th scope="col" className="w-[100px] py-3 font-bold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr className="border-t border-divider">
                    <td colSpan={6} className="py-12">
                      <div className="flex flex-col items-center gap-3 text-center">
                        {isDefault ? (
                          <>
                            <p className="text-[15px] font-semibold text-text">
                              Nothing needs review right now. <span lang="fil">Ayos!</span>
                            </p>
                            <Button variant="secondary" onClick={() => pickStatus('all')}>
                              Show all transactions
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-[15px] font-semibold text-text">No transactions match your filters</p>
                            <p className="max-w-xs text-sm text-muted">
                              Try a different search, or clear the filters to see what needs review.
                            </p>
                            <Button variant="secondary" onClick={clearFilters}>
                              Clear filters
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {shown.map((tx) => {
                  const isTransfer = tx.transactionType === 'transfer'
                  return (
                    <tr key={tx._id} className="border-t border-divider">
                      <td className="py-3.5 pr-4">
                        <p className="text-sm text-text">{formatTransactionDate(tx.createdAt)}</p>
                        <p className="text-xs text-muted tabular-nums">{tx.referenceNumber}</p>
                      </td>
                      <td className="py-3.5 pr-4 text-sm font-semibold text-label">{isTransfer ? 'Transfer' : 'Cash in'}</td>
                      <td className="py-3.5 pr-4 text-sm">
                        {isTransfer ? (
                          <>
                            <p className="truncate text-text">{partyOf(tx.sourceAccount)}</p>
                            <p className="truncate text-muted">→ {partyOf(tx.destinationAccount)}</p>
                          </>
                        ) : (
                          <p className="truncate text-text">→ {partyOf(tx.destinationAccount)}</p>
                        )}
                        {tx.flagReason && <p className="mt-0.5 truncate text-xs text-muted">{tx.flagReason}</p>}
                      </td>
                      <td className="py-3.5 pr-4 text-right text-[15px] font-semibold text-text">
                        <Amount centavos={tx.amount} sensitive />
                      </td>
                      <td className="py-3.5 pr-4">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="py-3.5">
                        <div className="flex justify-end">
                          <Button variant={needsReview(tx) ? 'primary' : 'secondary'} onClick={() => setReviewing(tx)}>
                            {needsReview(tx) ? 'Review' : 'View'}
                          </Button>
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

      {reviewing && (
        <ReviewTransactionModal
          tx={reviewing}
          from={partyOf(reviewing.sourceAccount)}
          to={partyOf(reviewing.destinationAccount)}
          onClose={() => setReviewing(null)}
          onReviewed={(tx) => {
            setReviewing(null)
            showToast(reviewedMessage(tx))
            load()
          }}
        />
      )}
    </>
  )
}
