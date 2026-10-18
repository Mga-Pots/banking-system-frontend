// Red asterisk after a label to show the field is required.
export default function RequiredMark() {
  return (
    <span className="ml-0.5 text-error" aria-hidden="true">
      *
    </span>
  )
}
