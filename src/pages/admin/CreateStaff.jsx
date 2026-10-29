import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { UserPlusIcon } from '../../components/ui/Icons'
import { createStaff } from '../../api/admin'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BACK = '/admin/users' // after creating (or Cancel), Users opens on the Staff tab

function validate({ name, email, password }) {
  const errors = {}
  if (name.trim().length < 2) errors.name = 'Enter their full name.'
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Use at least 8 characters with letters and numbers.'
  }
  return errors
}

// Its own page in the sidebar. Admin creates a staff account with a temporary
// password, then goes to Users > Staff.
export default function AdminCreateStaff() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setError('')
    setSaving(true)
    try {
      const res = await createStaff({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      showToast(`Staff account created for ${res.data.name}.`)
      navigate(BACK)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl pt-2 md:pt-6">
      <Card>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-mint text-ink">
              <UserPlusIcon size={22} />
            </span>
            <h2 className="text-xl font-bold text-text">New staff account</h2>
            <p className="mt-1 text-sm text-muted">
              They’ll log in with this email and should change the password the first time.
            </p>
          </div>
          <Input id="staff-name" label="Full name" value={form.name} onChange={update('name')} error={errors.name} autoComplete="off" />
          <Input id="staff-email" label="Work email" type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="off" />
          <Input
            id="staff-password"
            label="Temporary password"
            type="password"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            hint={errors.password ? undefined : 'At least 8 characters, with letters and numbers.'}
            autoComplete="new-password"
          />
          {error && (
            <p role="alert" className="text-sm font-semibold text-error">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" to={BACK}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create staff account'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
