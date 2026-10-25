export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" rx="28" fill="#0B4A3B" />
      <path
        d="M63.9 26 A16 16 0 1 0 50 50 A16 16 0 1 1 36.1 74"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  )
}
