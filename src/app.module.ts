import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { LeadsController } from './leads.controller';
import { EmailTemplatesController } from './email-templates.controller';
import { SenderIdentityController } from './sender-identity.controller';
import { WarmupPlansController } from './warmup-plans.controller';
import { WarmupBatchLeadsController } from './warmup-batch-leads.controller';

@Module({
  controllers: [
    LeadsController,
    EmailTemplatesController,
    SenderIdentityController,
    WarmupPlansController,
    WarmupBatchLeadsController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
