import { useEffect, useState } from 'react'
import { advanceCampaign, createCampaign, deleteCampaign, getCampaign, getDashboard, setBatchLeadStatus } from '../api'
import type { CountryStat, Plan } from '../types'

export default function CampaignView() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [countries, setCountries] = useState<CountryStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([getCampaign(), getDashboard()])
      .then(([c, d]) => { setPlan(c.plan); setCountries(d.countries) })
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const generate = async () => {
    try {
      await createCampaign()
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const remove = async () => {
    if (!confirm('Delete the current campaign? This removes all batches and status history.')) return
    await deleteCampaign()
    load()
  }

  const advance = async () => {
    if (!plan) return
    try {
      await advanceCampaign(plan.id)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const mark = async (batchLeadId: number, status: string) => {
    await setBatchLeadStatus(batchLeadId, status)
    load()
  }

  if (loading) return <div className="text-txt2 text-sm">Loading…</div>

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-txt">Campaign</h1>
          <p className="text-xs text-txt2 mt-1">
            Round-robin by country, quota ramps 15 → 20 → 25 → 35 → 50 → 75 → 100 over 65+ days.
          </p>
        </div>
        {plan ? (
          <div className="flex gap-2">
            <button onClick={() => void advance()} className="px-3 py-1.5 rounded text-xs font-medium bg-surface2 text-txt2 hover:text-txt">
              Skip to next day →
            </button>
            <button onClick={() => void remove()} className="px-3 py-1.5 rounded text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20">
              Delete campaign
            </button>
          </div>
        ) : (
          <button onClick={() => void generate()} className="px-3 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90">
            Generate campaign
          </button>
        )}
      </div>

      {error && <div className="mb-4 px-3 py-2 rounded bg-danger/10 border border-danger/30 text-danger text-xs">{error}</div>}

      {countries.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-2">
          {countries.map(c => (
            <div key={c.country} className="p-3 rounded border border-border bg-surface">
              <div className="text-xs font-medium text-txt">{c.country}</div>
              <div className="text-[11px] text-txt2 mt-1">{c.sent} sent · {c.pending} pending · {c.skipped} skipped</div>
            </div>
          ))}
        </div>
      )}

      {!plan ? (
        <div className="text-txt2 text-sm p-6 text-center border border-border rounded bg-surface">
          No campaign yet. Add some leads with email addresses, then generate one.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {plan.batches.map(b => (
            <div key={b.id} className="border border-border rounded bg-surface overflow-hidden">
              <button
                onClick={() => setExpanded(e => (e === b.id ? null : b.id))}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface2 transition-colors"
              >
                <span className="text-sm text-txt">
                  Day {b.dayNumber} · {new Date(b.date).toLocaleDateString()}
                  {b.isToday && <span className="ml-2 text-[10px] uppercase tracking-wide text-accent">Today</span>}
                </span>
                <span className="text-xs text-txt2">
                  {b.sent} sent · {b.skipped} skipped · {b.total} total
                </span>
              </button>
              {expanded === b.id && (
                <div className="border-t border-border divide-y divide-border">
                  {b.leads.map(bl => (
                    <div key={bl.id} className="flex items-center justify-between px-4 py-2 text-xs">
                      <span className="text-txt">{bl.lead?.name ?? `Lead #${bl.leadId}`}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-txt2">{bl.status}</span>
                        {bl.status !== 'SENT' && (
                          <button onClick={() => void mark(bl.id, 'SENT')} className="text-ok hover:underline">Sent</button>
                        )}
                        {bl.status !== 'SKIPPED' && (
                          <button onClick={() => void mark(bl.id, 'SKIPPED')} className="text-txt2 hover:underline">Skip</button>
                        )}
                        {bl.status !== 'PENDING' && (
                          <button onClick={() => void mark(bl.id, 'PENDING')} className="text-txt2 hover:underline">Undo</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
