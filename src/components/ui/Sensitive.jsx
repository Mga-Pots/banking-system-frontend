import { usePrivacy } from '../../context/PrivacyContext'

// Wrap any private value (balance, account number, totals) so the eye button in
// the dashboard hides every one of them together. `mask` is what shows instead.
export default function Sensitive({ children, mask = '••••••' }) {
  const { hidden } = usePrivacy()
  if (!hidden) return children
  return (
    <>
      {/* Sora draws the bullet as a square, so the mask uses the body face */}
      <span aria-hidden="true" className="font-sans font-medium">
        {mask}
      </span>
      <span className="sr-only">Hidden</span>
    </>
  )
}
