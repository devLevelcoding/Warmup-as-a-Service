import { BadRequestException, Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { dedupeByEmail, getQuota, interleaveByCountry } from './warmup/campaign.util';

// Ported from F:\leadMarketing\app\api\warmup\route.ts, domain-splitting
// dropped (see campaign.util.ts). One active plan at a time, same
// simplification as WhatsApp-Only CRM's campaign controller.
@Controller('warmup-plans')
export class WarmupPlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async current() {
    const plan = await this.prisma.warmupPlan.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { batches: { include: { leads: { include: { lead: true }, orderBy: { id: 'asc' } } }, orderBy: { dayNumber: 'asc' } } },
    });
    if (!plan) return { plan: null };

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const batches = plan.batches.map((b) => {
      const bDate = new Date(b.date);
      bDate.setHours(0, 0, 0, 0);
      return {
        id: b.id,
        dayNumber: b.dayNumber,
        date: b.date,
        quota: b.quota,
        leads: b.leads,
        sent: b.leads.filter((l) => l.status === 'SENT').length,
        skipped: b.leads.filter((l) => l.status === 'SKIPPED').length,
        total: b.leads.length,
        isToday: bDate >= start && bDate < end,
        isPast: bDate < start,
      };
    });

    return {
      plan: {
        id: plan.id,
        startDate: plan.startDate,
        totalDays: plan.totalDays,
        currentDay: batches.find((b) => b.isToday)?.dayNumber ?? null,
        batches,
      },
    };
  }

  // "Country ... dashboard" from the catalog pitch — per-country breakdown
  // of the active campaign's leads, no equivalent endpoint in the source
  // (which had a much heavier phase/domain-scoped country grid, phase-6-only
  // — this is a simpler, always-available generalization of that idea).
  @Get('dashboard')
  async dashboard() {
    const plan = await this.prisma.warmupPlan.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { batches: { include: { leads: { include: { lead: true } } } } },
    });
    if (!plan) return { countries: [] };

    const byCountry = new Map<string, { total: number; sent: number; skipped: number; pending: number }>();
    for (const batch of plan.batches) {
      for (const bl of batch.leads) {
        const key = bl.lead.country ?? 'Unknown';
        if (!byCountry.has(key)) byCountry.set(key, { total: 0, sent: 0, skipped: 0, pending: 0 });
        const c = byCountry.get(key)!;
        c.total++;
        if (bl.status === 'SENT') c.sent++;
        else if (bl.status === 'SKIPPED') c.skipped++;
        else c.pending++;
      }
    }
    return { countries: Array.from(byCountry.entries()).map(([country, counts]) => ({ country, ...counts })) };
  }

  @Post()
  async create(@Body() body: { startDate?: string }) {
    const existing = await this.prisma.warmupPlan.findFirst();
    if (existing) throw new BadRequestException('A campaign already exists — delete it first.');

    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const rawLeads = await this.prisma.lead.findMany({
      where: { deletedAt: null, email: { not: null } },
      select: { id: true, country: true, email: true },
      orderBy: { id: 'asc' },
    });
    const leads = interleaveByCountry(dedupeByEmail(rawLeads));
    if (leads.length === 0) throw new BadRequestException('No leads with an email address to campaign against.');

    const plan = await this.prisma.warmupPlan.create({ data: { startDate, totalDays: 30 } });

    let used = 0;
    for (let day = 1; day <= 30 && used < leads.length; day++) {
      const quota = getQuota(day);
      const batchDate = new Date(startDate);
      batchDate.setDate(batchDate.getDate() + day - 1);

      const batch = await this.prisma.warmupBatch.create({ data: { planId: plan.id, dayNumber: day, date: batchDate, quota } });

      const selected = leads.slice(used, used + quota);
      used += quota;
      for (const lead of selected) {
        await this.prisma.warmupBatchLead.create({ data: { batchId: batch.id, leadId: lead.id } });
      }
    }

    return { success: true, planId: plan.id, totalLeads: leads.length };
  }

  @Delete()
  async remove() {
    const plans = await this.prisma.warmupPlan.findMany({ include: { batches: { select: { id: true } } } });
    for (const plan of plans) {
      const batchIds = plan.batches.map((b) => b.id);
      if (batchIds.length) {
        await this.prisma.warmupBatchLead.deleteMany({ where: { batchId: { in: batchIds } } });
        await this.prisma.warmupBatch.deleteMany({ where: { planId: plan.id } });
      }
    }
    await this.prisma.warmupPlan.deleteMany();
    return { success: true };
  }

  @Post(':id/advance')
  async advance(@Param('id') id: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextBatch = await this.prisma.warmupBatch.findFirst({
      where: { planId: +id, date: { gte: tomorrow } },
      orderBy: { dayNumber: 'asc' },
    });
    if (!nextBatch) throw new BadRequestException('No future batch to advance to.');

    return this.prisma.warmupBatch.update({ where: { id: nextBatch.id }, data: { date: today } });
  }
}
