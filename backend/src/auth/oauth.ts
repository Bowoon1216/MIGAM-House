import { env } from '../common/env';

export type OAuthProvider = 'kakao' | 'naver';

export interface OAuthProfile {
  snsId: string;
  name: string;
  email?: string;
  profileImg?: string;
}

export const callbackUrl = (provider: OAuthProvider) => `${env.frontendUrl}/api/auth/${provider}/callback`;

export function authorizeUrl(provider: OAuthProvider, state: string): string {
  const redirect = encodeURIComponent(callbackUrl(provider));
  if (provider === 'kakao') {
    return `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${env.kakao.clientId}&redirect_uri=${redirect}&state=${state}`;
  }
  return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${env.naver.clientId}&redirect_uri=${redirect}&state=${state}`;
}

export function isConfigured(provider: OAuthProvider): boolean {
  return provider === 'kakao' ? !!env.kakao.clientId : !!(env.naver.clientId && env.naver.clientSecret);
}

async function postForm(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) throw new Error(`OAuth token request failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ access_token?: string; error?: string }>;
}

async function getJson<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`OAuth profile request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchProfile(provider: OAuthProvider, code: string, state: string): Promise<OAuthProfile> {
  if (provider === 'kakao') {
    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: env.kakao.clientId,
      redirect_uri: callbackUrl('kakao'),
      code,
    };
    if (env.kakao.clientSecret) body.client_secret = env.kakao.clientSecret;
    const token = await postForm('https://kauth.kakao.com/oauth/token', body);
    if (!token.access_token) throw new Error('Kakao token missing');
    const me = await getJson<{
      id: number;
      kakao_account?: { email?: string; profile?: { nickname?: string; profile_image_url?: string } };
    }>('https://kapi.kakao.com/v2/user/me', token.access_token);
    return {
      snsId: String(me.id),
      name: me.kakao_account?.profile?.nickname ?? '카카오 사용자',
      email: me.kakao_account?.email,
      profileImg: me.kakao_account?.profile?.profile_image_url,
    };
  }

  const token = await postForm('https://nid.naver.com/oauth2.0/token', {
    grant_type: 'authorization_code',
    client_id: env.naver.clientId,
    client_secret: env.naver.clientSecret,
    code,
    state,
  });
  if (!token.access_token) throw new Error(`Naver token missing: ${token.error ?? ''}`);
  const me = await getJson<{
    response: { id: string; email?: string; name?: string; nickname?: string; profile_image?: string };
  }>('https://openapi.naver.com/v1/nid/me', token.access_token);
  return {
    snsId: me.response.id,
    name: me.response.name ?? me.response.nickname ?? '네이버 사용자',
    email: me.response.email,
    profileImg: me.response.profile_image,
  };
}
