'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import ClubEditor from '@/components/ClubEditor';
import RequireRole from '@/components/RequireRole';
import { Spinner } from '@/components/States';
import type { HostClub } from '@/lib/types';

export default function EditClubPage() {
  return (
    <RequireRole role="HOST">
      <Loader />
    </RequireRole>
  );
}

function Loader() {
  const router = useRouter();
  const { data: club, isLoading } = useSWR<HostClub | null>('/host/club');
  useEffect(() => {
    if (!isLoading && !club) router.replace('/host/season/new');
  }, [isLoading, club, router]);
  if (isLoading || !club) return <Spinner />;
  return <ClubEditor mode="edit" club={club} />;
}
