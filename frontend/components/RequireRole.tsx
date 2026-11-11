'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { hasRole, useMe } from '@/lib/auth';
import type { Role } from '@/lib/types';
import { useLogin } from './Providers';
import { Spinner } from './States';

/** 클라이언트 측 접근 가드 (실제 권한 검사는 백엔드에서 수행) */
export default function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, isLoading } = useMe();
  const { openLogin } = useLogin();

  useEffect(() => {
    if (!isLoading && !user) openLogin();
  }, [isLoading, user, openLogin]);

  if (isLoading) return <Spinner />;
  if (!user) return <div className="py-20 text-center text-sm text-muted">로그인이 필요합니다.</div>;
  if (!hasRole(user, role)) {
    return (
      <div className="py-20 text-center text-sm text-muted">
        접근 권한이 없습니다.
        <div className="mt-4">
          <Link href="/" className="btn-outline">
            홈으로
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
