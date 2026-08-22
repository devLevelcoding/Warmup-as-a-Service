import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { interpolate, DEFAULT_TEMPLATE } from './warmup/interpolate.util';

@Controller('leads')
export class LeadsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const take = +limit;
    const skip = (+page - 1) * take;
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.lead.count({ where }),
    ]);
    return { data, total, page: +page, limit: take };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.lead.findUnique({ where: { id: +id }, include: { emailLogs: { orderBy: { sentAt: 'desc' } } } });
  }

  @Post()
  create(@Body() body: any) {
    const { name, category, city, country, phone, email, website } = body;
    if (!name) throw new BadRequestException('name is required');
    return this.prisma.lead.create({ data: { name, category, city, country, phone, email, website } });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const data: any = {};
    for (const key of ['name', 'category', 'city', 'country', 'phone', 'email', 'website', 'status']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return this.prisma.lead.update({ where: { id: +id }, data });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.lead.update({ where: { id: +id }, data: { deletedAt: new Date() } });
  }

  // Interpolated preview of a template against this lead + the current
  // white-label sender identity — the "Copy Email" workflow from the
  // source's builders.ts, minus the clipboard step (frontend copies it).
  @Get(':id/compose')
  async compose(@Param('id') id: string, @Query('templateId') templateId?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: +id } });
    if (!lead) throw new BadRequestException('Lead not found');

    let sender = await this.prisma.senderIdentity.findUnique({ where: { id: 1 } });
    if (!sender) sender = await this.prisma.senderIdentity.create({ data: { id: 1 } });

    let template: { id: number | null; subject: string; body: string };
    if (templateId) {
      const t = await this.prisma.emailTemplate.findUnique({ where: { id: +templateId } });
      if (!t) throw new BadRequestException('Template not found');
      template = t;
    } else {
      template = { id: null, ...DEFAULT_TEMPLATE };
    }

    return {
      templateId: template.id,
      subject: interpolate(template.subject, lead, sender),
      body: interpolate(template.body, lead, sender),
    };
  }
}
