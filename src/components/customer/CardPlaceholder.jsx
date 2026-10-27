import Button from '../ui/Button'
import { CardIcon } from '../ui/Icons'

// Takes the card's place on the balance banner until staff verify the customer.
export default function CardPlaceholder() {
  return (
    <div className="relative isolate flex min-h-[190px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-white/25 bg-white/5 p-5 text-center text-white backdrop-blur-sm">
      <CardIcon size={28} aria-hidden="true" />
      <p className="text-[15px] font-bold">Your card is on its way</p>
      <p className="max-w-[240px] text-[13px] leading-snug text-white/80">
        It becomes available once staff verify your account. Check that your profile details are correct.
      </p>
      <Button variant="ghost" to="/customer/settings">
        Review profile
      </Button>
    </div>
  )
}
