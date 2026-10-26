import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Amount from '../../components/ui/Amount'
import Skeleton from '../../components/ui/Skeleton'
import StatusBadge from '../../components/ui/StatusBadge'
import Weave from '../../components/ui/Weave'
import { useToast } from '../../components/ui/Toast'
import AccountStatus from '../../components/customer/AccountStatus'
import CreateStaffModal from '../../components/admin/CreateStaffModal'
import VerifyCustomerModal from '../../components/admin/VerifyCustomerModal'
import ReviewTransactionModal from '../../components/admin/ReviewTransactionModal'
import {
  CheckIcon,
  ChevronDownIcon,
  ClipboardIcon,
  FlagIcon,
  ShieldIcon,
  SnowIcon,
  UserPlusIcon,
} from '../../components/ui/Icons'
import { useAuth } from '../../context/AuthContext'
import { getAccounts, getAllTransactions, getAuditLogs, getUsers } from '../../api/admin'
import { formatTransactionDate } from '../../utils/formatDate'
import { initialsOf, maskedName } from '../../utils/names'
import { lastFour } from '../../utils/formatAccountNumber'

const messageOf = (err) => err.response?.data?.message ?? err.message
const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString()
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const shortDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// How each audit-log action reads in "Recent activity"
const verbs = {
  'user.verify': 'verified',
  'user.status_update': 'changed the status of',
  'user.role_update': 'changed the role of',
  'staff.create': 'created a staff account for',
  'account.status_update': 'changed the status of',
  'transaction.status_update': 'updated',
}
const activityIcons = {
  'user.verify': CheckIcon,
  'staff.create': UserPlusIcon,
  'account.status_update': SnowIcon,
  'transaction.status_update': FlagIcon,
}

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

// A hairline-ringed circle, same as the customer transaction rows.
function RowIcon({ icon: Icon }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink ring-1 ring-divider">
      <Icon size={18} />
    </span>
  )
}

