import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Query } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto, UpdateRoleDto } from './dto';

const normalizeInsta = (v?: string) => (v ? v.replace(/^@/, '') : v);

@Controller()
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  /** 로그인 상태 조회 (비로그인 시 null) */
  @Get('me')
  me(@CurrentUser() user: User | null) {
    return user;
  }

  @Auth()
  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: { name: dto.name, instagramId: normalizeInsta(dto.instagramId) },
    });
  }

  @Auth(Role.ADMIN)
  @Get('admin/users')
  search(@Query('q') q?: string, @Query('role') role?: string) {
    const where: Prisma.UserWhereInput = {};
    const term = q?.trim().replace(/^@/, '');
    if (term) {
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { instagramId: { contains: term, mode: 'insensitive' } },
        { snsId: term },
      ];
    }
    if (role && (Object.values(Role) as string[]).includes(role)) where.role = role as Role;
    return this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  @Auth(Role.ADMIN)
  @Patch('admin/users/:id/role')
  async updateRole(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    if (id === admin.id) throw new BadRequestException('자기 자신의 권한은 변경할 수 없습니다.');
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('유저를 찾을 수 없습니다.');
    if (target.role === Role.ADMIN) throw new BadRequestException('관리자 권한은 여기서 변경할 수 없습니다.');
    return this.prisma.user.update({ where: { id }, data: { role: dto.role } });
  }
}
