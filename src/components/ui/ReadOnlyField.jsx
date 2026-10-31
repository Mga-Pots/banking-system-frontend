// A labelled value that can't be edited. It has the same label as <Input>, but a flatter
// look (hairline border and a soft fill) so it doesn't read as a field you can type in.
// `hint` is the text under it.
export default function ReadOnlyField({ id, label, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <p id={`${id}-label`} className="text-sm font-bold text-text">
        {label}
      </p>
      <div
        id={id}
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="flex min-h-12 items-center rounded-xl border border-divider bg-ground px-4 py-3 text-[15px] text-text"
      >
        {children}
      </div>
      {hint && (
        <div id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </div>
      )}
    </div>
  )
}
