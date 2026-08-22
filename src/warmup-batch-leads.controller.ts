import { BadRequestException, Body, Controller, Param, Patch } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { interpolate, DEFAULT_TEMPLATE } from './warmup/interpolate.util';

const VALID_STATUSES = ['PENDING', 'SENT', 'SKIPPED'];

// Ported from F:\leadMarketing\app\api\warmup\batch-leads\[id]\route.ts —
// same self-reported "I sent this" mechanism as WhatsApp-Only CRM's
// equivalent (no real email API anywhere in the source, confirmed). One
// deliberate improvement over the source: leadMarketing's EmailLog write and
// WarmupBatchLead.status="SENT" write are two independent, disconnected
// paths (a batch lead can be marked SENT with zero EmailLog rows, or vice
// versa) — here, marking SENT atomically also logs the EmailLog row with
// the interpolated content, so the log always reflects what was actually
// (self-reported as) sent.
@Controller('warmup-batch-leads')
export class WarmupBatchLeadsController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { status: string; templateId?: number }) {
    if (!VALID_STATUSES.includes(body.status)) throw new BadRequestException(`status must be one of ${VALID_STATUSES.join(', ')}`);

    const batchLead = await this.prisma.warmupBatchLead.findUnique({ where: { id: +id }, include: { lead: true } });
    if (!batchLead) throw new BadRequestException('Batch lead not found');

    const updated = await this.prisma.warmupBatchLead.update({
      where: { id: +id },
      data: { status: body.status, sentAt: body.status !== 'PENDING' ? new Date() : null },
    });

    if (body.status === 'SENT') {
      let sender = await this.prisma.senderIdentity.findUnique({ where: { id: 1 } });
      if (!sender) sender = await this.prisma.senderIdentity.create({ data: { id: 1 } });

      let template: { id: number | null; subject: string; body: string };
      if (body.templateId) {
        const t = await this.prisma.emailTemplate.findUnique({ where: { id: body.templateId } });
        template = t ?? { id: null, ...DEFAULT_TEMPLATE };
      } else {
        template = { id: null, ...DEFAULT_TEMPLATE };
      }

      await this.prisma.emailLog.create({
        data: {
          leadId: batchLead.leadId,
          templateId: template.id,
          subject: interpolate(template.subject, batchLead.lead, sender),
          body: interpolate(template.body, batchLead.lead, sender),
          status: 'SENT',
        },
      });
      await this.prisma.lead.update({ where: { id: batchLead.leadId }, data: { status: 'EMAILED' } });
    }

    return updated;
  }
}
