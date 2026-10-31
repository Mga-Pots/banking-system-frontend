// Grey placeholder block shown while a card is loading.
export default function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-xl bg-divider motion-safe:animate-pulse ${className}`}
    />
  )
}
