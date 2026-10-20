export default function CardsIllustration({ className }) {
  return (
    <svg className={className} viewBox="0 0 280 280" role="img" aria-label="Stacked wallet cards">
      <rect x="40" y="58" width="200" height="124" rx="22" fill="#1E3A2B" transform="rotate(-10 140 120)" />
      <rect x="40" y="96" width="200" height="124" rx="22" fill="#FFFFFF" opacity="0.95" />
      <rect x="60" y="116" width="44" height="32" rx="8" fill="#BEF264" />
      <rect x="60" y="176" width="110" height="12" rx="6" fill="#86EFAC" />
      <circle cx="210" cy="132" r="14" fill="#22C55E" />
      <circle cx="192" cy="132" r="14" fill="#064E3B" opacity="0.8" />
    </svg>
  )
}
