import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Amount from '../../components/ui/Amount'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import StatusBadge from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { ChevronDownIcon, FlagIcon, ShieldIcon, SnowIcon } from '../../components/ui/Icons'
import VerifyCustomerModal from '../../components/staff/VerifyCustomerModal'
import ReviewTransactionModal from '../../components/staff/ReviewTransactionModal'
import AccountStatusModal from '../../components/staff/AccountStatusModal'
import { reviewedMessage } from '../../components/staff/reviewMessages'
import { usePrivacy } from '../../context/PrivacyContext'
import { getAccounts, getCustomers, getTransactions, reviewActionsFor } from '../../api/staff'
import { accountIdOf, accountNumberOf } from '../../utils/transactions'
import { formatAccountNumber, maskAccountNumber } from '../../utils/formatAccountNumber'
import { formatTransactionDate } from '../../utils/formatDate'
import { initialsOf } from '../../utils/names'
import { LOADING, keepData, retrying, settle } from '../../utils/loadResults'

const shortDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// One figure in the summary card: a label, the count and a short hint. On phones the
// count sits to the right of the label; from `sm` the three figures stand side by side.
// `section` is the load state of the data it counts.
function SummaryItem({ label, value, hint, section }) {
  const failed = !section.data && section.status === 'error'
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-1 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
      <dt className="col-start-1 row-start-1 text-xs font-bold tracking-wider text-muted uppercase">{label}</dt>
      <dd className="col-start-2 row-span-2 row-start-1 sm:col-start-1 sm:row-span-1 sm:row-start-2">
        {section.status === 'loading' ? (
          <Skeleton className="h-7 w-10" />
        ) : (
          <span className="font-brand text-xl font-semibold text-ink tabular-nums">{failed ? '–' : value}</span>
        )}
      </dd>
      <dd className="col-start-1 row-start-2 text-sm text-muted sm:row-start-3">{failed ? 'Couldn’t load' : hint}</dd>
    </div>
  )
}

// Shown in place of a card's list when the data it needs didn't load.
function SectionError({ title, section, onRetry }) {
  return <ErrorState compact title={title} message={section.error} onRetry={onRetry} className="border-t border-divider pt-4" />
}

// "See all" like the customer overview, so the 320px column's titles don't wrap.
// `label` names the destination for screen readers, since every link reads "See all".
function CardHeader({ title, label, to }) {
  return (
    <div className="flex items-center justify-between gap-4 pb-2">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      {to && (
        <Link
          to={to}
          aria-label={label}
          className="-my-3 inline-flex shrink-0 items-center gap-1 py-3 text-sm font-bold text-wallet hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
        >
          See all
          <ChevronDownIcon size={16} className="-rotate-90" />
        </Link>
      )}
    </div>
  )
}

function RowIcon({ icon: Icon }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink ring-1 ring-divider">
      <Icon size={18} />
    </span>
  )
}

