import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon } from './Icons'

const ToastContext = createContext(null)

// Shows one short message at the bottom of the screen, read out by screen readers.
// The message is drawn as a popover, which the browser puts in the top layer, so it
// also shows above an open dialog (a dialog would otherwise cover it).
export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const timer = useRef(null)
  const popoverRef = useRef(null)

  // Show the popover while there is a message. Showing it again moves it above any
  // dialog that opened since. Browsers without popovers just show it in the page.
  useEffect(() => {
    const el = popoverRef.current
    if (!el?.showPopover) return
    if (el.matches(':popover-open')) el.hidePopover()
    if (message) el.showPopover()
  }, [message])

  const showToast = useCallback((text) => {
    clearTimeout(timer.current)
    setMessage(text)
    timer.current = setTimeout(() => setMessage(''), 3500)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Screen readers hear the message from here; the popover below is only the picture */}
      <div role="status" aria-live="polite" className="sr-only">
        {message}
      </div>
      <div
        ref={popoverRef}
        popover="manual"
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-auto bottom-6 m-0 w-full overflow-visible border-0 bg-transparent p-0"
      >
        <div className="flex justify-center px-4">
          {message && (
            <p className="flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white shadow-lg">
              <CheckIcon size={16} className="shrink-0 text-accent" />
              {message}
            </p>
          )}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
