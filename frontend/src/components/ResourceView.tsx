import { useEffect, useState, type FormEvent } from 'react'
import { createResource, deleteResource, listResource, patchResource } from '../api'
import type { ColumnDef, FieldDef } from '../types'

interface Props<T extends { id: number }> {
  resource: string
  title: string
  columns: ColumnDef<T>[]
  formFields: FieldDef[]
  onRowAction?: { label: string; onClick: (row: T) => void }
}

export default function ResourceView<T extends { id: number }>({
  resource, title, columns, formFields, onRowAction,
}: Props<T>) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    listResource<T>(resource)
      .then(r => { setRows(r.data); setError(null) })
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(); closeForm() }, [resource])

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setValues({})
  }

  const startCreate = () => {
    if (formOpen && editingId === null) { closeForm(); return }
    setEditingId(null)
    setValues({})
    setFormOpen(true)
  }

  const startEdit = (row: T) => {
    const prefill: Record<string, string> = {}
    for (const f of formFields) {
      const raw = (row as Record<string, unknown>)[f.key]
      if (raw !== undefined && raw !== null) prefill[f.key] = String(raw)
    }
    setEditingId(row.id)
    setValues(prefill)
    setFormOpen(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body: Record<string, unknown> = {}
      for (const f of formFields) {
        const raw = values[f.key]
        if (raw === undefined || raw === '') continue
        body[f.key] = f.type === 'number' ? Number(raw) : raw
      }
      if (editingId !== null) {
        await patchResource(resource, editingId, body)
      } else {
        await createResource(resource, body)
      }
      closeForm()
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this record?')) return
    await deleteResource(resource, id)
    load()
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-txt">{title}</h1>
        <button
          onClick={startCreate}
          className="px-3 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          {formOpen && editingId === null ? 'Cancel' : `+ New ${title.replace(/s$/, '')}`}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded bg-danger/10 border border-danger/30 text-danger text-xs">
          {error}
        </div>
      )}

      {formOpen && (
        <form onSubmit={submit} className="mb-6 p-4 rounded border border-border bg-surface slide-up grid grid-cols-2 gap-3">
          <div className="col-span-2 text-xs font-medium text-txt2 -mb-1">
            {editingId !== null ? `Editing ${title.replace(/s$/, '')} #${editingId}` : `New ${title.replace(/s$/, '')}`}
          </div>
          {formFields.map(f => (
            <label key={f.key} className={`flex flex-col gap-1 text-xs text-txt2 ${f.type === 'textarea' ? 'col-span-2' : ''}`}>
              {f.label}{f.required && <span className="text-danger"> *</span>}
              {f.type === 'textarea' ? (
                <textarea
                  required={f.required}
                  placeholder={f.placeholder}
                  rows={8}
                  value={values[f.key] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  className="px-2 py-1.5 rounded bg-surface2 border border-border text-txt text-sm font-mono text-xs"
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  className="px-2 py-1.5 rounded bg-surface2 border border-border text-txt text-sm"
                />
              )}
            </label>
          ))}
          <div className="col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-1.5 rounded text-xs font-medium bg-surface2 text-txt2 hover:text-txt transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : editingId !== null ? 'Save changes' : 'Save'}
            </button>
          </div>
        </form>
      )}

      <div className="rounded border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-txt2">
              {columns.map(c => <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>)}
              <th className="px-3 py-2 font-medium w-1" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="px-3 py-6 text-center text-txt2">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-3 py-6 text-center text-txt2">Nothing here yet.</td></tr>
            ) : rows.map(row => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface2 transition-colors">
                {columns.map(c => (
                  <td key={c.key} className="px-3 py-2 text-txt whitespace-nowrap">
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                  </td>
                ))}
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {onRowAction && (
                    <button onClick={() => onRowAction.onClick(row)} className="text-xs text-accent hover:underline mr-3">
                      {onRowAction.label}
                    </button>
                  )}
                  <button onClick={() => startEdit(row)} className="text-xs text-txt2 hover:text-txt hover:underline mr-3">
                    Edit
                  </button>
                  <button onClick={() => void remove(row.id)} className="text-xs text-danger hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
