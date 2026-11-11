import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_KEY } from './auth.decorators';
import { AUTH_COOKIE } from './auth.service';

/** 전역 가드: 쿠키 JWT가 있으면 req.user를 채우고, @Auth 메타데이터에 따라 접근 제어 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token: string | undefined = req.cookies?.[AUTH_COOKIE];

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
        req.user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      } catch {
        req.user = null;
      }
    }

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(AUTH_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (roles === undefined) return true;
    if (!req.user) throw new UnauthorizedException('로그인이 필요합니다.');
    if (roles.length === 0 || req.user.role === Role.ADMIN || roles.includes(req.user.role)) return true;
    throw new ForbiddenException('권한이 없습니다.');
  }
}
