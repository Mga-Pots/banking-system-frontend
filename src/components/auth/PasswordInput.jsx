import { useState } from 'react'
import { inputClass } from './styles'

// Password field with a Show/Hide button.
export default function PasswordInput({ id, value, onChange, placeholder, autoComplete, describedBy, invalid }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative flex">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`${inputClass} pr-[72px]`}
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute top-1.5 right-1.5 h-10 cursor-pointer rounded-[10px] bg-ground px-3 text-[13px] font-bold text-ink hover:bg-mint-mid"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
