# Warmup-as-a-Service (#14)

White-labeled email drip engine, decoupled from scraping — bring your own lead list. Ported from
`F:\leadMarketing`'s `WarmupPlan`/`WarmupBatch`/`WarmupBatchLead` cold-email scheduler (round-robin-
by-country interleaving, 7-tier day-stepped quota ramp) and its `EmailTemplate`/`EmailLog` models.

**Simulate-only, ported faithfully** — confirmed no real email-sending integration exists anywhere in
`leadMarketing` (no nodemailer/SendGrid/SMTP, nothing). "Sending" means copying a composed email and
pasting it into your own email client, then marking it sent here — an honest self-reported log, same
as the source. See `warmup-batch-leads.controller.ts`.

**White-label**: unlike the source (which hardcodes its own "Marian Pirvan / LevelCoding" signature
into every template), templates interpolate a configurable `SenderIdentity` (singleton, same pattern
as Audit Magnet CRM's `BrandSettings`) — `{{sender_name}}`, `{{sender_company}}`, `{{booking_link}}`,
etc, alongside the lead-side placeholders (`{{name}}`, `{{city}}`, `{{country}}`, `{{website}}`).

`phase`/`domain`/`language` (leadMarketing's internal rollout segmentation) dropped — meaningless for
a standalone customer's own list. The catalog's "country ... dashboard" is a simpler always-available
per-country breakdown (`GET /warmup-plans/dashboard`), not the source's phase-6-only country grid.

One deliberate improvement over the source: leadMarketing's `EmailLog` write and marking a batch lead
`SENT` are two independent, disconnected code paths there (a lead can be `SENT` with zero log rows).
Here, marking `SENT` atomically also logs the `EmailLog` row.

## Local dev

Backend: `:3317`. Frontend: `:5191`.

```
npm install
npm run prisma:generate
npx prisma migrate dev --name init
npm run dev
```

```
cd frontend
npm install
npm run dev
```