// What needs a staff member today: transfers to review, customers to verify, and
// frozen accounts. Every list links to its full page. The three lists load
// separately, so one failing call only shows an error in the cards that need it.
export default function StaffDashboard() {
  const { showToast } = useToast()
  const { hidden } = usePrivacy()
  const [sections, setSections] = useState({ customers: LOADING, accounts: LOADING, transactions: LOADING })
  const [dialog, setDialog] = useState(null) // { type: 'verify' | 'review' | 'account', item }

  const load = useCallback(
    () =>
      settle([getCustomers(), getAccounts(), getTransactions()]).then(([customers, accounts, transactions]) =>
        setSections((current) => ({
          customers: keepData(current.customers, customers),
          accounts: keepData(current.accounts, accounts),
          transactions: keepData(current.transactions, transactions),
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

  // After a dialog finishes: close it, say what happened, and reload the numbers.
  const done = (message) => {
    setDialog(null)
    showToast(message)
    load()
  }

  const all = Object.values(sections)
  // Nothing loaded at all: one page-sized error instead of three small ones.
  if (all.every((s) => s.status === 'error' && !s.data)) {
    return <ErrorState title="We couldn’t load the overview" message={sections.customers.error} onRetry={retry} />
  }
  // A refresh failed but the last data is still on screen.
  const staleError = all.find((s) => s.status === 'error' && s.data)?.error

  const customers = sections.customers.data ?? []
  const accounts = sections.accounts.data ?? []
  const transactions = sections.transactions.data ?? []

  const ownerOf = (accountId) => accounts.find((a) => a._id === accountId)?.owner
  const partyOf = (account) => {
    const name = ownerOf(accountIdOf(account))?.name
    const number = accountNumberOf(account)
    const shown = number && (hidden ? maskAccountNumber(number) : formatAccountNumber(number))
    return [name, shown].filter(Boolean).join(' · ') || 'Unknown'
  }

  const toReview = transactions.filter((t) => reviewActionsFor(t).length > 0)
  const pending = toReview.filter((t) => t.status === 'pending')
  const flagged = toReview.filter((t) => t.status === 'flagged')
  const toVerify = customers.filter((c) => !c.isVerified && c.status === 'active')
  const frozen = accounts.filter((a) => a.status === 'frozen')

  return (
    <>
      <h1 className="sr-only">Staff overview</h1>

      {staleError && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-status-failed px-5 py-4 text-sm font-semibold text-status-failed-text"
        >
          <span>Couldn’t refresh: {staleError}</span>
          <button type="button" onClick={retry} className="-my-3 cursor-pointer py-3 underline">
            Try again
          </button>
        </div>
      )}

      {/* One card, not a row of tiles: the counts are a summary of the lists below.
          Needs review covers held and flagged transfers, as on the Transactions page. */}
      <Card className="mb-6">
        {/* From lg the last column is 295px: its divider then sits on the edge of the
            320px column below, and its text lines up with that card's text. */}
        <dl className="divide-y divide-divider sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-[1fr_1fr_295px]">
          <SummaryItem
            label="Needs review"
            value={toReview.length}
            hint={`${pending.length} held · ${flagged.length} flagged`}
            section={sections.transactions}
          />
          <SummaryItem label="To verify" value={toVerify.length} hint="Unverified customers" section={sections.customers} />
          <SummaryItem label="Frozen" value={frozen.length} hint="Can’t cash in or transfer" section={sections.accounts} />
        </dl>
      </Card>

      {/* Same columns as the customer and admin overviews */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="min-w-0">
          <CardHeader title="Transfers to review" label="See all transfers to review" to="/staff/transactions" />
          {sections.transactions.status === 'loading' ? (
            <Skeleton className="h-40" />
          ) : !sections.transactions.data ? (
            <SectionError title="We couldn’t load transfers" section={sections.transactions} onRetry={retry} />
          ) : toReview.length === 0 ? (
            <p className="border-t border-divider pt-4 text-[15px] text-muted">
              Nothing to review right now. <span lang="fil">Ayos!</span>
            </p>
          ) : (
            <ul>
              {toReview.map((t) => (
                <li key={t._id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-divider py-4">
                  <RowIcon icon={t.status === 'flagged' ? FlagIcon : ShieldIcon} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-text">
                      {ownerOf(accountIdOf(t.sourceAccount))?.name ?? 'Unknown'} →{' '}
                      {ownerOf(accountIdOf(t.destinationAccount))?.name ?? 'Unknown'}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {formatTransactionDate(t.createdAt)}
                      {t.flagReason && ` · ${t.flagReason}`}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                  <Amount centavos={t.amount} sensitive className="font-brand text-[15px] font-semibold text-text" />
                  <Button onClick={() => setDialog({ type: 'review', item: t })}>Review</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="To verify" label="See all customers" to="/staff/customers" />
            {sections.customers.status === 'loading' ? (
              <Skeleton className="h-32" />
            ) : !sections.customers.data ? (
              <SectionError title="We couldn’t load customers" section={sections.customers} onRetry={retry} />
            ) : toVerify.length === 0 ? (
              <p className="border-t border-divider pt-4 text-[15px] text-muted">Everyone is verified.</p>
            ) : (
              <ul>
                {toVerify.map((c) => (
                  <li key={c._id} className="flex items-center gap-4 border-t border-divider py-4">
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-ink"
                    >
                      {initialsOf(c.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/staff/customers/${c._id}`}
                        className="block truncate text-[15px] font-semibold text-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
                      >
                        {c.name}
                      </Link>
                      <p className="truncate text-sm text-muted">Joined {shortDate(c.createdAt)}</p>
                    </div>
                    <Button variant="secondary" onClick={() => setDialog({ type: 'verify', item: c })}>
                      Verify
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Frozen accounts" label="See all accounts" to="/staff/accounts" />
            {sections.accounts.status === 'loading' ? (
              <Skeleton className="h-24" />
            ) : !sections.accounts.data ? (
              <SectionError title="We couldn’t load accounts" section={sections.accounts} onRetry={retry} />
            ) : frozen.length === 0 ? (
              <p className="border-t border-divider pt-4 text-[15px] text-muted">No frozen accounts.</p>
            ) : (
              <ul>
                {frozen.map((a) => (
                  <li key={a._id} className="flex items-center gap-4 border-t border-divider py-4">
                    <RowIcon icon={SnowIcon} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-text">{ownerOf(a._id)?.name ?? 'Unknown owner'}</p>
                      <p className="truncate text-sm text-muted tabular-nums">{maskAccountNumber(a.accountNumber)}</p>
                    </div>
                    <Button variant="secondary" onClick={() => setDialog({ type: 'account', item: a })}>
                      Reactivate
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {dialog?.type === 'verify' && (
        <VerifyCustomerModal
          customer={dialog.item}
          onClose={() => setDialog(null)}
          onVerified={(c) => done(`${c.name} is now verified.`)}
        />
      )}
      {dialog?.type === 'review' && (
        <ReviewTransactionModal
          tx={dialog.item}
          from={partyOf(dialog.item.sourceAccount)}
          to={partyOf(dialog.item.destinationAccount)}
          onClose={() => setDialog(null)}
          onReviewed={(tx) => done(reviewedMessage(tx))}
        />
      )}
      {dialog?.type === 'account' && (
        <AccountStatusModal
          account={dialog.item}
          ownerName={ownerOf(dialog.item._id)?.name}
          onClose={() => setDialog(null)}
          onSaved={() => done('The account is active again.')}
        />
      )}
    </>
  )
}
