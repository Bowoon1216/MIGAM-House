import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, Role, User } from '@prisma/client';
import { CookieOptions, Response } from 'express';
import { env } from '../common/env';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthProfile } from './oauth';

export const AUTH_COOKIE = 'migam_token';
export const STATE_COOKIE = 'migam_oauth_state';
const SESSION_DAYS = 30;

const baseCookie = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
  path: '/',
});

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async upsertUser(provider: AuthProvider, profile: OAuthProfile, roleOverride?: Role): Promise<User> {
    const isAdmin = env.adminSnsIds.includes(`${provider}:${profile.snsId}`);
    const user = await this.prisma.user.upsert({
      where: { provider_snsId: { provider, snsId: profile.snsId } },
      create: {
        provider,
        snsId: profile.snsId,
        name: profile.name,
        email: profile.email,
        profileImg: profile.profileImg,
        role: roleOverride ?? (isAdmin ? Role.ADMIN : Role.USER),
      },
      update: {
        email: profile.email ?? undefined,
        profileImg: profile.profileImg ?? undefined,
        ...(roleOverride ? { role: roleOverride } : isAdmin ? { role: Role.ADMIN } : {}),
      },
    });
    return user;
  }

  async issueSession(res: Response, user: User) {
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    res.cookie(AUTH_COOKIE, token, { ...baseCookie(), maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
  }

  clearSession(res: Response) {
    res.clearCookie(AUTH_COOKIE, baseCookie());
  }

  setState(res: Response, value: string) {
    res.cookie(STATE_COOKIE, value, { ...baseCookie(), maxAge: 10 * 60 * 1000 });
  }

  clearState(res: Response) {
    res.clearCookie(STATE_COOKIE, baseCookie());
  }
}
