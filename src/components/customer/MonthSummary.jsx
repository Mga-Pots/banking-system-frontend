import Card from '../ui/Card'
import Amount from '../ui/Amount'
import Skeleton from '../ui/Skeleton'
import { ChevronDownIcon } from '../ui/Icons'

const labelClass = 'text-xs font-bold tracking-wider text-muted uppercase'

// Money in and out for the chosen period, plus what that adds up to. Only
// "This month" is offered for now: other periods need a filter the backend
// hasn't confirmed yet.
export default function MonthSummary({ summary, loading }) {
  const net = summary.moneyInThisMonth - summary.moneyOutThisMonth

  return (
    <Card aria-label="Money in and out" aria-busy={loading}>
      <label htmlFor="summary-period" className={`block ${labelClass}`}>
        Period
      </label>
      <div className="relative mb-5 inline-block">
        <select
          id="summary-period"
          defaultValue="month"
          className="-my-2 cursor-pointer appearance-none rounded bg-transparent py-2 pr-6 text-xl font-bold text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
        >
          <option value="month">This month</option>
        </select>
        <ChevronDownIcon
          size={16}
          className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-ink"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : (
        <dl className="space-y-4">
          <div>
            <dt className={labelClass}>Money out</dt>
            <dd className="font-brand text-2xl font-semibold text-text">
              <Amount centavos={summary.moneyOutThisMonth} sensitive />
            </dd>
          </div>
          <div>
            <dt className={labelClass}>Money in</dt>
            <dd className="font-brand text-2xl font-semibold text-wallet">
              <Amount centavos={summary.moneyInThisMonth} sensitive />
            </dd>
          </div>
          <div className="border-t border-divider pt-4">
            <dt className={labelClass}>
              <span lang="fil">Net ngayong buwan</span>
            </dt>
            <dd className="font-brand text-2xl font-semibold text-ink">
              <Amount centavos={Math.abs(net)} sign={net < 0 ? '−' : '+'} sensitive />
            </dd>
          </div>
        </dl>
      )}
    </Card>
  )
}
