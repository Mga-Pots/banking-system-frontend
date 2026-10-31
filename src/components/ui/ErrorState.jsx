import Card from './Card'
import Button from './Button'

// The server's own message, shown as it came back: { message: "Route not found" }
// `color` is a text color class, for dark surfaces.
export function ServerMessage({ message, color = 'text-text', className = '' }) {
  return (
    <p className={`font-mono font-bold break-words ${color} ${className}`}>
      <span className="sr-only">Message from the server: </span>
      <span aria-hidden="true">{'{ message: "'}</span>
      {message || 'Unknown error'}
      <span aria-hidden="true">{'" }'}</span>
    </p>
  )
}

// When a page, or one part of it, can't load. The page version fills the content
// area; the compact one sits inside a card in place of its list.
export default function ErrorState({
  title,
  message,
  hint = 'Something went wrong while loading this. Please try again in a moment.',
  onRetry,
  compact = false,
  className = '',
}) {
  if (compact) {
    return (
      <div role="alert" className={`flex flex-wrap items-center gap-4 ${className}`}>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text">{title}</p>
          <ServerMessage message={message} className="mt-1 text-sm" />
        </div>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card role="alert" className={`flex flex-col items-center px-6 py-12 text-center ${className}`}>
      <h2 className="text-xl font-bold text-text">{title}</h2>
      <ServerMessage message={message} className="mt-3 text-base sm:text-lg" />
      <p className="mt-4 max-w-md text-muted">{hint}</p>
      <p className="mt-1 max-w-md text-sm text-muted">If it keeps happening, send the message above to IT support.</p>
      {onRetry && (
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  )
}
