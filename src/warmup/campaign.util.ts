// Quota ramp ported from F:\leadMarketing\app\api\warmup\route.ts's
// getQuota() — the full 7-tier schedule (WhatsApp's version only had 5
// tiers, confirmed these are genuinely different in the source, not a
// copy-paste of the same constants). Domain-based splitting (leadMarketing's
// internal 5-domain lead segmentation) dropped — "bring your own list" has
// no equivalent concept; plain round-robin-by-country only, same as
// WhatsApp-Only CRM (#13).
export function getQuota(day: number): number {
  if (day <= 3) return 15;
  if (day <= 7) return 20;
  if (day <= 14) return 25;
  if (day <= 21) return 35;
  if (day <= 30) return 50;
  if (day <= 65) return 75;
  return 100;
}

export function interleaveByCountry<T extends { id: number; country?: string | null }>(leads: T[]): T[] {
  const byCountry = new Map<string, T[]>();
  for (const l of leads) {
    const key = l.country ?? '__unknown__';
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key)!.push(l);
  }
  const queues = Array.from(byCountry.values());
  const interleaved: T[] = [];
  let qi = 0;
  while (interleaved.length < leads.length) {
    const q = queues[qi % queues.length];
    if (q.length) interleaved.push(q.shift()!);
    qi++;
  }
  return interleaved;
}

export function dedupeByEmail<T extends { email?: string | null }>(leads: T[]): T[] {
  const seen = new Set<string>();
  return leads.filter((l) => {
    const key = (l.email ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
