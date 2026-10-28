import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Amount from '../../components/ui/Amount'
import Skeleton from '../../components/ui/Skeleton'
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

const messageOf = (err) => err.response?.data?.message ?? err.message
const shortDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// The overview's building blocks, same look as the admin overview.
function StatCard({ label, value, hint, loading }) {
  return (
    <Card className="flex flex-col gap-2">
      <p className="text-xs font-bold tracking-wider text-muted uppercase">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="font-brand text-[28px] leading-tight font-semibold text-ink tabular-nums">{value}</p>
      )}
      <p className="text-sm text-muted">{hint}</p>
    </Card>
  )
}

function CardHeader({ title, link, to }) {
  return (
    <div className="flex items-center justify-between gap-4 pb-2">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      {to && (
        <Link
          to={to}
          className="-my-3 inline-flex items-center gap-1 py-3 text-sm font-bold text-wallet hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
        >
          {link}
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
// frozen accounts. Every list links to its full page.
export default function StaffDashboard() {
  const { showToast } = useToast()
  const { hidden } = usePrivacy()
  const [data, setData] = useState({ status: 'loading', customers: [], accounts: [], transactions: [], error: '' })
  const [dialog, setDialog] = useState(null) // { type: 'verify' | 'review' | 'account', item }

  const load = useCallback(async () => {
    try {
      const [customers, accounts, transactions] = await Promise.all([getCustomers(), getAccounts(), getTransactions()])
      setData({
        status: 'ready',
        customers: customers.data,
        accounts: accounts.data,
        transactions: transactions.data,
        error: '',
      })
    } catch (err) {
      setData((current) => ({ ...current, status: 'error', error: messageOf(err) }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const retry = () => {
    setData((current) => ({ ...current, status: 'loading', error: '' }))
    load()
  }

  // After a dialog finishes: close it, say what happened, and reload the numbers.
  const done = (message) => {
    setDialog(null)
    showToast(message)
    load()
  }

  if (data.status === 'error' && data.customers.length === 0) {
    return (
      <Card role="alert">
        <h2 className="text-xl font-bold text-text">We couldn’t load the overview</h2>
        <p className="mt-1 mb-4 text-muted">{data.error}</p>
        <Button onClick={retry}>Try again</Button>
      </Card>
    )
  }

  const loading = data.status === 'loading'
  const { customers, accounts, transactions } = data

  const ownerOf = (accountId) => customers.find((c) => c._id === accounts.find((a) => a._id === accountId)?.owner)
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

      {data.status === 'error' && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-status-failed px-5 py-4 text-sm font-semibold text-status-failed-text"
        >
          <span>Couldn’t refresh: {data.error}</span>
          <button type="button" onClick={retry} className="-my-3 cursor-pointer py-3 underline">
            Try again
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Held transfers" value={pending.length} hint="Waiting for approval" loading={loading} />
        <StatCard label="Flagged" value={flagged.length} hint="Under review" loading={loading} />
        <StatCard label="To verify" value={toVerify.length} hint="Waiting for ID check" loading={loading} />
        <StatCard label="Frozen accounts" value={frozen.length} hint="Can’t cash in or transfer" loading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="min-w-0">
          <CardHeader title="Transfers to review" link="All transactions" to="/staff/transactions" />
          {loading ? (
            <Skeleton className="h-40" />
          ) : toReview.length === 0 ? (
            <p className="border-t border-divider pt-4 text-muted">
              Nothing to review right now. <span lang="fil">Ayos!</span>
            </p>
          ) : (
            <ul>
              {toReview.map((t) => (
                <li key={t._id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-divider py-3.5">
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
            <CardHeader title="To verify" link="All customers" to="/staff/customers" />
            {loading ? (
              <Skeleton className="h-32" />
            ) : toVerify.length === 0 ? (
              <p className="border-t border-divider pt-4 text-muted">Everyone is verified.</p>
            ) : (
              <ul>
                {toVerify.map((c) => (
                  <li key={c._id} className="flex items-center gap-3 border-t border-divider py-3">
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
            <CardHeader title="Frozen accounts" link="All accounts" to="/staff/accounts" />
            {loading ? (
              <Skeleton className="h-24" />
            ) : frozen.length === 0 ? (
              <p className="border-t border-divider pt-4 text-muted">No frozen accounts.</p>
            ) : (
              <ul>
                {frozen.map((a) => (
                  <li key={a._id} className="flex items-center gap-3 border-t border-divider py-3">
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
