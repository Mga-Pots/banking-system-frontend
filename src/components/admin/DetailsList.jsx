// Read-only label/value rows in a flat mint box, used inside admin dialogs.
export default function DetailsList({ rows }) {
  return (
    <dl className="flex flex-col gap-2.5 rounded-xl border border-divider bg-ground p-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">{label}</dt>
          <dd className="text-right font-semibold text-text">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
