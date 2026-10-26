import Button from '../ui/Button'

// Shown at the bottom of the sidebar until staff verify the customer.
export default function VerifyCard({ onNavigate }) {
  return (
    <section
      aria-labelledby="verify-title"
      className="mt-auto rounded-[20px] bg-ink p-4 text-center text-white [&_a:focus-visible]:outline-accent"
    >
      <div aria-hidden="true" className="mb-4 h-24 rounded-2xl bg-white/10" />
      <h2 id="verify-title" className="text-[15px] font-bold">
        Get verified
      </h2>
      <p className="mt-1 mb-4 text-[13px] leading-snug text-mint">
        Staff will confirm your identity. Check that your profile details are correct.
      </p>
      <Button variant="white" to="/customer/settings" onClick={onNavigate} className="w-full">
        Review profile
      </Button>
    </section>
  )
}
