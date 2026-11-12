'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import ClubEditor from '@/components/ClubEditor';
import RequireRole from '@/components/RequireRole';
import { Spinner } from '@/components/States';
import type { HostClub } from '@/lib/types';

/**
 * /host/season/new             → 새 하우스 만들기 (시즌 1 오픈)
 * /host/season/new?club={id}   → 기존 하우스의 다음 시즌 오픈
 */
export default function OpenSeasonPage() {
  return (
    <RequireRole role="HOST">
      <Suspense fallback={<Spinner />}>
        <Loader />
      </Suspense>
    </RequireRole>
  );
}

function Loader() {
  const router = useRouter();
  const clubId = useSearchParams().get('club');
  const { data: club, isLoading, error } = useSWR<HostClub>(clubId ? `/host/clubs/${clubId}` : null);
  useEffect(() => {
    if (error) router.replace('/host');
  }, [error, router]);
  if (clubId && (isLoading || !club)) return <Spinner />;
  return <ClubEditor key={club?.id ?? 'new'} mode="open" club={club ?? null} />;
}
