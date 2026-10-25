import { useId } from 'react'

// A quiet diamond weave, a nod to the banig and inabel mats. Decorative only: it
// takes its color from the surrounding text color, and fills its (relative) parent.
export default function Weave({ className = '', opacity = 0.12 }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 size-full ${className}`}>
      <defs>
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M14 0 28 14 14 28 0 14Z" fill="none" stroke="currentColor" strokeOpacity={opacity} />
          <path d="M14 7 21 14 14 21 7 14Z" fill="none" stroke="currentColor" strokeOpacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