export default function AdminDashboard() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState({ status: 'loading', users: [], accounts: [], transactions: [], logs: [], error: '' })
  const [dialog, setDialog] = useState(null) // { type: 'staff' | 'verify' | 'review', ... }

  const load = useCallback(async () => {
    try {
      const [users, accounts, transactions, logs] = await Promise.all([
        getUsers(),
        getAccounts(),
        getAllTransactions(),
        getAuditLogs(),
      ])
      setData({
        status: 'ready',
        users: users.data,
        accounts: accounts.data,
        transactions: transactions.data,
        logs: logs.data,
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

  if (data.status === 'error' && data.users.length === 0) {
    return (
      <Card role="alert">
        <h1 className="text-xl font-bold text-text">We couldn’t load the admin dashboard</h1>
        <p className="mt-1 mb-4 text-muted">{data.error}</p>
        <Button onClick={retry}>Try again</Button>
      </Card>
    )
  }

  const loading = data.status === 'loading'
  const { users, accounts, transactions, logs } = data
  const userById = Object.fromEntries(users.map((u) => [u._id, u]))
  const accountById = Object.fromEntries(accounts.map((a) => [a._id, a]))
  const accountOf = (userId) => accounts.find((a) => a.owner === userId)
  const ownerName = (accountId) => userById[accountById[accountId]?.owner]?.name ?? 'Unknown'

  const customers = users.filter((u) => u.role === 'customer')
  const staffCount = users.filter((u) => u.role === 'staff').length
  const adminCount = users.filter((u) => u.role === 'admin').length
  const newThisWeek = customers.filter((u) => Date.now() - new Date(u.createdAt) < WEEK_MS).length
  const toVerify = customers.filter((u) => !u.isVerified && u.status === 'active')
  const flagged = transactions.filter((t) => t.status === 'flagged')
  const held = transactions.filter((t) => t.status === 'pending')
  const frozen = accounts.filter((a) => a.status === 'frozen')
  const moneyHeld = accounts.filter((a) => a.status !== 'closed').reduce((sum, a) => sum + a.balance, 0)
  const activeAccounts = accounts.filter((a) => a.status === 'active').length
  const today = transactions.filter((t) => isToday(t.createdAt))

  const attention = [...flagged, ...held].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const recent = [...logs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  const targetLabel = (log) => {
    if (log.targetType === 'User') return userById[log.targetId]?.name ?? 'a user'
    if (log.targetType === 'BankAccount') return `account ••• ${lastFour(accountById[log.targetId]?.accountNumber)}`
    return transactions.find((t) => t._id === log.targetId)?.referenceNumber ?? 'a transaction'
  }
  const actorLabel = (log) => (log.actor === me?._id ? 'You' : (userById[log.actor]?.name ?? 'System'))

  const transferTitle = (t) =>
    t.transactionType === 'cash_in'
      ? `Cash in · ${maskedName(ownerName(t.destinationAccount))}`
      : `${maskedName(ownerName(t.sourceAccount))} → ${maskedName(ownerName(t.destinationAccount))}`

  // After a dialog finishes: close it, say what happened, and reload the numbers.
  const done = (message) => {
    setDialog(null)
    showToast(message)
    load()
  }

  return (
    <>
      <h1 className="sr-only">Admin overview</h1>

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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Deep-green banner, same as the customer balance banner */}
          <section
            aria-label="System summary"
            aria-busy={loading}
            className="relative isolate grid gap-6 overflow-hidden rounded-[20px] bg-ink p-6 text-white md:grid-cols-[1fr_300px]"
          >
            <Weave className="text-white [mask-image:linear-gradient(to_left,black,transparent_80%)]" opacity={0.1} />
            <div className="relative flex flex-col justify-between gap-6">
              <div>
                <p className="text-[15px] text-white/80">Money held in sinop</p>
                {loading ? (
                  <Skeleton className="mt-2 h-12 w-56 bg-white/10" />
                ) : (
                  <p className="mt-2 font-brand text-[38px] leading-none font-bold tracking-[-0.01em] text-white">
                    <Amount centavos={moneyHeld} split />
                  </p>
                )}
                <p className="mt-2 text-sm text-white/70">
                  Across {activeAccounts} active {activeAccounts === 1 ? 'account' : 'accounts'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="accent" size="lg" onClick={() => setDialog({ type: 'staff' })}>
                  <UserPlusIcon size={18} />
                  Create staff
                </Button>
                <Button variant="ghost" size="lg" to="/admin/transactions">
                  <FlagIcon size={18} />
                  Review flagged ({flagged.length})
                </Button>
              </div>
            </div>

            {/* Frosted tile, like the customer account card */}
            <div className="relative flex flex-col gap-3.5 rounded-2xl border border-white/15 bg-linear-to-br from-white/15 to-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="font-brand text-xl font-bold">Today</span>
                <span className="rounded-full border border-accent px-3 py-1 text-xs font-bold tracking-wider text-accent uppercase">
                  Live
                </span>
              </div>
              {[
                ['Cash ins', today.filter((t) => t.transactionType === 'cash_in').length],
                ['Transfers', today.filter((t) => t.transactionType === 'transfer').length],
                ['Held for review', held.length],
                ['New sign-ups', customers.filter((u) => isToday(u.createdAt)).length],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{label}</span>
                  <span className="font-brand text-[15px] font-semibold tabular-nums">{loading ? '–' : value}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Customers" value={customers.length} hint={`+${newThisWeek} this week`} loading={loading} />
            <StatCard
              label="Staff"
              value={staffCount}
              hint={`${adminCount} ${adminCount === 1 ? 'admin' : 'admins'}`}
              loading={loading}
            />
            <StatCard label="To verify" value={toVerify.length} hint="Waiting for ID check" loading={loading} />
            <StatCard label="Flagged" value={flagged.length} hint="For staff to review" loading={loading} />
          </div>

          <Card>
            <CardHeader title="Needs attention" link="All transactions" to="/admin/transactions" />
            {loading ? (
              <Skeleton className="h-40" />
            ) : attention.length === 0 && frozen.length === 0 ? (
              <p className="border-t border-divider pt-4 text-muted">Nothing needs attention. Ayos!</p>
            ) : (
              <ul>
                {attention.map((t) => (
                  <li key={t._id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-divider py-3.5">
                    <RowIcon icon={t.status === 'flagged' ? FlagIcon : ShieldIcon} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-text">{transferTitle(t)}</p>
                      <p className="truncate text-sm text-muted">
                        {formatTransactionDate(t.createdAt)}
                        {t.flagReason && ` · ${t.flagReason}`}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                    <Amount centavos={t.amount} className="font-brand text-[15px] font-semibold text-text" />
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setDialog({
                          type: 'review',
                          tx: t,
                          fromName: ownerName(t.sourceAccount),
                          toName: ownerName(t.destinationAccount),
                        })
                      }
                    >
                      Review
                    </Button>
                  </li>
                ))}
                {frozen.map((a) => (
                  <li key={a._id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-divider py-3.5">
                    <RowIcon icon={SnowIcon} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-text">Account ••• {lastFour(a.accountNumber)}</p>
                      <p className="truncate text-sm text-muted">Owner: {ownerName(a._id)}</p>
                    </div>
                    <AccountStatus status={a.status} />
                    <Amount centavos={a.balance} className="font-brand text-[15px] font-semibold text-text" />
                    <Button variant="secondary" to="/admin/accounts">
                      Open
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="To verify" link="All" to="/admin/users" />
            {loading ? (
              <Skeleton className="h-32" />
            ) : toVerify.length === 0 ? (
              <p className="border-t border-divider pt-4 text-muted">Everyone is verified.</p>
            ) : (
              <ul>
                {toVerify.map((u) => (
                  <li key={u._id} className="flex items-center gap-3 border-t border-divider py-3">
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-ink"
                    >
                      {initialsOf(u.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-text">{u.name}</p>
                      <p className="truncate text-sm text-muted">Joined {shortDate(u.createdAt)}</p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setDialog({ type: 'verify', customer: u, account: accountOf(u._id) })}
                    >
                      Verify
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Recent activity" link="Audit log" to="/admin/audit-log" />
            {loading ? (
              <Skeleton className="h-32" />
            ) : recent.length === 0 ? (
              <p className="border-t border-divider pt-4 text-muted">No activity yet.</p>
            ) : (
              <ul>
                {recent.map((log) => {
                  const Icon = activityIcons[log.action] ?? ClipboardIcon
                  return (
                    <li key={log._id} className="flex gap-3 border-t border-divider py-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text">
                          {actorLabel(log)} {verbs[log.action] ?? log.action} {targetLabel(log)}
                        </p>
                        <p className="text-[13px] text-muted">{formatTransactionDate(log.createdAt)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {dialog?.type === 'staff' && (
        <CreateStaffModal
          onClose={() => setDialog(null)}
          onCreated={(staff) => done(`Staff account created for ${staff.name}.`)}
        />
      )}
      {dialog?.type === 'verify' && (
        <VerifyCustomerModal
          customer={dialog.customer}
          account={dialog.account}
          onClose={() => setDialog(null)}
          onVerified={(c) => done(`${c.name} is now verified.`)}
        />
      )}
      {dialog?.type === 'review' && (
        <ReviewTransactionModal
          tx={dialog.tx}
          fromName={dialog.fromName}
          toName={dialog.toName}
          onClose={() => setDialog(null)}
          onCancelled={(t) => done(`Transaction ${t.referenceNumber} cancelled.`)}
        />
      )}
    </>
  )
}
