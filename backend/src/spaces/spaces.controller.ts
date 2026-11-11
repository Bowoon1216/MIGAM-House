import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Auth } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto';

@Controller()
export class SpacesController {
  constructor(private readonly prisma: PrismaService) {}

  @Auth(Role.HOST)
  @Get('spaces')
  list() {
    return this.prisma.space.findMany({ orderBy: { createdAt: 'asc' } });
  }

  @Auth(Role.ADMIN)
  @Post('admin/spaces')
  create(@Body() dto: CreateSpaceDto) {
    return this.prisma.space.create({ data: dto });
  }

  @Auth(Role.ADMIN)
  @Delete('admin/spaces/:id')
  async remove(@Param('id') id: string) {
    await this.prisma.space.delete({ where: { id } });
    return { ok: true };
  }
}
