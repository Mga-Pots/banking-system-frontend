import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Amount from '../../components/ui/Amount'
import Sensitive from '../../components/ui/Sensitive'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { ChevronLeftIcon, LockIcon, ShieldIcon, SnowIcon } from '../../components/ui/Icons'
import AccountStatus from '../../components/customer/AccountStatus'
import DetailsList from '../../components/ui/DetailsList'
import { IdCheck, UserStatus } from '../../components/admin/UserBadges'
import VerifyCustomerModal from '../../components/staff/VerifyCustomerModal'
import AccountStatusModal from '../../components/staff/AccountStatusModal'
import CloseAccountModal from '../../components/staff/CloseAccountModal'
import { getCustomer } from '../../api/staff'
import { formatLongDate } from '../../utils/formatDate'
import { formatAccountNumber, maskAccountNumber } from '../../utils/formatAccountNumber'
import { initialsOf } from '../../utils/names'

const messageOf = (err) => err.response?.data?.message ?? err.message

function BackLink() {
  return (
    <Link
      to="/staff/customers"
      className="mb-4 inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-label hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
    >
      <ChevronLeftIcon size={16} />
      All customers
    </Link>
  )
}

// One customer and their bank account, with the balance. Staff can verify the
// customer and freeze or reactivate the account from here.
export default function StaffCustomerDetail() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [data, setData] = useState({ status: 'loading', customer: null, error: '' })
  const [dialog, setDialog] = useState(null) // 'verify' | 'account' | 'close'

  const load = useCallback(async () => {
    try {
      const res = await getCustomer(id)
      setData({ status: 'ready', customer: res.data, error: '' })
    } catch (err) {
      setData((current) => ({ ...current, status: 'error', error: messageOf(err) }))
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const done = (message) => {
    setDialog(null)
    showToast(message)
    load()
  }

  const { customer } = data

  if (data.status === 'loading') {
    return (
      <>
        <BackLink />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </>
    )
  }

  if (!customer) {
    return (
      <>
        <BackLink />
        <Card role="alert">
          <h2 className="text-xl font-bold text-text">We couldn’t load this customer</h2>
          <p className="mt-1 mb-4 text-muted">{data.error}</p>
          <Button onClick={load}>Try again</Button>
        </Card>
      </>
    )
  }

  const { account } = customer
  const canVerify = !customer.isVerified && customer.status === 'active'

  return (
    <>
      <BackLink />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-mint text-lg font-bold text-ink"
            >
              {initialsOf(customer.name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-text">{customer.name}</h2>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <UserStatus status={customer.status} />
                {/* IdCheck only shows a badge for customers; staff responses leave out the role */}
                <IdCheck user={{ ...customer, role: 'customer' }} />
              </div>
            </div>
          </div>
          <DetailsList
            rows={[
              ['Email', customer.email],
              ['Mobile', customer.contactNumber || 'Not given'],
              ['Joined', formatLongDate(customer.createdAt)],
            ]}
          />
          {canVerify && (
            <div className="flex flex-col gap-3 rounded-xl bg-status-pending px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-status-pending-text">
                Not verified yet. Check a valid government ID before verifying.
              </p>
              <Button onClick={() => setDialog('verify')} className="shrink-0">
                <ShieldIcon size={18} />
                Verify
              </Button>
            </div>
          )}
          {!customer.isVerified && customer.status !== 'active' && (
            <p className="text-sm text-muted">This customer can’t be verified while their user account isn’t active.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-text">Bank account</h2>
            {account && <AccountStatus status={account.status} />}
          </div>

          {account ? (
            <>
              <div>
                <p className="text-sm text-muted">Balance</p>
                <p className="font-brand text-[32px] leading-tight font-bold text-text">
                  <Amount centavos={account.balance} sensitive split />
                </p>
              </div>
              <DetailsList
                rows={[
                  [
                    'Account number',
                    <span key="number" className="tabular-nums">
                      <Sensitive mask={maskAccountNumber(account.accountNumber)}>
                        {formatAccountNumber(account.accountNumber)}
                      </Sensitive>
                    </span>,
                  ],
                ]}
              />
              {account.status === 'closed' ? (
                <p className="text-sm text-muted">This account and the customer’s login are closed permanently.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={account.status === 'active' ? 'secondary' : 'primary'}
                    onClick={() => setDialog('account')}
                  >
                    <SnowIcon size={18} />
                    {account.status === 'active' ? 'Freeze account' : 'Reactivate account'}
                  </Button>
                  <Button variant="secondary" onClick={() => setDialog('close')}>
                    <LockIcon size={18} />
                    Close account
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted">This customer has no bank account.</p>
          )}
        </Card>
      </div>

      {dialog === 'verify' && (
        <VerifyCustomerModal
          customer={customer}
          onClose={() => setDialog(null)}
          onVerified={(c) => done(`${c.name} is now verified.`)}
        />
      )}
      {dialog === 'account' && account && (
        <AccountStatusModal
          account={account}
          ownerName={customer.name}
          onClose={() => setDialog(null)}
          onSaved={(a) => done(a.status === 'frozen' ? 'The account is frozen.' : 'The account is active again.')}
        />
      )}
      {dialog === 'close' && account && (
        <CloseAccountModal
          account={account}
          ownerName={customer.name}
          onClose={() => setDialog(null)}
          onClosed={() => done(`${customer.name}’s account is closed.`)}
        />
      )}
    </>
  )
}
