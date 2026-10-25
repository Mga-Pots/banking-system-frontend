// A white panel with a hairline border, no shadow.
export default function Card({ as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag className={`rounded-2xl border border-divider bg-white p-6 ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
