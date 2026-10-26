import { formatPeso } from '../../utils/formatPeso'

// Quick-amount buttons. `value` is the typed amount in centavos (or null): the preset
// that matches it looks selected, so the buttons and the field never disagree.
export default function AmountPresets({ presets, value, onSelect, disabled = false }) {
  return (
    <div role="group" aria-label="Quick amounts" className="flex flex-wrap gap-2">
      {presets.map((centavos) => {
        const selected = value === centavos
        return (
          <button
            key={centavos}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onSelect(centavos)}
            className={`h-11 cursor-pointer rounded-full border px-4 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet disabled:cursor-not-allowed disabled:opacity-50 ${
              selected ? 'border-ink bg-ink text-white' : 'border-field-line bg-white text-ink hover:bg-field'
            }`}
          >
            {formatPeso(centavos).replace(/\.00$/, '')}
          </button>
        )
      })}
    </div>
  )
}
