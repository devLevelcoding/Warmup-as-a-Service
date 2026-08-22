import { Body, Controller, Get, Patch } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Singleton (id fixed at 1) — see schema.prisma's comment. The "white-label"
// half of "white-label the drip engine and country/phase dashboard."
@Controller('sender-identity')
export class SenderIdentityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const existing = await this.prisma.senderIdentity.findUnique({ where: { id: 1 } });
    if (existing) return existing;
    return this.prisma.senderIdentity.create({ data: { id: 1 } });
  }

  @Patch()
  async update(@Body() body: any) {
    const data: any = {};
    for (const key of ['senderName', 'companyName', 'email', 'phone', 'bookingLink', 'linkedinUrl']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    await this.prisma.senderIdentity.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
    return this.prisma.senderIdentity.findUnique({ where: { id: 1 } });
  }
}
