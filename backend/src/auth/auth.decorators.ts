import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role, User } from '@prisma/client';

export const AUTH_KEY = 'auth:roles';

/**
 * 로그인 필수 엔드포인트. 역할을 넘기면 해당 역할만 허용 (ADMIN은 항상 통과).
 *   @Auth()              → 로그인 유저 누구나
 *   @Auth(Role.HOST)     → HOST, ADMIN
 *   @Auth(Role.ADMIN)    → ADMIN
 */
export const Auth = (...roles: Role[]) => SetMetadata(AUTH_KEY, roles);

/** 인증된 유저 (없으면 null). @Auth() 없는 엔드포인트에서도 선택적으로 사용 가능 */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): User | null => {
  return ctx.switchToHttp().getRequest().user ?? null;
});
