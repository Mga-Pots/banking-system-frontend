import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckIcon } from './Icons'

const ToastContext = createContext(null)

// Shows one short message at the bottom of the screen, read out by screen readers.
// Open dialogs sit above the page, so a toast fired while one is open won't be
// visible; close the dialog first, or show the message inside it.
export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const timer = useRef(null)

  const showToast = useCallback((text) => {
    clearTimeout(timer.current)
    setMessage(text)
    timer.current = setTimeout(() => setMessage(''), 3500)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      >
        {message && (
          <p className="flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white shadow-lg">
            <CheckIcon size={16} className="shrink-0 text-accent" />
            {message}
          </p>
        )}
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
