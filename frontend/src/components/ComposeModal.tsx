import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { compose, listResource } from '../api'
import type { EmailTemplate } from '../types'

interface Props {
  leadId: number
  leadName: string
  onClose: () => void
}

// The "Copy Email" workflow from leadMarketing's builders.ts — interpolated
// preview + a copy-to-clipboard button, since sending is manual (paste into
// your own email client). No real send API anywhere in the source.
export default function ComposeModal({ leadId, leadName, onClose }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateId, setTemplateId] = useState<number | undefined>(undefined)
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listResource<EmailTemplate>('email-templates').then(r => setTemplates(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setCopied(false)
    compose(leadId, templateId)
      .then(setPreview)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
  }, [leadId, templateId])

  const copy = () => {
    if (!preview) return
    void navigator.clipboard.writeText(`Subject: ${preview.subject}\n\n${preview.body}`)
    setCopied(true)
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded max-w-lg w-full max-h-[85vh] flex flex-col slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-txt">Compose — {leadName}</h2>
          <button onClick={onClose} className="text-txt2 hover:text-txt text-sm">✕</button>
        </div>
        <div className="p-4 overflow-y-auto scrollbar-thin flex-1">
          {error && <div className="text-danger text-xs mb-3">{error}</div>}

          <label className="flex flex-col gap-1 text-xs text-txt2 mb-3">
            Template
            <select
              value={templateId ?? ''}
              onChange={e => setTemplateId(e.target.value ? Number(e.target.value) : undefined)}
              className="px-2 py-1.5 rounded bg-surface2 border border-border text-txt text-sm"
            >
              <option value="">Default cold outreach</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>

          {!preview ? (
            <div className="text-txt2 text-xs">Loading…</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="text-[11px] uppercase tracking-wide text-txt2 mb-1">Subject</div>
                <div className="text-sm text-txt bg-surface2 border border-border rounded p-2">{preview.subject}</div>
              </div>
              <div className="mb-3">
                <div className="text-[11px] uppercase tracking-wide text-txt2 mb-1">Body</div>
                <pre className="whitespace-pre-wrap text-xs text-txt bg-surface2 border border-border rounded p-3 font-sans">
                  {preview.body}
                </pre>
              </div>
              <button
                onClick={copy}
                className="px-4 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90"
              >
                {copied ? 'Copied ✓' : 'Copy to clipboard'}
              </button>
              <p className="text-[11px] text-txt2 mt-2">
                Paste this into your own email client and send — this tool doesn't send email itself
                (no real delivery integration, same as the source it's ported from). Once sent, mark
                it in the Campaign tab.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
