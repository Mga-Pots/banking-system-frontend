import { formatPeso } from '../../utils/formatPeso'
import Sensitive from './Sensitive'

// Money from integer centavos. `sign` is "+" or "−" for transaction rows.
// `sensitive` hides it when the customer has turned on "hide details".
// `split` sets the ₱ and the centavos smaller than the pesos, like a printed ledger.
export default function Amount({ centavos, sign = '', sensitive = false, split = false, mask = '₱ ••••••', className = '' }) {
  const formatted = formatPeso(centavos)
  const [, symbol = '', pesos = formatted, cents = ''] = split ? (formatted.match(/^(\D*)([\d,]+)(\.\d+)?$/) ?? []) : []

  const content = split ? (
    <>
      {sign && `${sign} `}
      <span className="mr-[0.08em] text-[0.62em] font-medium">{symbol}</span>
      {pesos}
      <span className="text-[0.62em] font-medium">{cents}</span>
    </>
  ) : (
    `${sign ? `${sign} ` : ''}${formatted}`
  )

  return (
    <span className={`tabular-nums ${className}`}>
      {sensitive ? <Sensitive mask={mask}>{content}</Sensitive> : content}
    </span>
  )
}
