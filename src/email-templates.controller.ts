import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    const data = await this.prisma.emailTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    return { data, total: data.length };
  }

  @Post()
  create(@Body() body: any) {
    const { name, subject, body: content } = body;
    if (!name || !subject || !content) throw new BadRequestException('name, subject, and body are required');
    return this.prisma.emailTemplate.create({ data: { name, subject, body: content } });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const data: any = {};
    for (const key of ['name', 'subject']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (body.body !== undefined) data.body = body.body;
    return this.prisma.emailTemplate.update({ where: { id: +id }, data });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.emailTemplate.delete({ where: { id: +id } });
  }
}
