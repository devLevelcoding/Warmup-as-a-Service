import { useEffect, useState, type FormEvent } from 'react'
import { getResource, patchResource } from '../api'
import type { SenderIdentity } from '../types'

// Singleton settings form — see schema.prisma's SenderIdentity comment.
// "White-label the drip engine" from the catalog pitch.
export default function SenderIdentityView() {
  const [values, setValues] = useState<Partial<SenderIdentity>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getResource<SenderIdentity>('sender-identity')
      .then(setValues)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const updated = await patchResource<SenderIdentity>('sender-identity', '', {
        senderName: values.senderName,
        companyName: values.companyName,
        email: values.email || null,
        phone: values.phone || null,
        bookingLink: values.bookingLink || null,
        linkedinUrl: values.linkedinUrl || null,
      })
      setValues(updated)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-txt2 text-sm">Loading…</div>

  const field = (key: keyof SenderIdentity, label: string) => (
    <label className="flex flex-col gap-1 text-xs text-txt2">
      {label}
      <input
        value={(values[key] as string) ?? ''}
        onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
        className="px-2 py-1.5 rounded bg-surface2 border border-border text-txt text-sm"
      />
    </label>
  )

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-txt">Sender Identity</h1>
        <p className="text-xs text-txt2 mt-1">
          Interpolated into every template via <code className="text-txt">{'{{sender_name}}'}</code>,{' '}
          <code className="text-txt">{'{{sender_company}}'}</code>,{' '}
          <code className="text-txt">{'{{booking_link}}'}</code>, etc. — this is the "white-label" part:
          your identity, not ours, goes into every composed email.
        </p>
      </div>

      {error && <div className="mb-4 px-3 py-2 rounded bg-danger/10 border border-danger/30 text-danger text-xs">{error}</div>}
      {saved && <div className="mb-4 px-3 py-2 rounded bg-ok/10 border border-ok/30 text-ok text-xs">Saved.</div>}

      <form onSubmit={submit} className="p-4 rounded border border-border bg-surface grid grid-cols-2 gap-3">
        {field('senderName', 'Sender name')}
        {field('companyName', 'Company name')}
        {field('email', 'Email')}
        {field('phone', 'Phone')}
        {field('bookingLink', 'Booking link')}
        {field('linkedinUrl', 'LinkedIn URL')}
        <div className="col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
