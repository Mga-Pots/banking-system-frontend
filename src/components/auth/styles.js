// Shared Tailwind class strings for the auth pages (Login, Register).

export const inputClass =
  'h-13 w-full min-w-0 rounded-2xl border-[1.5px] border-line bg-white px-4 text-[15px] text-text outline-none transition ' +
  'placeholder:text-placeholder focus:border-bright focus:ring-4 focus:ring-bright/15 aria-invalid:border-error'

export const labelClass = 'text-[13px] font-semibold text-label'

export const fieldErrorClass = 'm-0 text-xs font-semibold text-error'

export const linkClass = 'font-bold text-wallet hover:underline'

const buttonBase =
  'flex h-[54px] items-center justify-center rounded-full text-[15px] font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

export const primaryButtonClass = `${buttonBase} bg-forest text-white hover:brightness-115`

export const secondaryButtonClass = `${buttonBase} border-[1.5px] border-line bg-white text-ink hover:bg-ground`
