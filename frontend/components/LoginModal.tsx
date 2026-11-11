'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { api, json } from '@/lib/api';
import { loginUrl, useMe } from '@/lib/auth';
import type { AuthProviders, Role } from '@/lib/types';

export default function LoginModal({ returnTo, onClose }: { returnTo: string; onClose: () => void }) {
  const { data: providers } = useSWR<AuthProviders>('/auth/providers');
  const { mutate } = useMe();
  const router = useRouter();

  const devLogin = async (role: Role) => {
    await api('/auth/dev-login', { method: 'POST', ...json({ role }) });
    await mutate();
    onClose();
    router.push(returnTo);
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-3xl bg-ivory p-6 pb-8 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-6 text-center">
          <p className="font-display text-2xl font-medium tracking-[0.18em]">MIGAM</p>
          <p className="mt-1 text-sm text-muted">동경하던 그 사람의 클럽에 합류해보세요</p>
        </div>

        <div className="space-y-2.5">
          <a
            href={loginUrl('kakao', returnTo)}
            aria-disabled={!providers?.kakao}
            className={`btn w-full bg-[#FEE500] py-3 text-[#191919] ${providers?.kakao ? '' : 'pointer-events-none opacity-40'}`}
          >
            카카오로 시작하기
          </a>
          <a
            href={loginUrl('naver', returnTo)}
            aria-disabled={!providers?.naver}
            className={`btn w-full bg-[#03C75A] py-3 text-white ${providers?.naver ? '' : 'pointer-events-none opacity-40'}`}
          >
            네이버로 시작하기
          </a>
        </div>

        {providers?.dev && (
          <div className="mt-6 border-t border-dashed border-line pt-4">
            <p className="mb-2 text-center text-xs text-muted">개발용 로그인</p>
            <div className="grid grid-cols-3 gap-2">
              {(['USER', 'HOST', 'ADMIN'] as Role[]).map((r) => (
                <button key={r} className="btn-outline btn-sm" onClick={() => devLogin(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="mt-5 w-full text-center text-sm text-muted" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
