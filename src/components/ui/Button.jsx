import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

// The focus outline color is part of each variant, so it stays visible on its surface.
const variants = {
  primary: 'bg-ink text-white hover:bg-forest focus-visible:outline-wallet',
  secondary: 'border-[1.5px] border-field-line bg-white text-ink hover:bg-field focus-visible:outline-wallet',
  white: 'bg-white text-ink hover:bg-field focus-visible:outline-wallet',
  // for a clearly good action that should stand out from plain ones, like verifying a customer
  positive: 'bg-wallet text-white hover:brightness-110 focus-visible:outline-wallet',
  // for pausing something, like freezing an account: amber, between green and red
  caution:
    'bg-status-pending text-status-pending-text hover:brightness-95 focus-visible:outline-status-pending-text',
  // for actions that can't be undone, like cancelling a transaction
  danger: 'bg-error text-white hover:brightness-110 focus-visible:outline-error',
  // for dark green surfaces
  accent: 'bg-accent text-forest hover:brightness-95 focus-visible:outline-accent',
  ghost: 'border border-white/25 bg-white/10 text-white hover:bg-white/15 focus-visible:outline-accent',
}

const sizes = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-6 text-[15px]',
}

// A button, or a link that looks like one when `to` is given.
// A disabled link turns into a disabled button so it can't be followed.
export default function Button({ variant = 'primary', size = 'md', to, disabled, className = '', children, ...rest }) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  )
}
