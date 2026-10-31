const words = (name) => String(name ?? '').trim().split(/\s+/).filter(Boolean)

// "Maria Clara Santos" -> "MC"
export const initialsOf = (name) =>
  words(name)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

export const firstNameOf = (name) => words(name)[0] ?? ''

// "Pedro Garcia" -> "Pedro G."
export const maskedName = (name) => {
  const parts = words(name)
  return parts.length < 2 ? (parts[0] ?? '') : `${parts[0]} ${parts[parts.length - 1][0]}.`
}
