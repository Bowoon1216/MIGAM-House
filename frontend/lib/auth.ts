'use client';

import useSWR from 'swr';
import { api, fetcher } from './api';
import type { Role, User } from './types';

export function useMe() {
  const { data, isLoading, mutate } = useSWR<User | null>('/me', fetcher, { revalidateOnFocus: true });
  return { user: data ?? null, isLoading, mutate };
}

export const hasRole = (user: User | null, role: Role) =>
  !!user && (user.role === 'ADMIN' || user.role === role || role === 'USER');

export async function logout() {
  await api('/auth/logout', { method: 'POST' });
}

export function loginUrl(provider: 'kakao' | 'naver', returnTo: string) {
  return `/api/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
}
