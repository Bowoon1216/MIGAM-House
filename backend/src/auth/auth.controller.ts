import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Req, Res } from '@nestjs/common';
import { AuthProvider, Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { env } from '../common/env';
import { safeReturnTo } from '../common/domain';
import { AuthService, STATE_COOKIE } from './auth.service';
import { DevLoginDto } from './dto';
import { authorizeUrl, fetchProfile, isConfigured, OAuthProvider } from './oauth';

const PROVIDERS: Record<OAuthProvider, AuthProvider> = { kakao: AuthProvider.KAKAO, naver: AuthProvider.NAVER };

function parseProvider(value: string): OAuthProvider {
  if (value !== 'kakao' && value !== 'naver') throw new NotFoundException();
  return value;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('providers')
  providers() {
    return {
      kakao: isConfigured('kakao'),
      naver: isConfigured('naver'),
      dev: env.allowDevLogin,
    };
  }

  @Get(':provider')
  start(@Param('provider') providerParam: string, @Query('returnTo') returnTo: string, @Res() res: Response) {
    const provider = parseProvider(providerParam);
    if (!isConfigured(provider)) throw new BadRequestException(`${provider} 로그인이 설정되지 않았습니다.`);
    const nonce = randomBytes(16).toString('hex');
    this.auth.setState(res, `${nonce}|${safeReturnTo(returnTo)}`);
    res.redirect(authorizeUrl(provider, nonce));
  }

  @Get(':provider/callback')
  async callback(
    @Param('provider') providerParam: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const provider = parseProvider(providerParam);
    const [nonce, returnTo] = String(req.cookies?.[STATE_COOKIE] ?? '').split('|');
    this.auth.clearState(res);

    if (!code || !nonce || nonce !== state) {
      return res.redirect(`${env.frontendUrl}/?loginError=state`);
    }
    try {
      const profile = await fetchProfile(provider, code, state);
      const user = await this.auth.upsertUser(PROVIDERS[provider], profile);
      await this.auth.issueSession(res, user);
      return res.redirect(`${env.frontendUrl}${safeReturnTo(returnTo)}`);
    } catch (e) {
      console.error(`[auth] ${provider} login failed`, e);
      return res.redirect(`${env.frontendUrl}/?loginError=${provider}`);
    }
  }

  /** 개발/테스트용 로그인. production에서는 ALLOW_DEV_LOGIN=true일 때만 동작 */
  @Post('dev-login')
  async devLogin(@Body() dto: DevLoginDto, @Res({ passthrough: true }) res: Response) {
    if (!env.allowDevLogin) throw new NotFoundException();
    const names: Record<Role, string> = { USER: '테스트 유저', HOST: '테스트 호스트', ADMIN: '테스트 관리자' };
    const user = await this.auth.upsertUser(
      AuthProvider.DEV,
      // name을 넘기면 별도 테스트 계정 생성 (예: 여러 유저로 테스트)
      { snsId: dto.name ? `${dto.role.toLowerCase()}:${dto.name}` : dto.role.toLowerCase(), name: dto.name ?? names[dto.role] },
      dto.role,
    );
    await this.auth.issueSession(res, user);
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.auth.clearSession(res);
    return { ok: true };
  }
}
