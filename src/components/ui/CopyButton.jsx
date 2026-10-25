import { useRef, useState } from 'react'
import { CheckIcon, CopyIcon } from './Icons'

// Copies `value` to the clipboard. It copies the real value even when the screen
// is showing it hidden. `showLabel` adds a visible "Copied" next to the icon, for
// places where a toast can't be seen (inside a dialog).
export default function CopyButton({ value, label, onCopied, showLabel = false, className = '' }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      return // clipboard blocked: leave the button as it was
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
    onCopied?.()
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`relative inline-flex size-8 shrink-0 cursor-pointer before:absolute before:-inset-1.5 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${showLabel && copied ? 'w-auto px-2' : ''} ${className}`}
    >
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      {showLabel && copied && <span role="status">Copied</span>}
    </button>
  )
}
