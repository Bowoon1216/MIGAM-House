'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import ClubEditor from '@/components/ClubEditor';
import RequireRole from '@/components/RequireRole';
import { Spinner } from '@/components/States';
import type { HostClub } from '@/lib/types';

/** /host/edit?club={하우스 id} */
export default function EditClubPage() {
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
    if (!clubId || error) router.replace('/host');
  }, [clubId, error, router]);
  if (isLoading || !club) return <Spinner />;
  return <ClubEditor key={club.id} mode="edit" club={club} />;
}
