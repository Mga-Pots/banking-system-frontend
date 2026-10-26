import { useEffect, useRef, useState } from 'react'
import Amount from '../../components/ui/Amount'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import { LockIcon } from '../../components/ui/Icons'
import { useToast } from '../../components/ui/Toast'
import AmountPresets from '../../components/customer/AmountPresets'
import RecentRecipients from '../../components/customer/RecentRecipients'
import TransferReviewModal from '../../components/customer/TransferReviewModal'
import TransferSuccess from '../../components/customer/TransferSuccess'
import { getMyAccount, getRecentRecipients, lookupAccount } from '../../api/accounts'
import { formatAccountNumber } from '../../utils/formatAccountNumber'
import { pesosToCentavos, sanitizeAmountInput } from '../../utils/parseAmount'
import { APPROVAL_THRESHOLD_TEXT, needsApproval } from '../../utils/transferRules'

const PRESETS = [50000, 100000, 500000, 1000000] // ₱500, ₱1,000, ₱5,000, ₱10,000
const LOOKUP_DELAY_MS = 300
const OWN_ACCOUNT_MESSAGE = 'You cannot transfer to your own account'

const messageOf = (err) => err.response?.data?.message ?? err.message

// Turns what was typed into centavos plus the reason it can't be used yet, if any.
const readAmount = (text, available) => {
  if (text === '') return { centavos: null, problem: 'Enter an amount greater than ₱0.00.' }
  const centavos = pesosToCentavos(text.replace(/\.$/, ''))
  if (centavos === null) return { centavos: null, problem: 'Enter a valid amount, like 1,000 or 250.50.' }
  if (centavos <= 0) return { centavos: null, problem: 'Enter an amount greater than ₱0.00.' }
  if (centavos > available) return { centavos: null, problem: 'Your balance is insufficient.' }
  return { centavos, problem: '' }
}

// Loads the account and recent recipients and returns the page's load state; it never throws.
// Recent recipients are a nice-to-have: the page works without them.
const fetchPage = () =>
  Promise.all([getMyAccount(), getRecentRecipients().catch(() => ({ data: [] }))]).then(
    ([account, recipients]) => ({ status: 'ready', account: account.data, recipients: recipients.data, error: '' }),
    (err) => ({ status: 'error', account: null, recipients: [], error: messageOf(err) }),
  )

const blockedMessage = {
  frozen: 'Your account is frozen. Transfers are paused until staff reactivate it. Please contact sinop staff for help.',
  closed: 'This account is closed, so transfers can’t be sent.',
}

