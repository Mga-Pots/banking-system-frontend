import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Amount from '../ui/Amount'
import RecentRecipients from './RecentRecipients'
import SelectedRecipient from './SelectedRecipient'
import { formatAccountNumber } from '../../utils/formatAccountNumber'
import { INSUFFICIENT_BALANCE, exceedsBalance, pesosToCentavos, sanitizeAmountInput } from '../../utils/parseAmount'
import { APPROVAL_THRESHOLD_TEXT } from '../../utils/transferRules'

// Fill in a recipient and an amount, then press "Transfer". It opens the
// review step; nothing is sent from here. The first recent recipient starts picked.
// A picked recipient shows as name and masked number (its full number stays in `picked`);
// "Change" goes back to typing a number.
export default function QuickTransfer({ recipients, available, frozen, onReview }) {
  const [picked, setPicked] = useState(recipients[0] ?? null)
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState({})
  const accountRef = useRef(null)
  const amountRef = useRef(null)
  const focusTyped = useRef(false)

  // Said while the customer types, not only on submit; an empty field is never an error.
  const overBalance = exceedsBalance(amount, available)

  const digits = picked ? picked.accountNumber : accountNumber.replace(/\D/g, '')

  // The number field only exists once nothing is picked, so focus it after it appears.
  useEffect(() => {
    if (!picked && focusTyped.current) {
      focusTyped.current = false
      accountRef.current?.focus()
    }
  }, [picked])

  const submit = (e) => {
    e.preventDefault()
    const centavos = pesosToCentavos(amount)
    const found = {}
    if (digits.length !== 12) found.accountNumber = 'Enter the 12-digit account number.'
    if (centavos === null || centavos <= 0) found.amount = 'Enter an amount greater than ₱0.00.'
    else if (centavos > available) found.amount = INSUFFICIENT_BALANCE
    setErrors(found)

    if (found.accountNumber) return accountRef.current?.focus()
    if (found.amount) return amountRef.current?.focus()
    onReview({ recipientAccountNumber: digits, amount: centavos })
  }

  const chooseRecipient = (recipient) => {
    setPicked(recipient)
    setAccountNumber('')
    setErrors((current) => ({ ...current, accountNumber: undefined }))
  }

  const startNew = () => {
    focusTyped.current = true
    setPicked(null)
    setAccountNumber('')
    accountRef.current?.focus() // when the field is already there; otherwise the effect does it
  }

  return (
    <Card aria-labelledby="quick-transfer-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="quick-transfer-title" className="text-xl font-bold text-text">
          Quick transfer
        </h2>
        <Link to="/customer/transfer" className="-my-3 inline-flex items-center py-3 text-sm font-bold text-wallet hover:underline">
          Full transfer page
        </Link>
      </div>

      <div className="mb-5">
        <RecentRecipients recipients={recipients} selected={digits} onChoose={chooseRecipient} onNew={startNew} />
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {picked ? (
          <SelectedRecipient recipient={picked} onClear={startNew} />
        ) : (
          <Input
            ref={accountRef}
            id="quick-account-number"
            label="Account number"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0000 0000 0000"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(formatAccountNumber(e.target.value.slice(0, 14)))
              setErrors((current) => ({ ...current, accountNumber: undefined }))
            }}
            error={errors.accountNumber}
          />
        )}
        <Input
          ref={amountRef}
          id="quick-amount"
          label="Amount"
          prefix="₱"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            setAmount(sanitizeAmountInput(e.target.value))
            setErrors((current) => ({ ...current, amount: undefined }))
          }}
          error={errors.amount ?? (overBalance ? INSUFFICIENT_BALANCE : undefined)}
          hint={
            <>
              Available:{' '}
              <Amount centavos={available} sensitive mask="₱ ••••••" />
            </>
          }
        />
        <p className="text-xs text-muted">
          Transfers under {APPROVAL_THRESHOLD_TEXT} go through right away. {APPROVAL_THRESHOLD_TEXT} or more needs
          bank approval first.
        </p>
        <Button type="submit" size="lg" disabled={frozen || overBalance} className="w-full">
          Transfer
        </Button>
      </form>
    </Card>
  )
}
