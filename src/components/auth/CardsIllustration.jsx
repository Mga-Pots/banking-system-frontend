export default function CardsIllustration({ className }) {
  return (
    <svg className={className} viewBox="0 0 280 280" role="img" aria-label="Stacked wallet cards">
      <rect x="40" y="58" width="200" height="124" rx="22" fill="#12362D" transform="rotate(-10 140 120)" />
      <rect x="40" y="96" width="200" height="124" rx="22" fill="#FFFFFF" opacity="0.95" />
      <rect x="60" y="116" width="44" height="32" rx="8" fill="#1FD88E" />
      <rect x="60" y="176" width="110" height="12" rx="6" fill="#8FD9BC" />
      <circle cx="210" cy="132" r="14" fill="#2BB38A" />
      <circle cx="192" cy="132" r="14" fill="#063B30" opacity="0.8" />
    </svg>
  )
}