export default function Transfer() {
  const { showToast } = useToast()
  const [load, setLoad] = useState({ status: 'loading', account: null, recipients: [], error: '' })
  const [accountNumber, setAccountNumber] = useState('')
  const [amountText, setAmountText] = useState('')
  const [errors, setErrors] = useState({})
  const [lookup, setLookup] = useState({ digits: '', status: 'idle', recipient: null, error: '' })
  const [review, setReview] = useState(null) // { recipientAccountNumber, amount }
  const [result, setResult] = useState(null) // { transaction, recipientName, accountNumber, balance }
  const accountRef = useRef(null)
  const amountRef = useRef(null)
  const successRef = useRef(null)

  useEffect(() => {
    let active = true
    fetchPage().then((next) => active && setLoad(next))
    return () => {
      active = false
    }
  }, [])

  const { account, recipients } = load
  const loading = load.status === 'loading'
  const digits = accountNumber.replace(/\D/g, '')
  const ownNumber = Boolean(account) && digits === account.accountNumber

  // Look the recipient up once all 12 digits are in, after a short pause so a paste or a
  // quick correction doesn't fire several calls. A late answer for an old number is ignored.
  useEffect(() => {
    if (digits.length !== 12 || ownNumber) return
    let active = true
    const timer = setTimeout(() => {
      lookupAccount(digits).then(
        (res) => active && setLookup({ digits, status: 'ready', recipient: res.data, error: '' }),
        (err) => active && setLookup({ digits, status: 'error', recipient: null, error: messageOf(err) }),
      )
    }, LOOKUP_DELAY_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [digits, ownNumber])

  // After a successful transfer, move focus to the result.
  useEffect(() => {
    if (result) successRef.current?.focus()
  }, [result])

  const checking = digits.length === 12 && !ownNumber && lookup.digits !== digits
  const found = digits.length === 12 && lookup.digits === digits ? lookup : null
  const liveAccountError = ownNumber ? OWN_ACCOUNT_MESSAGE : found?.status === 'error' ? found.error : undefined
  const recipient = found?.status === 'ready' ? found.recipient : null

  const blocked = Boolean(account) && account.status !== 'active'
  const noFunds = Boolean(account) && !blocked && account.balance <= 0
  const { centavos, problem } = readAmount(amountText, account?.balance ?? 0)
  const approval = centavos !== null && needsApproval(centavos)

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (digits.length !== 12) next.accountNumber = 'Enter the 12-digit account number.'
    else if (liveAccountError) next.accountNumber = liveAccountError
    if (problem) next.amount = problem
    setErrors(next)

    if (next.accountNumber) return accountRef.current?.focus()
    if (next.amount) return amountRef.current?.focus()
    setReview({ recipientAccountNumber: digits, amount: centavos })
  }

  const chooseRecipient = (chosen) => {
    setAccountNumber(formatAccountNumber(chosen.accountNumber))
    setErrors((current) => ({ ...current, accountNumber: undefined }))
  }

  const startNew = () => {
    setAccountNumber('')
    accountRef.current?.focus()
  }

  const handleSent = async (transaction) => {
    setReview(null)
    const sentTo = { recipientName: recipient?.displayName ?? '', accountNumber: digits }
    // Both a completed and a held transfer have already charged the sender.
    let balance = account.balance - transaction.amount
    try {
      balance = (await getMyAccount()).data.balance
    } catch {
      // keep the computed balance; the overview will refresh it
    }
    setLoad((current) => ({ ...current, account: { ...current.account, balance } }))
    getRecentRecipients().then(
      (res) => setLoad((current) => ({ ...current, recipients: res.data })),
      () => {}, // the old list is fine
    )
    setResult({ transaction, balance, ...sentTo })
    showToast(
      transaction.status === 'pending'
        ? 'Transfer submitted. It is waiting for bank approval.'
        : `Naipadala na. Ref ${transaction.referenceNumber}`,
    )
  }

  const sendAnother = () => {
    setResult(null)
    setAccountNumber('')
    setAmountText('')
    setErrors({})
  }

  const accountError = errors.accountNumber ?? liveAccountError

  return (
    <div>
      {/* The page title ("Transfer") is shown in the header */}
      <p className="text-[15px] text-muted">Send money to another account. You review the details before it is sent.</p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,560px)_300px]">
        <Card aria-busy={loading}>
          {load.status === 'error' ? (
            <div role="alert">
              <p className="text-[15px] font-semibold text-text">We couldn’t load your account</p>
              <p className="mt-1 mb-4 text-sm text-muted">{load.error}</p>
              <Button
                onClick={() => {
                  setLoad({ status: 'loading', account: null, recipients: [], error: '' })
                  fetchPage().then(setLoad)
                }}
              >
                Try again
              </Button>
            </div>
          ) : result ? (
            <TransferSuccess
              ref={successRef}
              transaction={result.transaction}
              recipientName={result.recipientName}
              accountNumber={result.accountNumber}
              balance={result.balance}
              onSendAnother={sendAnother}
            />
          ) : noFunds ? (
            <div className="flex flex-col items-start gap-3 py-2">
              <p className="text-[15px] font-semibold text-text">You have no funds to send yet</p>
              <p className="text-sm text-muted">
                <span lang="fil">Simulan natin:</span> add some simulated funds to your account, then come back to
                send money.
              </p>
              <Button to="/customer/cash-in">Cash in</Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              {blocked && (
                <div
                  role="status"
                  className="mb-5 flex items-start gap-3 rounded-2xl bg-status-flagged px-4 py-3 text-sm font-semibold text-status-flagged-text"
                >
                  <LockIcon size={18} className="mt-0.5 shrink-0" />
                  <p>{blockedMessage[account.status] ?? 'This account can’t send transfers right now.'}</p>
                </div>
              )}

              <fieldset disabled={blocked} className="min-w-0 border-0 p-0">
                <legend className="sr-only">Transfer details</legend>

                {loading ? (
                  <Skeleton className="mb-5 h-20" />
                ) : (
                  recipients.length > 0 && (
                    <div className="mb-5">
                      <RecentRecipients
                        recipients={recipients}
                        selected={digits}
                        onChoose={chooseRecipient}
                        onNew={startNew}
                      />
                    </div>
                  )
                )}

                <Input
                  ref={accountRef}
                  id="transfer-account-number"
                  label="Account number"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0000 0000 0000"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(formatAccountNumber(e.target.value.slice(0, 14)))
                    setErrors((current) => ({ ...current, accountNumber: undefined }))
                  }}
                  error={accountError}
                  hint={
                    checking ? (
                      'Checking account…'
                    ) : recipient ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="flex size-6 items-center justify-center rounded-full bg-mint text-[10px] font-bold text-ink"
                        >
                          {recipient.initials}
                        </span>
                        <span className="font-bold text-text">{recipient.displayName}</span>
                      </span>
                    ) : undefined
                  }
                />

                <div className="mt-5">
                  <Input
                    ref={amountRef}
                    id="transfer-amount"
                    label="Amount"
                    prefix="₱"
                    inputMode="decimal"
                    autoComplete="off"
                    maxLength={12}
                    placeholder="0.00"
                    value={amountText}
                    onChange={(e) => {
                      setAmountText(sanitizeAmountInput(e.target.value))
                      setErrors((current) => ({ ...current, amount: undefined }))
                    }}
                    error={errors.amount}
                    hint={
                      loading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        <span className="text-sm">
                          Current balance:{' '}
                          <Amount centavos={account.balance} sensitive className="font-bold text-ink" />
                        </span>
                      )
                    }
                  />
                </div>

                {approval && (
                  <p
                    role="status"
                    className="mt-3 rounded-xl bg-status-pending px-4 py-3 text-sm font-semibold text-status-pending-text"
                  >
                    Transfers of {APPROVAL_THRESHOLD_TEXT} or more need bank approval before they go through.
                  </p>
                )}

                <div className="mt-4">
                  <AmountPresets
                    presets={PRESETS}
                    value={centavos}
                    onSelect={(preset) => {
                      setAmountText(String(preset / 100))
                      setErrors((current) => ({ ...current, amount: undefined }))
                    }}
                    disabled={blocked || loading}
                  />
                </div>

                <Button type="submit" size="lg" className="mt-5 w-full" disabled={blocked || loading}>
                  Transfer
                </Button>
              </fieldset>
            </form>
          )}
        </Card>

        <Card as="aside" aria-labelledby="before-title">
          <h2 id="before-title" className="text-base font-bold text-text">
            Before you send
          </h2>
          <ul className="mt-3 space-y-3 text-sm text-label">
            <li>Transfers under {APPROVAL_THRESHOLD_TEXT} go through right away.</li>
            <li>
              Transfers of {APPROVAL_THRESHOLD_TEXT} or more need bank approval before they go through. You are
              charged now, and the recipient is credited once the bank approves it.
            </li>
            <li>Only you can cancel a transfer, and only while it is waiting for approval. The amount is refunded.</li>
          </ul>
        </Card>
      </div>

      {review && (
        <TransferReviewModal
          recipientAccountNumber={review.recipientAccountNumber}
          amount={review.amount}
          fromAccount={account}
          onClose={() => setReview(null)}
          onSent={handleSent}
        />
      )}
    </div>
  )
}
