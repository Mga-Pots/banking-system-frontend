import { useEffect, useId, useRef } from 'react'
import { CloseIcon } from './Icons'

const placements = {
  center: 'm-auto w-[calc(100%-2rem)] max-w-[440px] rounded-3xl',
  right: 'my-0 mr-0 ml-auto h-dvh max-h-none w-full max-w-[420px] rounded-l-3xl',
  left: 'my-0 mr-auto ml-0 h-dvh max-h-none w-[280px] max-w-[85vw]',
}

// Dialog built on the browser's own <dialog>: it traps focus, closes on Esc, and
// blocks the page behind it. Render it only while it should be open; `onClose`
// runs when it closes (Esc, the X button, or a click on the backdrop).
// `placement`: "center" | "right" (drawer) | "left" (menu drawer).
export default function Modal({ title, hideTitle = false, placement = 'center', flush = false, onClose, children }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const opener = document.activeElement
    if (!dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [])

  const close = () => dialogRef.current?.close()

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      className={`overflow-y-auto bg-white p-0 text-text shadow-2xl backdrop:bg-black/40 ${placements[placement]}`}
    >
      <div className={`flex items-center gap-4 ${hideTitle ? 'justify-end' : 'justify-between'} px-6 pt-6`}>
        <h2 id={titleId} className={hideTitle ? 'sr-only' : 'text-xl font-bold'}>
          {title}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
        >
          <CloseIcon size={20} />
        </button>
      </div>
      <div className={flush ? '' : 'px-6 pt-4 pb-6'}>{children}</div>
    </dialog>
  )
}
